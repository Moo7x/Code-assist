import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

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

/**
 * 免费预检 API - 检查解决方案是否存在
 * 此端点 **不需要** x402 支付，Agent 可以免费调用
 * 
 * 返回：
 * - 如果存在：解决方案的元信息 (价格、卖家信誉、标签)，但不包含具体修复代码
 * - 如果不存在：404 + 提示提交到悬赏板
 * 
 * @param hash - 错误签名的哈希 ID
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get("hash");

    // 验证参数
    if (!hash) {
        return NextResponse.json(
            { error: "Missing required parameter: hash" },
            { status: 400 }
        );
    }

    // 查找解决方案
    const db = readDB();
    const solution = db.find((item) => item.id === hash);

    if (!solution) {
        return NextResponse.json(
            {
                found: false,
                error: "No solution exists for this error",
                hint: "You can post this error to the Bounty Board for human experts to solve"
            },
            { status: 404 }
        );
    }

    console.log(`[SYMBIONT] Pre-check: ${hash} - Solution exists, price: ${solution.price}`);

    // 返回元信息，但不包含具体解决方案代码
    return NextResponse.json({
        found: true,
        preview: true,  // 标记这是预览，不是完整数据
        id: solution.id,
        error_signature: solution.error_signature,
        price: solution.price,
        seller_wallet: solution.seller_wallet,
        seller_reputation: solution.seller_reputation,
        tags: solution.tags,
        message: "Solution exists! Pay via /api/query to get the full fix code."
    });
}
