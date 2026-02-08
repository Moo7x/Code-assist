import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { calculateReputation, type SellerProfile } from "~/lib/reputation";

import { createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const SELLERS_PATH = path.join(process.cwd(), "data", "sellers.json");
const BOUNTIES_PATH = path.join(process.cwd(), "data", "bounties.json");

// USDC Contract Logic
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const TREASURY_PRIVATE_KEY = "0xfba0e048d02259cbfee5ca1866d9ccae15d9d84f14a212c4d8e3395c017baafb";

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

// 定义解决方案类型
interface Solution {
    id: string;
    error_signature: string;
    solution: string;
    price: string;  // Per-query price set by human
    seller_wallet: string;
    seller_reputation: number;
    tags: string[];
    environment?: {
        os: string[];
        runtime: string;
        runtime_version: string;
        dependencies: Record<string, string>;
    };
    created_at: string;
    // Usage tracking
    usage_count: number;
    total_earnings: string;
    initial_reward: string;
    upvotes: number;
    downvotes: number;
    bounty_id?: string;
}

// 读取数据库
function readDB(): Solution[] {
    try {
        const data = fs.readFileSync(DB_PATH, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// 写入数据库
function writeDB(data: Solution[]): void {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// 读取卖家数据库
function readSellers(): Record<string, SellerProfile> {
    try {
        return JSON.parse(fs.readFileSync(SELLERS_PATH, "utf-8"));
    } catch {
        return {};
    }
}

// 写入卖家数据库
function writeSellers(sellers: Record<string, SellerProfile>): void {
    fs.writeFileSync(SELLERS_PATH, JSON.stringify(sellers, null, 2));
}

function readBounties(): any[] {
    try {
        const data = fs.readFileSync(BOUNTIES_PATH, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writeBounties(data: any[]): void {
    fs.writeFileSync(BOUNTIES_PATH, JSON.stringify(data, null, 2));
}

// 生成错误签名的哈希 ID
function generateHash(errorSignature: string): string {
    return crypto.createHash("sha256").update(errorSignature).digest("hex").slice(0, 16);
}



export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { error_signature, solution, price, seller_wallet, tags, environment, bounty_id } = body;

        // 验证必填字段
        if (!error_signature || !solution || !seller_wallet) {
            return NextResponse.json(
                { error: "Missing required fields: error_signature, solution, seller_wallet" },
                { status: 400 }
            );
        }

        // 生成唯一 ID
        const id = generateHash(error_signature);

        // 检查是否已存在
        const db = readDB();
        const existing = db.find((item) => item.id === id);
        if (existing) {
            // 如果有关联的 bounty，标记为已完成并支付给当前 solver
            if (bounty_id) {
                const bounties = readBounties();
                const bountyIndex = bounties.findIndex((b: any) => b.id === bounty_id);
                if (bountyIndex !== -1 && bounties[bountyIndex].status !== "solved") {
                    const bounty = bounties[bountyIndex];
                    bounties[bountyIndex] = {
                        ...bounty,
                        status: "solved",
                        solver_wallet: seller_wallet, // 记录是谁解决的
                        solution_id: existing.id,
                        updated_at: new Date().toISOString()
                    };
                    writeBounties(bounties);
                    console.log(`[BOUNTY] Marked ${bounty_id} as solved by ${seller_wallet} (using existing solution)`);

                    // 仍然支付给解决者
                    try {
                        const account = privateKeyToAccount(TREASURY_PRIVATE_KEY as `0x${string}`);
                        const client = createWalletClient({
                            account,
                            chain: baseSepolia,
                            transport: http()
                        });

                        console.log(`[PAYOUT] Sending ${bounty.reward} USDC to ${seller_wallet} (existing solution)...`);

                        const hash = await client.writeContract({
                            address: USDC_ADDRESS,
                            abi: USDC_ABI,
                            functionName: 'transfer',
                            args: [seller_wallet as `0x${string}`, parseUnits(bounty.reward, 6)]
                        });

                        console.log(`[PAYOUT] Success! Tx: ${hash}`);

                        // 更新 seller earnings
                        const sellers = readSellers();
                        const seller = sellers[seller_wallet.toLowerCase()];
                        if (seller) {
                            const currentEarnings = parseFloat(seller.total_earnings || "0");
                            seller.total_earnings = (currentEarnings + parseFloat(bounty.reward)).toFixed(2);
                            seller.total_sales = (seller.total_sales || 0) + 1;
                            seller.reputation_score = calculateReputation(seller);
                            sellers[seller_wallet.toLowerCase()] = seller;
                            writeSellers(sellers);
                        }

                        return NextResponse.json({
                            success: true,
                            message: "Bounty solved using existing solution",
                            id: existing.id,
                            tx_hash: hash,
                            reward: bounty.reward
                        });

                    } catch (txError) {
                        console.error(`[PAYOUT] Failed:`, txError);
                    }
                }
            }
            return NextResponse.json(
                { error: "Solution for this error already exists", id },
                { status: 409 }
            );
        }

        // ============================================================
        // BOUNTY STATUS UPDATE & REAL PAYOUT LOGIC
        // ============================================================
        let bountyReward = "0.00";
        let txHash = null;

        if (bounty_id) {
            const bounties = readBounties();
            const bountyIndex = bounties.findIndex((b: any) => b.id === bounty_id);

            if (bountyIndex !== -1) {
                const bounty = bounties[bountyIndex];
                bountyReward = bounty.reward;

                // Update Local State
                bounties[bountyIndex] = {
                    ...bounty,
                    status: "solved",
                    solver_wallet: seller_wallet,
                    solution_id: id,
                    updated_at: new Date().toISOString()
                };
                writeBounties(bounties);

                console.log(`[CODE-ASSIST] Bounty ${bounty_id} marked as solved by ${seller_wallet}`);

                try {
                    const account = privateKeyToAccount(TREASURY_PRIVATE_KEY as `0x${string}`);
                    const client = createWalletClient({
                        account,
                        chain: baseSepolia,
                        transport: http()
                    });

                    console.log(`[PAYOUT] Sending ${bountyReward} USDC to ${seller_wallet} via Treasury...`);

                    const hash = await client.writeContract({
                        address: USDC_ADDRESS,
                        abi: USDC_ABI,
                        functionName: 'transfer',
                        args: [seller_wallet as `0x${string}`, parseUnits(bountyReward, 6)]
                    });

                    txHash = hash;
                    console.log(`[PAYOUT] Success! Tx: ${hash}`);

                } catch (txError) {
                    console.error(`[PAYOUT] Failed to send USDC:`, txError);
                }
            }
        }

        // 获取卖家信息
        const sellers = readSellers();
        const seller = sellers[seller_wallet.toLowerCase()];
        const reputation = seller?.reputation_score || 50;

        // 创建新解决方案
        const newSolution: Solution = {
            id,
            error_signature,
            solution,
            price: price || "0.05",  // Default query price
            seller_wallet: seller_wallet.toLowerCase(),
            seller_reputation: reputation,
            tags: tags || [],
            environment: environment || undefined,
            created_at: new Date().toISOString(),
            // Usage tracking - initialized when bounty solved
            usage_count: bounty_id ? 1 : 0,  // Count 1 when solving bounty
            total_earnings: bountyReward,     // Initial earnings from bounty
            initial_reward: bountyReward,     // Record original bounty reward
            upvotes: 0,
            downvotes: 0,
            bounty_id: bounty_id || undefined,
        };

        // 保存到数据库
        db.push(newSolution);
        writeDB(db);

        // 更新卖家销售数和收益
        if (seller) {
            seller.total_sales = (seller.total_sales || 0) + 1;
            // Add bounty reward to total earnings
            const currentEarnings = parseFloat(seller.total_earnings || "0");
            seller.total_earnings = (currentEarnings + parseFloat(bountyReward)).toFixed(2);
            seller.reputation_score = calculateReputation(seller);
            sellers[seller_wallet.toLowerCase()] = seller;
            writeSellers(sellers);
        }

        console.log(`[CODE-ASSIST] Simulating Agent payment to Treasury for solution ${id} (Price: ${newSolution.price} USDC)`);
        console.log(`[CODE-ASSIST] New solution uploaded: ${id} by ${seller_wallet}`);

        return NextResponse.json({
            success: true,
            message: "Solution uploaded successfully",
            id,
            error_signature,
            seller_reputation: reputation,
            tx_hash: txHash,
            reward: bountyReward
        });
    } catch (error) {
        console.error("[CODE-ASSIST] Upload error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// 获取所有解决方案列表（用于前端展示）
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sellerWallet = searchParams.get("seller_wallet");

    let db = readDB();

    if (sellerWallet) {
        db = db.filter((s) => s.seller_wallet.toLowerCase() === sellerWallet.toLowerCase());
    }

    return NextResponse.json({
        count: db.length,
        solutions: db.map((s) => ({
            id: s.id,
            error_signature: s.error_signature,
            price: s.price,
            seller_wallet: s.seller_wallet,
            seller_reputation: s.seller_reputation,
            tags: s.tags,
            environment: s.environment,
            created_at: s.created_at,
            // Usage tracking fields
            usage_count: s.usage_count || 0,
            total_earnings: s.total_earnings || "0.00",
            initial_reward: s.initial_reward || s.price || "0.01",
            upvotes: s.upvotes || 0,
            downvotes: s.downvotes || 0
        })),
    });
}
