
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const BOUNTIES_PATH = path.join(process.cwd(), "data", "bounties.json");

// 悬赏状态类型
type BountyStatus = "open" | "claimed" | "solved";

interface Environment {
    os: string;
    runtime: string;
    runtime_version: string;
    dependencies?: Record<string, string>;
}

interface Bounty {
    id: string;
    hash: string; // Unique hash for duplicate detection
    error_signature: string;
    environment: Environment;
    reward: string;
    agent_wallet: string;
    status: BountyStatus;
    solver_wallet: string | null;
    solution_id: string | null;
    created_at: string;
    expires_at: string;
}

// 生成错误签名的哈希 ID
function generateHash(errorSignature: string, environment: Environment): string {
    const envStr = JSON.stringify(environment);
    return crypto.createHash("sha256").update(`${errorSignature}:${envStr}`).digest("hex").slice(0, 16);
}

// 读取悬赏数据库
function readBounties(): Bounty[] {
    try {
        const data = fs.readFileSync(BOUNTIES_PATH, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// 写入悬赏数据库
function writeBounties(bounties: Bounty[]): void {
    fs.writeFileSync(BOUNTIES_PATH, JSON.stringify(bounties, null, 2));
}

/**
 * POST /api/bounty/create - Agent 提交新悬赏 (Requires x402 Payment)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { error_signature, environment, reward, agent_wallet } = body;

        // 验证必填字段
        if (!error_signature || !agent_wallet) {
            return NextResponse.json(
                { error: "Missing required fields: error_signature, agent_wallet" },
                { status: 400 }
            );
        }

        const env: Environment = environment || { os: "unknown", runtime: "unknown", runtime_version: "*" };
        const hash = generateHash(error_signature, env);

        const bounties = readBounties();

        // 使用 hash 检查是否已存在相同的悬赏
        const existing = bounties.find(
            b => b.hash === hash && b.status === "open"
        );

        if (existing) {
            return NextResponse.json({
                success: false,
                error: "Bounty already exists (duplicate hash)",
                hash,
                bounty: existing
            }, { status: 409 });
        }

        // 创建新悬赏
        const bounty: Bounty = {
            id: `bounty_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            hash,
            error_signature,
            environment: environment || { os: "unknown", runtime: "unknown", runtime_version: "*" },
            reward: reward || "1.00",
            agent_wallet,
            status: "open",
            solver_wallet: null,
            solution_id: null,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天后过期
        };

        bounties.push(bounty);
        writeBounties(bounties);

        console.log(`[BOUNTY] New bounty created: ${bounty.id} - Reward: ${bounty.reward} USDC`);

        return NextResponse.json({
            success: true,
            bounty
        });
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}
