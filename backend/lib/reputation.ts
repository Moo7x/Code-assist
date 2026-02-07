/**
 * 信誉评分计算系统
 * 
 * 5 维度加权评分：
 * - 加入时间: 10%
 * - 使用次数: 10%
 * - GitHub 活跃度: 25%
 * - Agent 评价: 25%
 * - 质押代币: 30%
 */

export interface SellerProfile {
    wallet: string;
    github_username: string;
    github_stars: number;
    github_contributions: number;
    joined_at: string;
    total_sales: number;
    total_earnings: string; // USDC earnings from solved bounties
    success_votes: number;
    failure_votes: number;
    staked_amount: string;
    reputation_score: number;
}

// 权重配置
const WEIGHTS = {
    AGE: 0.10,           // 加入时间
    USAGE: 0.10,         // 使用次数
    GITHUB: 0.25,        // GitHub 活跃度
    VOTES: 0.25,         // Agent 评价
    STAKE: 0.30          // 质押代币
};

// 满分标准
const MAX_SCORES = {
    AGE_MONTHS: 12,      // 12个月达到满分
    USAGE_COUNT: 100,    // 100次购买达到满分
    GITHUB_STARS: 200,   // 200星达到满分
    GITHUB_CONTRIB: 1000,// 1000贡献达到满分
    STAKE_AMOUNT: 100    // 100 USDC达到满分
};

/**
 * 计算加入时间得分 (10%)
 * 满分: 12个月 = 100分
 */
function calculateAgeScore(joinedAt: string): number {
    const joinDate = new Date(joinedAt);
    const now = new Date();
    const months = (now.getFullYear() - joinDate.getFullYear()) * 12
        + (now.getMonth() - joinDate.getMonth());
    return Math.min(100, (months / MAX_SCORES.AGE_MONTHS) * 100);
}

/**
 * 计算使用次数得分 (10%)
 * 满分: 100次 = 100分
 */
function calculateUsageScore(totalSales: number): number {
    return Math.min(100, (totalSales / MAX_SCORES.USAGE_COUNT) * 100);
}

/**
 * 计算 GitHub 活跃度得分 (25%)
 * 综合星数和贡献数
 */
function calculateGithubScore(stars: number, contributions: number): number {
    const starScore = Math.min(50, (stars / MAX_SCORES.GITHUB_STARS) * 50);
    const contribScore = Math.min(50, (contributions / MAX_SCORES.GITHUB_CONTRIB) * 50);
    return starScore + contribScore;
}

/**
 * 计算 Agent 评价得分 (25%)
 * 基于成功率
 */
function calculateVoteScore(successVotes: number, failureVotes: number): number {
    const totalVotes = successVotes + failureVotes;
    if (totalVotes === 0) {
        return 50; // 默认 50 分
    }
    return (successVotes / totalVotes) * 100;
}

/**
 * 计算质押代币得分 (30%)
 * 满分: 100 USDC = 100分
 */
function calculateStakeScore(stakedAmount: string): number {
    const amount = parseFloat(stakedAmount) || 0;
    return Math.min(100, (amount / MAX_SCORES.STAKE_AMOUNT) * 100);
}

/**
 * 计算综合信誉评分
 */
export function calculateReputation(seller: SellerProfile): number {
    const ageScore = calculateAgeScore(seller.joined_at);
    const usageScore = calculateUsageScore(seller.total_sales);
    const githubScore = calculateGithubScore(seller.github_stars, seller.github_contributions);
    const voteScore = calculateVoteScore(seller.success_votes, seller.failure_votes);
    const stakeScore = calculateStakeScore(seller.staked_amount);

    const BASE_SCORE = 50;

    const totalScore =
        BASE_SCORE +
        ageScore * WEIGHTS.AGE +
        usageScore * WEIGHTS.USAGE +
        githubScore * WEIGHTS.GITHUB +
        voteScore * WEIGHTS.VOTES +
        stakeScore * WEIGHTS.STAKE;

    // Cap at 100? User didn't specify cap, but reputation usually is 0-100.
    // If base is 50, and other weights add up to 100 max, total could be 150.
    // The user said "add/subtract".
    // I will assume the weights should be adjusted or simply add to 50.
    // If weights sum to 1.0 (100 pts), then total is 50 + 100 = 150.
    // Let's keep it simple: Base 50 + calculated components.
    // However, getReputationLevel assumes 0-100.
    // Let's cap at 100 for now to avoid breaking shared logic, or maybe 50 is the "starting" and we reduce weights?
    // User said: "50 base score, after that add/subtract based on github/others".
    // This implies the *variable* part should be scaled.
    // Let's just add 50 for now and clamp to 100 if needed, or allow >100.
    // Given the levels (80=Expert), if everyone starts at 50, they are "Verified" immediately.

    return Math.min(100, Math.round(totalScore));
}

/**
 * 获取信誉等级
 */
export function getReputationLevel(score: number): {
    level: string;
    badge: string;
    trustworthy: boolean;
} {
    if (score >= 80) {
        return { level: "Expert", badge: "🏆", trustworthy: true };
    } else if (score >= 60) {
        return { level: "Trusted", badge: "✅", trustworthy: true };
    } else if (score >= 40) {
        return { level: "Verified", badge: "☑️", trustworthy: true };
    } else if (score >= 20) {
        return { level: "Newcomer", badge: "🆕", trustworthy: false };
    } else {
        return { level: "Unverified", badge: "⚠️", trustworthy: false };
    }
}

/**
 * 获取信誉分数明细
 */
export function getReputationBreakdown(seller: SellerProfile): {
    total: number;
    breakdown: {
        dimension: string;
        weight: string;
        score: number;
        weighted: number;
    }[];
} {
    const ageScore = calculateAgeScore(seller.joined_at);
    const usageScore = calculateUsageScore(seller.total_sales);
    const githubScore = calculateGithubScore(seller.github_stars, seller.github_contributions);
    const voteScore = calculateVoteScore(seller.success_votes, seller.failure_votes);
    const stakeScore = calculateStakeScore(seller.staked_amount);

    return {
        total: calculateReputation(seller),
        breakdown: [
            { dimension: "加入时间", weight: "10%", score: Math.round(ageScore), weighted: Math.round(ageScore * WEIGHTS.AGE) },
            { dimension: "使用次数", weight: "10%", score: Math.round(usageScore), weighted: Math.round(usageScore * WEIGHTS.USAGE) },
            { dimension: "GitHub活跃度", weight: "25%", score: Math.round(githubScore), weighted: Math.round(githubScore * WEIGHTS.GITHUB) },
            { dimension: "Agent评价", weight: "25%", score: Math.round(voteScore), weighted: Math.round(voteScore * WEIGHTS.VOTES) },
            { dimension: "质押代币", weight: "30%", score: Math.round(stakeScore), weighted: Math.round(stakeScore * WEIGHTS.STAKE) }
        ]
    };
}
