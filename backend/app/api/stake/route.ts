import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { calculateReputation, getReputationLevel, type SellerProfile } from "~/lib/reputation";
import { createWalletClient, http, encodeFunctionData, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const SELLERS_PATH = path.join(process.cwd(), "data", "sellers.json");
const TREASURY_PRIVATE_KEY = "0xfba0e048d02259cbfee5ca1866d9ccae15d9d84f14a212c4d8e3395c017baafb";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
// Define USDC ABI (Partial)
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
    },
    {
        "inputs": [
            { "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "address", "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

// ...


// 读取/写入卖家数据库
function readSellers(): Record<string, SellerProfile> {
    try {
        return JSON.parse(fs.readFileSync(SELLERS_PATH, "utf-8"));
    } catch {
        return {};
    }
}

function writeSellers(sellers: Record<string, SellerProfile>): void {
    fs.writeFileSync(SELLERS_PATH, JSON.stringify(sellers, null, 2));
}

/**
 * GET /api/stake - 查询质押状态
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
        return NextResponse.json({ error: "Missing wallet parameter" }, { status: 400 });
    }

    const sellers = readSellers();
    const seller = sellers[wallet.toLowerCase()];

    if (!seller) {
        return NextResponse.json({
            wallet: wallet.toLowerCase(),
            staked_amount: "0.00",
            reputation_score: 0,
            can_upload: false,
            required_stake: "10.00",
            message: "Not registered. Please register first via POST /api/seller"
        });
    }

    const canUpload = seller.reputation_score >= 10 || parseFloat(seller.staked_amount) >= 10;

    return NextResponse.json({
        wallet: seller.wallet,
        staked_amount: seller.staked_amount,
        reputation_score: seller.reputation_score,
        level: getReputationLevel(seller.reputation_score),
        can_upload: canUpload,
        required_stake: canUpload ? "0.00" : (10 - parseFloat(seller.staked_amount)).toFixed(2)
    });
}

/**
 * POST /api/stake - 质押代币
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, amount, tx_hash } = body;

        if (!wallet || !amount) {
            return NextResponse.json({
                error: "Missing required fields: wallet, amount"
            }, { status: 400 });
        }

        const stakeAmount = parseFloat(amount);
        if (isNaN(stakeAmount) || stakeAmount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        const sellers = readSellers();
        const walletLower = wallet.toLowerCase();
        let seller = sellers[walletLower];

        // 如果卖家不存在，自动注册
        if (!seller) {
            seller = {
                wallet: walletLower,
                github_username: "",
                github_stars: 0,
                github_contributions: 0,
                joined_at: new Date().toISOString(),
                total_sales: 0,
                success_votes: 0,
                failure_votes: 0,
                staked_amount: "0.00",
                reputation_score: 0
            };
        }

        // 更新质押金额（累加）
        const currentStake = parseFloat(seller.staked_amount) || 0;
        const newStake = currentStake + stakeAmount;
        seller.staked_amount = newStake.toFixed(2);

        // 重新计算信誉 (Wait for it! It's important)
        seller.reputation_score = calculateReputation(seller);

        sellers[walletLower] = seller;
        writeSellers(sellers);

        console.log(`[STAKE] ${walletLower} staked ${stakeAmount} USDC (total: ${newStake})`);
        if (tx_hash) {
            console.log(`[STAKE TX] ${tx_hash}`);
        }

        const canUpload = seller.reputation_score >= 10 || newStake >= 10;

        return NextResponse.json({
            success: true,
            wallet: walletLower,
            staked_amount: seller.staked_amount,
            reputation_score: seller.reputation_score,
            level: getReputationLevel(seller.reputation_score),
            can_upload: canUpload,
            message: canUpload
                ? "Stake successful! You can now upload solutions."
                : `Need ${(10 - newStake).toFixed(2)} more USDC to upload.`
        });
    } catch (error) {
        console.error("Stake Error:", error);
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}

/**
 * DELETE /api/stake - 取消质押 (Withdraw)
 */
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, amount } = body;

        if (!wallet || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const sellers = readSellers();
        const walletLower = wallet.toLowerCase();
        const seller = sellers[walletLower];

        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 });
        }

        const unstakeAmount = parseFloat(amount);
        const currentStake = parseFloat(seller.staked_amount) || 0;

        if (unstakeAmount > currentStake) {
            return NextResponse.json({
                error: "Insufficient staked amount",
                staked: seller.staked_amount
            }, { status: 400 });
        }

        // 1. Perform On-Chain Transfer (Treasury -> User)
        try {
            const account = privateKeyToAccount(TREASURY_PRIVATE_KEY as `0x${string}`);
            const client = createWalletClient({
                account,
                chain: baseSepolia,
                transport: http("https://sepolia.base.org")
            });

            const amountBigInt = parseUnits(amount.toString(), 6); // USDC 6 decimals

            // Encode transfer(to, amount)
            const data = encodeFunctionData({
                abi: USDC_ABI,
                functionName: 'transfer',
                args: [walletLower as `0x${string}`, amountBigInt]
            });

            console.log(`[WITHDRAW] Sending ${amount} USDC to ${walletLower}...`);
            const hash = await client.sendTransaction({
                to: USDC_ADDRESS, // This should be the USDC token contract address
                data,
                value: BigInt(0)
            });
            console.log(`[WITHDRAW TX] ${hash}`);

        } catch (chainError: any) {
            console.error("Withdrawal Transaction Failed:", chainError);
            return NextResponse.json({
                error: "On-chain withdrawal failed. Please try again later.",
                details: chainError.message
            }, { status: 500 });
        }

        // 2. Update DB
        const newStake = currentStake - unstakeAmount;
        seller.staked_amount = newStake.toFixed(2);
        seller.reputation_score = calculateReputation(seller);

        sellers[walletLower] = seller;
        writeSellers(sellers);

        return NextResponse.json({
            success: true,
            unstaked: unstakeAmount.toFixed(2),
            remaining_stake: seller.staked_amount,
            reputation_score: seller.reputation_score
        });

    } catch (error) {
        console.error("Withdraw Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
