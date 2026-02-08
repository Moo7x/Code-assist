import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { smartSearch, type Solution, type AgentEnvironment } from "~/lib/search";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

// 读取数据库
function readDB(): Solution[] {
    try {
        const data = fs.readFileSync(DB_PATH, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

/**
 * 智能搜索 API - 环境感知版
 * 
 * GET 参数：
 * - query: 错误消息
 * - hash: 错误哈希（可选，用于精确匹配）
 * - min_confidence: 最低置信度阈值（默认 40）
 * - os: 操作系统 (windows/linux/macos)
 * - runtime: 运行时 (nodejs/python/browser)
 * - runtime_version: 运行时版本
 * - dependencies: 依赖版本（JSON 格式）
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const hash = searchParams.get("hash");
    const minConfidence = parseInt(searchParams.get("min_confidence") || "40");

    // 解析环境信息
    const agentEnv: AgentEnvironment | undefined = searchParams.get("os") ? {
        os: searchParams.get("os") || "unknown",
        runtime: searchParams.get("runtime") || "unknown",
        runtime_version: searchParams.get("runtime_version") || "*",
        dependencies: JSON.parse(searchParams.get("dependencies") || "{}")
    } : undefined;

    if (!query && !hash) {
        return NextResponse.json(
            { error: "Missing required parameter: query or hash" },
            { status: 400 }
        );
    }

    const db = readDB();

    // 如果提供了 hash，先尝试精确匹配
    if (hash) {
        const exactMatch = db.find((item) => item.id === hash);
        if (exactMatch) {
            return NextResponse.json({
                found: true,
                matchType: 'exact',
                confidence: 100,
                environmentMatch: 100,
                results: [{
                    id: exactMatch.id,
                    error_signature: exactMatch.error_signature,
                    price: exactMatch.price,
                    seller_wallet: exactMatch.seller_wallet,
                    seller_reputation: exactMatch.seller_reputation,
                    tags: exactMatch.tags,
                    environment: exactMatch.environment,
                    matchType: 'exact',
                    confidence: 100,
                    environmentMatch: 100,
                    matchReason: 'Exact hash match'
                }],
                message: "Solution found! Use /api/query to purchase."
            });
        }
    }

    // 智能搜索（带环境信息）
    if (query) {
        const results = smartSearch(query, db, minConfidence, agentEnv);

        if (results.length === 0) {
            console.log(`[CODE-ASSIST] No match for: "${query.slice(0, 50)}..." env: ${JSON.stringify(agentEnv)}`);
            return NextResponse.json(
                {
                    found: false,
                    error: "No solution matches your error and environment",
                    hint: "You can post this error to the Bounty Board for human experts to solve",
                    searchQuery: query.slice(0, 100),
                    environment: agentEnv
                },
                { status: 404 }
            );
        }

        console.log(`[CODE-ASSIST] Found ${results.length} matches, best: ${results[0].solution.id} (${results[0].confidence}% conf, ${results[0].environmentMatch}% env)`);

        return NextResponse.json({
            found: true,
            totalMatches: results.length,
            agentEnvironment: agentEnv,
            results: results.map(r => ({
                id: r.solution.id,
                error_signature: r.solution.error_signature,
                price: r.solution.price,
                seller_wallet: r.solution.seller_wallet,
                seller_reputation: r.solution.seller_reputation,
                tags: r.solution.tags,
                environment: r.solution.environment,
                matchType: r.matchType,
                confidence: r.confidence,
                environmentMatch: r.environmentMatch,
                matchReason: r.matchReason
            })),
            message: "Solutions found! Use /api/query?id=xxx to purchase."
        });
    }

    return NextResponse.json(
        { error: "Invalid search parameters" },
        { status: 400 }
    );
}

/**
 * POST 请求 - 用于发送较长的错误消息和环境信息
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, min_confidence = 40, environment } = body;

        if (!query) {
            return NextResponse.json(
                { error: "Missing required field: query" },
                { status: 400 }
            );
        }

        const db = readDB();
        const results = smartSearch(query, db, min_confidence, environment);

        if (results.length === 0) {
            return NextResponse.json(
                {
                    found: false,
                    error: "No solution matches your error and environment",
                    hint: "You can post this error to the Bounty Board"
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            found: true,
            totalMatches: results.length,
            agentEnvironment: environment,
            results: results.map(r => ({
                id: r.solution.id,
                error_signature: r.solution.error_signature,
                price: r.solution.price,
                seller_wallet: r.solution.seller_wallet,
                seller_reputation: r.solution.seller_reputation,
                tags: r.solution.tags,
                environment: r.solution.environment,
                matchType: r.matchType,
                confidence: r.confidence,
                environmentMatch: r.environmentMatch,
                matchReason: r.matchReason
            })),
            message: "Solutions found!"
        });
    } catch {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }
}
