import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const TX_CACHE_PATH = path.join(process.cwd(), "data", "tx_cache.json");
const SELLERS_PATH = path.join(process.cwd(), "data", "sellers.json");

// Treasury Key for payout
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

// 定义解决方案类型
interface Solution {
    id: string;
    error_signature: string;
    solution: string;
    price: string;
    seller_wallet: string;
    seller_reputation: number;
    tags: string[];
    created_at: string;
    // Usage tracking
    usage_count: number;
    total_earnings: string;
    initial_reward: string;
    upvotes: number;
    downvotes: number;
}

interface TxCacheEntry {
    solution_id: string;
    response: object;
    timestamp: string;
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

// 读取交易缓存
function readTxCache(): Record<string, TxCacheEntry> {
    try {
        const data = fs.readFileSync(TX_CACHE_PATH, "utf-8");
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// 写入交易缓存
function writeTxCache(cache: Record<string, TxCacheEntry>): void {
    fs.writeFileSync(TX_CACHE_PATH, JSON.stringify(cache, null, 2));
}

// 从 PAYMENT-RESPONSE header 提取 tx hash
function extractTxHash(request: NextRequest): string | null {
    const paymentResponse = request.headers.get("PAYMENT-RESPONSE");
    if (!paymentResponse) return null;

    try {
        const decoded = JSON.parse(Buffer.from(paymentResponse, 'base64').toString());
        return decoded.transaction || null;
    } catch {
        return null;
    }
}

/**
 * 查询解决方案 API（付费）
 * 此端点受 x402 middleware 保护，只有成功支付后才能访问
 * 
 * 特性:
 * - 支持 id 或 hash 参数查询
 * - Transaction Cache: 相同 tx_hash 返回缓存数据（防止 Race Condition）
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || searchParams.get("hash");
    const errorSignature = searchParams.get("error_signature");

    // 验证参数
    if (!id && !errorSignature) {
        return NextResponse.json(
            { error: "Missing required parameter: id, hash, or error_signature" },
            { status: 400 }
        );
    }

    // 提取 tx_hash 用于缓存
    const txHash = extractTxHash(request);

    // 检查交易缓存（防止 Race Condition）
    if (txHash) {
        const cache = readTxCache();
        if (cache[txHash]) {
            console.log(`[CACHE HIT] Returning cached response for tx: ${txHash.slice(0, 16)}...`);
            return NextResponse.json({
                ...cache[txHash].response,
                cached: true
            });
        }
    }

    // 查找解决方案
    const db = readDB();
    let solution: Solution | undefined;

    if (id) {
        solution = db.find((item) => item.id === id);
    } else if (errorSignature) {
        // Find by error signature (best match)
        solution = db.find((item) =>
            item.error_signature.toLowerCase().includes(errorSignature.toLowerCase()) ||
            errorSignature.toLowerCase().includes(item.error_signature.toLowerCase())
        );
    }

    if (!solution) {
        return NextResponse.json(
            {
                found: false,
                error: "Solution not found for this ID",
                hint: "Use /api/search first to find matching solutions"
            },
            { status: 404 }
        );
    }

    console.log(`[SYMBIONT] Solution purchased: ${solution.id} - Seller: ${solution.seller_wallet}`);

    // ============================================================
    // PAYOUT TO SELLER - Transfer from Treasury to Seller
    // ============================================================
    let payoutTxHash: string | null = null;
    const payoutAmount = solution.price || "0.01"; // Default to query price

    if (txHash && solution.seller_wallet) {
        try {
            const account = privateKeyToAccount(TREASURY_PRIVATE_KEY as `0x${string}`);
            const client = createWalletClient({
                account,
                chain: baseSepolia,
                transport: http()
            });

            console.log(`[PAYOUT] Forwarding ${payoutAmount} USDC to Seller ${solution.seller_wallet}...`);

            const hash = await client.writeContract({
                address: USDC_ADDRESS,
                abi: USDC_ABI,
                functionName: 'transfer',
                args: [solution.seller_wallet as `0x${string}`, parseUnits(payoutAmount, 6)]
            });

            payoutTxHash = hash;
            console.log(`[PAYOUT] Success! Seller paid. Tx: ${hash}`);

            // Update seller earnings
            try {
                const sellersData = fs.readFileSync(SELLERS_PATH, "utf-8");
                const sellers = JSON.parse(sellersData);
                const seller = sellers[solution.seller_wallet.toLowerCase()];
                if (seller) {
                    const currentEarnings = parseFloat(seller.total_earnings || "0");
                    seller.total_earnings = (currentEarnings + parseFloat(payoutAmount)).toFixed(2);
                    seller.total_sales = (seller.total_sales || 0) + 1;
                    sellers[solution.seller_wallet.toLowerCase()] = seller;
                    fs.writeFileSync(SELLERS_PATH, JSON.stringify(sellers, null, 2));
                    console.log(`[SELLER] Updated earnings for ${solution.seller_wallet}: ${seller.total_earnings} USDC`);
                }
            } catch (e) {
                console.error(`[SELLER] Failed to update earnings:`, e);
            }

            // Update solution usage stats in database
            try {
                const db = readDB();
                const solutionIndex = db.findIndex(s => s.id === solution.id);
                if (solutionIndex !== -1) {
                    db[solutionIndex].usage_count = (db[solutionIndex].usage_count || 0) + 1;
                    const currentEarnings = parseFloat(db[solutionIndex].total_earnings || "0");
                    db[solutionIndex].total_earnings = (currentEarnings + parseFloat(payoutAmount)).toFixed(2);
                    writeDB(db);
                    console.log(`[USAGE] Solution ${solution.id} - Usage: ${db[solutionIndex].usage_count}, Earnings: ${db[solutionIndex].total_earnings}`);
                }
            } catch (e) {
                console.error(`[USAGE] Failed to update usage stats:`, e);
            }

        } catch (txError) {
            console.error(`[PAYOUT] Failed to pay seller:`, txError);
        }
    }

    // 构建响应
    const response = {
        found: true,
        paidContent: true,
        id: solution.id,
        error_signature: solution.error_signature,
        solution: solution.solution,
        price: payoutAmount,
        seller_wallet: solution.seller_wallet,
        seller_reputation: solution.seller_reputation,
        tags: solution.tags,
        tx_hash: payoutTxHash,
        message: payoutTxHash
            ? `Payment verified via x402. Seller received ${payoutAmount} USDC!`
            : "Payment verified via x402. Here's your solution!"
    };

    // 缓存交易结果（防止重复扣款）
    if (txHash) {
        const cache = readTxCache();
        cache[txHash] = {
            solution_id: solution.id,
            response,
            timestamp: new Date().toISOString()
        };
        writeTxCache(cache);
        console.log(`[CACHE] Stored response for tx: ${txHash.slice(0, 16)}...`);
    }

    return NextResponse.json(response);
}
