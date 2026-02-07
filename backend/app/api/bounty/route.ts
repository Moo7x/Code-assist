import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
 * GET /api/bounty - 获取悬赏列表
 * 
 * 参数:
 * - status: 过滤状态 (open/claimed/solved)，默认 open
 * - agent: 过滤特定 Agent 的悬赏
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "open";
    const agent = searchParams.get("agent");
    const id = searchParams.get("id");

    const bounties = readBounties();

    // 如果指定了 ID，返回单个悬赏
    if (id) {
        const bounty = bounties.find(b => b.id === id);
        if (!bounty) {
            return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
        }
        return NextResponse.json({ bounty });
    }

    // 过滤悬赏
    let filtered = bounties;

    if (status !== "all") {
        filtered = filtered.filter(b => b.status === status);
    }

    if (agent) {
        filtered = filtered.filter(b => b.agent_wallet.toLowerCase() === agent.toLowerCase());
    }

    // 按创建时间倒序
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
        total: filtered.length,
        bounties: filtered
    });
}



/**
 * PUT /api/bounty - 人类专家解决悬赏
 * 
 * 人类提交解决方案后，悬赏状态变为 solved，Agent 可以获取解决方案
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { bounty_id, solver_wallet, solution_id, action } = body;

        if (!bounty_id) {
            return NextResponse.json({ error: "Missing bounty_id" }, { status: 400 });
        }

        const bounties = readBounties();
        const bountyIndex = bounties.findIndex(b => b.id === bounty_id);

        if (bountyIndex === -1) {
            return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
        }

        const bounty = bounties[bountyIndex];

        // 认领悬赏
        if (action === "claim") {
            if (bounty.status !== "open") {
                return NextResponse.json({ error: "Bounty is not open" }, { status: 400 });
            }
            bounty.status = "claimed";
            bounty.solver_wallet = solver_wallet;
            console.log(`[BOUNTY] Claimed: ${bounty_id} by ${solver_wallet}`);
        }
        // 解决悬赏
        else if (action === "solve") {
            if (!solution_id) {
                return NextResponse.json({ error: "Missing solution_id" }, { status: 400 });
            }
            bounty.status = "solved";
            bounty.solver_wallet = solver_wallet || bounty.solver_wallet;
            bounty.solution_id = solution_id;
            console.log(`[BOUNTY] Solved: ${bounty_id} - Solution: ${solution_id}`);
        }
        else {
            return NextResponse.json({ error: "Invalid action. Use 'claim' or 'solve'" }, { status: 400 });
        }

        bounties[bountyIndex] = bounty;
        writeBounties(bounties);

        return NextResponse.json({
            success: true,
            bounty
        });
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}
