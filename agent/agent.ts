/**
 * Symbiont AI Agent Demo Script (v5 - 悬赏板版)
 * 
 * 完整流程:
 * 1. 收集环境信息
 * 2. 遇到错误，智能搜索
 * 3a. 找到解决方案 → x402 支付 → 获取修复
 * 3b. 未找到 → 提交悬赏 → 等待 → 轮询检查 → 获取修复
 */

import * as dotenv from "dotenv";
dotenv.config();

import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import * as os from "os";

// 配置
const API_BASE = process.env.API_BASE_URL || "http://localhost:3000";
const MIN_REPUTATION = 50;
const MAX_PRICE = 0.10;
const MIN_CONFIDENCE = 40;
const BOUNTY_REWARD = "1.00";  // 悬赏奖励 USDC
const POLL_INTERVAL = 5000;   // 轮询间隔 5秒
const MAX_POLL_ATTEMPTS = 6;  // 最多轮询 6 次 (30秒)

// 颜色输出
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
};

function log(prefix: string, color: string, message: string) {
    console.log(`${color}${prefix}${colors.reset} ${message}`);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取当前环境信息
function getEnvironment() {
    const platform = os.platform();
    const osName = platform === 'win32' ? 'windows' :
        platform === 'darwin' ? 'macos' : 'linux';

    return {
        os: osName,
        runtime: "nodejs",
        runtime_version: process.version.replace('v', ''),
        dependencies: {
            "viem": "2.38.4",
            "@x402/fetch": "2.2.0"
        }
    };
}

// 搜索结果类型
interface SearchResult {
    id: string;
    error_signature: string;
    price: string;
    seller_wallet: string;
    seller_reputation: number;
    tags: string[];
    matchType: string;
    confidence: number;
    environmentMatch: number;
    matchReason: string;
}

interface Bounty {
    id: string;
    status: string;
    solution_id: string | null;
    reward: string;
}

async function main() {
    console.log("\n" + "=".repeat(60));
    console.log("🤖 SYMBIONT AI AGENT v5 - 悬赏板版");
    console.log("=".repeat(60) + "\n");

    const privateKey = process.env.AGENT_PRIVATE_KEY;
    if (!privateKey || privateKey === "0xYourAgentPrivateKeyHere") {
        log("[ERROR]", colors.red, "请在 .env 文件中设置 AGENT_PRIVATE_KEY");
        return;
    }

    const signer = privateKeyToAccount(privateKey as `0x${string}`);
    log("[AGENT]", colors.cyan, `钱包地址: ${signer.address}`);

    // ==================== 收集环境信息 ====================
    const env = getEnvironment();
    console.log("");
    log("[ENV]", colors.blue, "╔══════════════════════════════════════════╗");
    log("[ENV]", colors.blue, "║          📋 当前运行环境                  ║");
    log("[ENV]", colors.blue, "╚══════════════════════════════════════════╝");
    log("[ENV]", colors.gray, `操作系统: ${env.os} | 运行时: ${env.runtime} ${env.runtime_version}`);
    console.log("");

    // ==================== 模拟编译错误 ====================
    log("[AGENT]", colors.cyan, "正在编译项目...");
    await sleep(1000);

    // 使用一个不存在于数据库的错误来测试悬赏流程
    const errorMessage = process.argv[2] || "ReferenceError: process is not defined at line 42";

    console.log("");
    log("[ERROR]", colors.red, "═══════════════════════════════════════════");
    log("[ERROR]", colors.red, `致命错误: ${errorMessage}`);
    log("[ERROR]", colors.red, "═══════════════════════════════════════════");
    console.log("");

    // ==================== 智能搜索 ====================
    log("[AGENT]", colors.cyan, "正在智能搜索 Symbiont 网络...");
    await sleep(500);

    const envParams = new URLSearchParams({
        query: errorMessage,
        min_confidence: MIN_CONFIDENCE.toString(),
        os: env.os,
        runtime: env.runtime,
        runtime_version: env.runtime_version,
        dependencies: JSON.stringify(env.dependencies)
    });

    const searchUrl = `${API_BASE}/api/search?${envParams.toString()}`;

    try {
        const searchResponse = await fetch(searchUrl);

        // ==================== 路径 B: 未找到 → 提交悬赏 ====================
        if (searchResponse.status === 404) {
            console.log("");
            log("[SYMBIONT]", colors.yellow, "╔══════════════════════════════════════════╗");
            log("[SYMBIONT]", colors.yellow, "║        ❓ 未找到现有解决方案              ║");
            log("[SYMBIONT]", colors.yellow, "╚══════════════════════════════════════════╝");
            console.log("");

            log("[AGENT]", colors.yellow, "📋 正在提交到悬赏板...");

            // 提交悬赏
            const bountyResponse = await fetch(`${API_BASE}/api/bounty`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    error_signature: errorMessage,
                    environment: env,
                    reward: BOUNTY_REWARD,
                    agent_wallet: signer.address
                })
            });

            const bountyData = await bountyResponse.json() as { success: boolean; bounty: Bounty };

            if (!bountyData.success) {
                log("[ERROR]", colors.red, "悬赏提交失败");
                return;
            }

            const bounty = bountyData.bounty;
            console.log("");
            log("[BOUNTY]", colors.magenta, "╔══════════════════════════════════════════╗");
            log("[BOUNTY]", colors.magenta, "║        📜 悬赏已创建                      ║");
            log("[BOUNTY]", colors.magenta, "╚══════════════════════════════════════════╝");
            log("[BOUNTY]", colors.gray, `悬赏 ID: ${bounty.id}`);
            log("[BOUNTY]", colors.gray, `奖励: ${bounty.reward} USDC`);
            log("[BOUNTY]", colors.gray, "等待人类专家解决...");
            console.log("");

            // ==================== 轮询等待解决方案 ====================
            log("[AGENT]", colors.cyan, "💤 进入等待模式，每 5 秒检查一次...");

            for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
                await sleep(POLL_INTERVAL);

                log("[POLL]", colors.gray, `检查悬赏状态... (${attempt}/${MAX_POLL_ATTEMPTS})`);

                const statusResponse = await fetch(`${API_BASE}/api/bounty?id=${bounty.id}`);
                const statusData = await statusResponse.json() as { bounty: Bounty };

                if (statusData.bounty.status === "solved" && statusData.bounty.solution_id) {
                    console.log("");
                    log("[AGENT]", colors.green, "╔══════════════════════════════════════════╗");
                    log("[AGENT]", colors.green, "║        🔔 悬赏已解决! Agent 唤醒          ║");
                    log("[AGENT]", colors.green, "╚══════════════════════════════════════════╝");
                    console.log("");

                    // 获取解决方案（付费）
                    await purchaseSolution(statusData.bounty.solution_id, signer);
                    return;
                }
            }

            log("[AGENT]", colors.yellow, "⏰ 等待超时，稍后再检查");
            log("[TIP]", colors.gray, `可手动检查: GET /api/bounty?id=${bounty.id}`);
            return;
        }

        // ==================== 路径 A: 找到解决方案 → 购买 ====================
        if (!searchResponse.ok) {
            log("[ERROR]", colors.red, `搜索失败: ${searchResponse.status}`);
            return;
        }

        const searchData = await searchResponse.json() as {
            found: boolean;
            totalMatches: number;
            results: SearchResult[];
        };

        console.log("");
        log("[SYMBIONT]", colors.green, "╔══════════════════════════════════════════╗");
        log("[SYMBIONT]", colors.green, `║   🔍 找到 ${searchData.totalMatches} 个匹配的解决方案              ║`);
        log("[SYMBIONT]", colors.green, "╚══════════════════════════════════════════╝");
        console.log("");

        const bestMatch = searchData.results[0];
        log("[MATCH]", colors.magenta, `${bestMatch.matchType.toUpperCase()} (${bestMatch.confidence}% 置信度, ${bestMatch.environmentMatch}% 环境匹配)`);
        log("[MATCH]", colors.gray, `价格: ${bestMatch.price} USDC | 信誉: ${bestMatch.seller_reputation}/100`);
        console.log("");

        // 决策检查
        if (bestMatch.seller_reputation < MIN_REPUTATION) {
            log("[AGENT]", colors.yellow, `⚠️ 卖家信誉过低, 跳过`);
            return;
        }
        if (parseFloat(bestMatch.price) > MAX_PRICE) {
            log("[AGENT]", colors.yellow, `⚠️ 价格过高, 跳过`);
            return;
        }

        log("[AGENT]", colors.green, `✓ 检查通过，准备购买`);

        await purchaseSolution(bestMatch.id, signer);

    } catch (error) {
        log("[ERROR]", colors.red, `请求失败: ${error instanceof Error ? error.message : String(error)}`);
        log("[TIP]", colors.yellow, "请确保后端服务正在运行: cd backend && npm run dev");
    }
}

