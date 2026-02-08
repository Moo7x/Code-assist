import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const SELLERS_PATH = path.join(process.cwd(), "data", "sellers.json");
const PENDING_PATH = path.join(process.cwd(), "data", "pending_payments.json");

// Treasury for payouts
const TREASURY_PRIVATE_KEY = "0xfba0e048d02259cbfee5ca1866d9ccae15d9d84f14a212c4d8e3395c017baafb";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const USDC_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

interface Solution {
    id: string;
    seller_wallet: string;
    upvotes: number;
    downvotes: number;
    total_earnings?: string;
    [key: string]: any;
}

interface PendingPayment {
    id: string;
    solution_id: string;
    agent_wallet: string;
    seller_wallet: string;
    amount: string;
    status: "pending" | "settled" | "refunded";
    payment_tx: string;
    created_at: string;
    expires_at: string;
    settled_tx?: string;
}

function readDB(): Solution[] {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    } catch {
        return [];
    }
}

function writeDB(data: Solution[]): void {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function readSellers(): Record<string, any> {
    try {
        return JSON.parse(fs.readFileSync(SELLERS_PATH, "utf-8"));
    } catch {
        return {};
    }
}

function writeSellers(sellers: Record<string, any>): void {
    fs.writeFileSync(SELLERS_PATH, JSON.stringify(sellers, null, 2));
}

function readPendingPayments(): PendingPayment[] {
    try {
        return JSON.parse(fs.readFileSync(PENDING_PATH, "utf-8"));
    } catch {
        return [];
    }
}

function writePendingPayments(payments: PendingPayment[]): void {
    fs.writeFileSync(PENDING_PATH, JSON.stringify(payments, null, 2));
}

/**
 * Vote on a solution (upvote or downvote)
 * POST /api/vote
 * Body: { solution_id: string, vote: "up" | "down", agent_wallet?: string }
 * 
 * ESCROW SETTLEMENT:
 * - upvote: Release pending payment to seller
 * - downvote: Refund pending payment to agent
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { solution_id, vote, agent_wallet } = body;

        if (!solution_id || !vote || !["up", "down"].includes(vote)) {
            return NextResponse.json(
                { error: "Missing required fields: solution_id and vote (up/down)" },
                { status: 400 }
            );
        }

        const db = readDB();
        const solutionIndex = db.findIndex(s => s.id === solution_id);

        if (solutionIndex === -1) {
            return NextResponse.json(
                { error: "Solution not found" },
                { status: 404 }
            );
        }

        const solution = db[solutionIndex];

        // Update votes
        if (vote === "up") {
            solution.upvotes = (solution.upvotes || 0) + 1;
        } else {
            solution.downvotes = (solution.downvotes || 0) + 1;
        }

        // Calculate success rate
        const totalVotes = solution.upvotes + solution.downvotes;
        const successRate = totalVotes > 0
            ? Math.round((solution.upvotes / totalVotes) * 100)
            : 100;

        // Update in DB
        db[solutionIndex] = solution;
        writeDB(db);

        // Update seller reputation based on votes
        const sellers = readSellers();
        const seller = sellers[solution.seller_wallet.toLowerCase()];
        if (seller) {
            const adjustment = vote === "up" ? 1 : -2;
            seller.reputation_score = Math.max(0, Math.min(100,
                (seller.reputation_score || 50) + adjustment
            ));
            sellers[solution.seller_wallet.toLowerCase()] = seller;
            writeSellers(sellers);
        }

        // ============================================================
        // ESCROW SETTLEMENT: Process pending payment based on vote
        // ============================================================
        let settlementResult: any = null;

        const pendingPayments = readPendingPayments();
        // Find pending payment for this solution (from this agent if specified)
        const paymentIndex = pendingPayments.findIndex(p =>
            p.solution_id === solution_id &&
            p.status === "pending" &&
            (!agent_wallet || p.agent_wallet.toLowerCase() === agent_wallet.toLowerCase())
        );

        if (paymentIndex !== -1) {
            const payment = pendingPayments[paymentIndex];

            try {
                const account = privateKeyToAccount(TREASURY_PRIVATE_KEY as `0x${string}`);
                const client = createWalletClient({
                    account,
                    chain: baseSepolia,
                    transport: http()
                });

                if (vote === "up") {
                    // UPVOTE: Release payment to seller
                    console.log(`[SETTLE] Upvote - Releasing ${payment.amount} USDC to seller ${payment.seller_wallet}`);

                    const hash = await client.writeContract({
                        address: USDC_ADDRESS,
                        abi: USDC_ABI,
                        functionName: 'transfer',
                        args: [payment.seller_wallet as `0x${string}`, parseUnits(payment.amount, 6)]
                    });

                    payment.status = "settled";
                    payment.settled_tx = hash;
                    console.log(`[SETTLE] Seller paid! Tx: ${hash}`);

                    // Update seller earnings
                    if (seller) {
                        const currentEarnings = parseFloat(seller.total_earnings || "0");
                        seller.total_earnings = (currentEarnings + parseFloat(payment.amount)).toFixed(2);
                        seller.total_sales = (seller.total_sales || 0) + 1;
                        sellers[solution.seller_wallet.toLowerCase()] = seller;
                        writeSellers(sellers);
                    }

                    // Update solution total_earnings
                    const currentSolEarnings = parseFloat(solution.total_earnings || "0");
                    solution.total_earnings = (currentSolEarnings + parseFloat(payment.amount)).toFixed(2);
                    db[solutionIndex] = solution;
                    writeDB(db);

                    settlementResult = {
                        action: "released_to_seller",
                        amount: payment.amount,
                        recipient: payment.seller_wallet,
                        tx_hash: hash
                    };

                } else {
                    // DOWNVOTE: Refund payment to agent
                    console.log(`[SETTLE] Downvote - Refunding ${payment.amount} USDC to agent ${payment.agent_wallet}`);

                    const hash = await client.writeContract({
                        address: USDC_ADDRESS,
                        abi: USDC_ABI,
                        functionName: 'transfer',
                        args: [payment.agent_wallet as `0x${string}`, parseUnits(payment.amount, 6)]
                    });

                    payment.status = "refunded";
                    payment.settled_tx = hash;
                    console.log(`[SETTLE] Agent refunded! Tx: ${hash}`);

                    settlementResult = {
                        action: "refunded_to_agent",
                        amount: payment.amount,
                        recipient: payment.agent_wallet,
                        tx_hash: hash
                    };
                }

                pendingPayments[paymentIndex] = payment;
                writePendingPayments(pendingPayments);

            } catch (txError) {
                console.error(`[SETTLE] Transaction failed:`, txError);
                settlementResult = {
                    action: "settlement_failed",
                    error: String(txError)
                };
            }
        }

        console.log(`[VOTE] Solution ${solution_id}: ${vote}vote - Success Rate: ${successRate}%`);

        return NextResponse.json({
            success: true,
            solution_id,
            vote,
            upvotes: solution.upvotes,
            downvotes: solution.downvotes,
            success_rate: successRate,
            settlement: settlementResult,
            message: settlementResult
                ? `Vote recorded! ${settlementResult.action === "released_to_seller" ? "Seller received payment" : "Agent received refund"}`
                : `Vote recorded: ${vote}vote`
        });

    } catch (error) {
        console.error("[VOTE] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
