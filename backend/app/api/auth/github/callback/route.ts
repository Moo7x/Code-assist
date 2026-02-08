import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { calculateReputation, type SellerProfile } from "~/lib/reputation";

const SELLERS_PATH = path.join(process.cwd(), "data", "sellers.json");
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

interface GitHubUser {
    login: string;
    id: number;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
}

interface GitHubRepo {
    stargazers_count: number;
    fork: boolean;
}

/**
 * 获取 GitHub 用户的总星数
 */
async function getGitHubStars(username: string, token: string): Promise<number> {
    let totalStars = 0;
    let page = 1;

    while (true) {
        const response = await fetch(
            `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "Symbiont-App"
                }
            }
        );

        if (!response.ok) break;

        const repos: GitHubRepo[] = await response.json();
        if (repos.length === 0) break;

        // 只统计非 fork 仓库的星数
        for (const repo of repos) {
            if (!repo.fork) {
                totalStars += repo.stargazers_count;
            }
        }

        page++;
        if (repos.length < 100) break;
    }

    return totalStars;
}

/**
 * 获取 GitHub 用户的贡献数 (使用事件 API 近似)
 */
async function getGitHubContributions(username: string, token: string): Promise<number> {
    const response = await fetch(
        `https://api.github.com/users/${username}/events/public?per_page=100`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "Symbiont-App"
            }
        }
    );

    if (!response.ok) return 0;

    const events = await response.json();

    // 计算 Push 事件中的 commit 数量
    let contributions = 0;
    for (const event of events) {
        if (event.type === "PushEvent" && event.payload?.commits) {
            contributions += event.payload.commits.length;
        }
    }

    // 返回近似值 (实际贡献数需要 GraphQL API)
    return contributions * 10; // 放大系数
}

/**
 * GitHub OAuth 回调端点
 * 
 * GET /api/auth/github/callback?code=xxx&state=xxx
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
        return NextResponse.redirect(`${APP_URL}?error=missing_params`);
    }

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return NextResponse.redirect(`${APP_URL}?error=oauth_not_configured`);
    }

    // 解析 state 获取钱包地址
    let wallet: string;
    try {
        const stateData = JSON.parse(Buffer.from(state, "base64").toString());
        wallet = stateData.wallet?.toLowerCase();
    } catch {
        return NextResponse.redirect(`${APP_URL}?error=invalid_state`);
    }

    try {
        // 1. 用 code 换取 access_token
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error("[GITHUB AUTH] Token error:", tokenData.error);
            return NextResponse.redirect(`${APP_URL}?error=token_failed`);
        }

        const accessToken = tokenData.access_token;

        // 2. 获取 GitHub 用户信息
        const userResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "Code-Assist-App"
            }
        });

        const user: GitHubUser = await userResponse.json();
        console.log(`[GITHUB AUTH] User: ${user.login} (${user.public_repos} repos)`);

        // 3. 获取统计数据
        const stars = await getGitHubStars(user.login, accessToken);
        const contributions = await getGitHubContributions(user.login, accessToken);

        console.log(`[GITHUB AUTH] Stats: ${stars} stars, ${contributions} contributions`);

        // 4. 更新卖家数据
        const sellers = readSellers();
        let seller = sellers[wallet];

        if (!seller) {
            // 如果卖家不存在，自动创建
            seller = {
                wallet,
                github_username: user.login,
                github_stars: stars,
                github_contributions: contributions,
                joined_at: new Date().toISOString(),
                total_sales: 0,
                total_earnings: "0.00",
                success_votes: 0,
                failure_votes: 0,
                staked_amount: "0.00",
                reputation_score: 0
            };
        } else {
            // 更新 GitHub 数据
            seller.github_username = user.login;
            seller.github_stars = stars;
            seller.github_contributions = contributions;
        }

        // 重新计算信誉
        seller.reputation_score = calculateReputation(seller);

        sellers[wallet] = seller;
        writeSellers(sellers);

        console.log(`[GITHUB AUTH] Seller ${wallet} updated: Rep ${seller.reputation_score}`);

        // 5. 重定向回成功页面
        return NextResponse.redirect(
            `${APP_URL}?github_auth=success&wallet=${wallet}&username=${user.login}&reputation=${seller.reputation_score}`
        );

    } catch (error) {
        console.error("[GITHUB AUTH] Error:", error);
        return NextResponse.redirect(`${APP_URL}?error=auth_failed`);
    }
}
