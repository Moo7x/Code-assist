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

// 从 PAYMENT-RESPONSE header 提取 agent wallet
function extractAgentWallet(request: NextRequest): string | null {
    const paymentResponse = request.headers.get("PAYMENT-RESPONSE");
    if (!paymentResponse) return null;

    try {
        const decoded = JSON.parse(Buffer.from(paymentResponse, 'base64').toString());
        // x402 payment response contains payer address
        return decoded.payer || decoded.from || null;
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

    console.log(`[CODE-ASSIST] Solution purchased: ${solution.id} - Seller: ${solution.seller_wallet}`);

    // ============================================================
    // ESCROW: Create pending payment instead of immediate payout
    // Payment will be settled when agent votes
    // ============================================================
    const payoutAmount = solution.price || "0.01";
    let pendingPaymentId: string | null = null;

    // Extract agent wallet from tx or header
    const agentWallet = extractAgentWallet(request);

    if (txHash && solution.seller_wallet && agentWallet) {
        try {
            // Create pending payment record
            const PENDING_PATH = path.join(process.cwd(), "data", "pending_payments.json");
            let pendingPayments: any[] = [];
            try {
                pendingPayments = JSON.parse(fs.readFileSync(PENDING_PATH, "utf-8"));
            } catch { pendingPayments = []; }

            pendingPaymentId = `pp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const pendingPayment = {
                id: pendingPaymentId,
                solution_id: solution.id,
                agent_wallet: agentWallet.toLowerCase(),
                seller_wallet: solution.seller_wallet.toLowerCase(),
                amount: payoutAmount,
                status: "pending",  // pending | settled | refunded
                payment_tx: txHash,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h timeout
            };

            pendingPayments.push(pendingPayment);
            fs.writeFileSync(PENDING_PATH, JSON.stringify(pendingPayments, null, 2));

            console.log(`[ESCROW] Created pending payment ${pendingPaymentId}`);
            console.log(`[ESCROW] Amount: ${payoutAmount} USDC will be released after agent votes`);
            console.log(`[ESCROW] Agent: ${agentWallet}, Seller: ${solution.seller_wallet}`);

            // Update solution usage count only (earnings updated after vote)
            const db = readDB();
            const solutionIndex = db.findIndex(s => s.id === solution.id);
            if (solutionIndex !== -1) {
                db[solutionIndex].usage_count = (db[solutionIndex].usage_count || 0) + 1;
                writeDB(db);
                console.log(`[USAGE] Solution ${solution.id} - Usage: ${db[solutionIndex].usage_count}`);
            }

        } catch (escrowError) {
            console.error(`[ESCROW] Failed to create pending payment:`, escrowError);
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
        pending_payment_id: pendingPaymentId,
        escrow: true,
        message: pendingPaymentId
            ? `Payment held in escrow. Vote to release ${payoutAmount} USDC to seller or get refund.`
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
