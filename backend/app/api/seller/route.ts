import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { calculateReputation, getReputationLevel, getReputationBreakdown, type SellerProfile } from "~/lib/reputation";

const SELLERS_PATH = path.join(process.cwd(), "data", "sellers.json");

// 读取卖家数据库
function readSellers(): Record<string, SellerProfile> {
    try {
        const data = fs.readFileSync(SELLERS_PATH, "utf-8");
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// 写入卖家数据库
function writeSellers(sellers: Record<string, SellerProfile>): void {
    fs.writeFileSync(SELLERS_PATH, JSON.stringify(sellers, null, 2));
}

// 更新卖家信誉分数
function updateSellerReputation(seller: SellerProfile): SellerProfile {
    seller.reputation_score = calculateReputation(seller);
    return seller;
}

/**
 * GET /api/seller - 获取卖家信息
 * 
 * 参数:
 * - wallet: 卖家钱包地址
 * - breakdown: 是否返回评分明细 (true/false)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    const showBreakdown = searchParams.get("breakdown") === "true";

    if (!wallet) {
        // 返回所有卖家列表
        const sellers = readSellers();
        const sellerList = Object.values(sellers).map(s => ({
            wallet: s.wallet,
            github_username: s.github_username,
            reputation_score: s.reputation_score,
            level: getReputationLevel(s.reputation_score),
            total_sales: s.total_sales
        }));

        return NextResponse.json({
            total: sellerList.length,
            sellers: sellerList
        });
    }

    const sellers = readSellers();
    const seller = sellers[wallet.toLowerCase()];

    if (!seller) {
        return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // 确保信誉分数是最新的
    const updatedSeller = updateSellerReputation(seller);
    sellers[wallet.toLowerCase()] = updatedSeller;
    writeSellers(sellers);

    const response: Record<string, unknown> = {
        ...updatedSeller,
        level: getReputationLevel(updatedSeller.reputation_score)
    };

    if (showBreakdown) {
        response.breakdown = getReputationBreakdown(updatedSeller);
    }

    return NextResponse.json(response);
}

/**
 * POST /api/seller - 注册新卖家
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, github_username } = body;

        if (!wallet) {
            return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
        }

        const sellers = readSellers();
        const walletLower = wallet.toLowerCase();

        if (sellers[walletLower]) {
            return NextResponse.json({
                error: "Seller already registered",
                seller: sellers[walletLower]
            }, { status: 409 });
        }

        // 创建新卖家
        const newSeller: SellerProfile = {
            wallet: walletLower,
            github_username: github_username || "",
            github_stars: 0,
            github_contributions: 0,
            joined_at: new Date().toISOString(),
            total_sales: 0,
            total_earnings: "0.00",
            success_votes: 0,
            failure_votes: 0,
            staked_amount: "0.00",
            reputation_score: 0
        };

        // 计算初始信誉分数
        newSeller.reputation_score = calculateReputation(newSeller);

        sellers[walletLower] = newSeller;
        writeSellers(sellers);

        console.log(`[SELLER] New seller registered: ${walletLower}`);

        return NextResponse.json({
            success: true,
            seller: {
                ...newSeller,
                level: getReputationLevel(newSeller.reputation_score)
            },
            message: "Seller registered successfully. Stake tokens to increase reputation."
        });
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}

/**
 * PUT /api/seller - 更新卖家信息 (GitHub 等)
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, github_username, github_stars, github_contributions } = body;

        if (!wallet) {
            return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
        }

        const sellers = readSellers();
        const walletLower = wallet.toLowerCase();
        const seller = sellers[walletLower];

        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 });
        }

        // 更新字段
        if (github_username !== undefined) seller.github_username = github_username;
        if (github_stars !== undefined) seller.github_stars = github_stars;
        if (github_contributions !== undefined) seller.github_contributions = github_contributions;

        // 重新计算信誉
        seller.reputation_score = calculateReputation(seller);

        sellers[walletLower] = seller;
        writeSellers(sellers);

        return NextResponse.json({
            success: true,
            seller: {
                ...seller,
                level: getReputationLevel(seller.reputation_score)
            }
        });
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}