/**
 * 购买解决方案
 */
async function purchaseSolution(solutionId: string, signer: ReturnType<typeof privateKeyToAccount>) {
    log("[AGENT]", colors.yellow, "💳 准备购买解决方案...");

    const client = new x402Client();
    registerExactEvmScheme(client, { signer });

    const queryUrl = `${API_BASE}/api/query?id=${solutionId}`;
    const initialResponse = await fetch(queryUrl);

    if (initialResponse.status !== 402) {
        log("[ERROR]", colors.red, `意外响应: ${initialResponse.status}`);
        return;
    }

    log("[AGENT]", colors.yellow, "📝 签名支付授权 (EIP-712)...");
    await sleep(500);

    log("[AGENT]", colors.yellow, "💸 发送 x402 支付...");
    const fetchWithPayment = wrapFetchWithPayment(fetch, client);
    const paidResponse = await fetchWithPayment(queryUrl);

    if (!paidResponse.ok) {
        log("[ERROR]", colors.red, `支付失败: ${paidResponse.status}`);
        return;
    }

    const solution = await paidResponse.json() as { solution: string };

    console.log("");
    log("[AGENT]", colors.green, "╔══════════════════════════════════════════╗");
    log("[AGENT]", colors.green, "║        ✅ 支付成功! 获取完整解决方案      ║");
    log("[AGENT]", colors.green, "╚══════════════════════════════════════════╝");
    console.log("");
    log("[SOLUTION]", colors.green, `修复代码: ${solution.solution}`);
    console.log("");

    log("[AGENT]", colors.yellow, "🔧 正在应用修复...");
    await sleep(1000);

    console.log("");
    log("[AGENT]", colors.green, "╔══════════════════════════════════════════╗");
    log("[AGENT]", colors.green, "║        🎉 修复成功! 项目编译完成          ║");
    log("[AGENT]", colors.green, "╚══════════════════════════════════════════╝");
    console.log("");

    const paymentResponse = paidResponse.headers.get("PAYMENT-RESPONSE");
    if (paymentResponse) {
        log("[X402]", colors.magenta, `支付确认: ${paymentResponse.slice(0, 50)}...`);
    }
}

main().catch(console.error);
