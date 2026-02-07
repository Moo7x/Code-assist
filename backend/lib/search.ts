/**
 * Symbiont 智能搜索引擎 v2 - 环境感知版
 * 
 * 实现四层匹配策略：
 * 1. 精确匹配 - 完全相同的错误签名
 * 2. 错误类型匹配 - 提取错误类型（如 ReferenceError）
 * 3. 相似度匹配 - 基于关键词的相似度计算
 * 4. 环境匹配 - 根据 OS、运行时版本、依赖版本优先排序
 */

// 环境信息类型
export interface Environment {
    os: string[];                    // 支持的操作系统 ["windows", "linux", "macos"]
    runtime: string;                 // 运行时 "nodejs" | "python" | "browser" | "rust"
    runtime_version: string;         // 版本要求 ">=14.0.0" | "*"
    dependencies: Record<string, string>;  // 依赖版本 { "ethers": ">=5.0.0" }
}

// Agent 环境信息
export interface AgentEnvironment {
    os: string;                      // "windows" | "linux" | "macos"
    runtime: string;                 // "nodejs" | "python" | "browser"
    runtime_version: string;         // "18.17.0"
    dependencies: Record<string, string>;  // 已安装的依赖版本
}

// 定义解决方案类型
export interface Solution {
    id: string;
    error_signature: string;
    solution: string;
    price: string;
    seller_wallet: string;
    seller_reputation: number;
    tags: string[];
    environment?: Environment;
    created_at: string;
}

// 搜索结果类型
export interface SearchResult {
    solution: Solution;
    matchType: 'exact' | 'error_type' | 'similarity';
    confidence: number;  // 0-100
    matchReason: string;
    environmentMatch: number;  // 环境匹配度 0-100
}

/**
 * 提取错误类型（去除行号、变量名等动态部分）
 */
export function normalizeError(errorMessage: string): string {
    let normalized = errorMessage;

    // 移除行号信息
    normalized = normalized.replace(/\s+at\s+line\s+\d+/gi, '');
    normalized = normalized.replace(/\s+at\s+.*:\d+:\d+/gi, '');
    normalized = normalized.replace(/line\s+\d+/gi, '');
    normalized = normalized.replace(/:\d+:\d+/g, '');

    // 移除具体变量名
    normalized = normalized.replace(/'[^']+'/g, "'...'");
    normalized = normalized.replace(/"[^"]+"/g, '"..."');

    // 移除括号中的详细参数
    normalized = normalized.replace(/\([^)]*action=[^)]*\)/g, '');
    normalized = normalized.replace(/\([^)]*code=[^)]*\)/g, '');

    // 移除文件路径
    normalized = normalized.replace(/[A-Za-z]:\\[^\s]+/g, '');
    normalized = normalized.replace(/\/[^\s]+\.[a-z]+/gi, '');

    // 移除多余空格
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
}

/**
 * 提取错误类型关键词
 */
export function extractErrorType(errorMessage: string): string | null {
    const errorTypes = [
        'ReferenceError', 'TypeError', 'SyntaxError', 'RangeError',
        'URIError', 'EvalError', 'Error',
        'ModuleNotFoundError', 'ImportError', 'AttributeError',
        'KeyError', 'ValueError', 'IndexError', 'NameError',
        'FileNotFoundError', 'ConnectionError', 'TimeoutError', 'PermissionError',
    ];

    for (const type of errorTypes) {
        if (errorMessage.includes(type)) {
            return type;
        }
    }

    return null;
}

/**
 * 提取错误消息中的关键词
 */
export function extractKeywords(errorMessage: string): string[] {
    const normalized = errorMessage.toLowerCase();
    const stopWords = ['is', 'not', 'the', 'a', 'an', 'of', 'at', 'in', 'on', 'for', 'to', 'and', 'or'];

    const words = normalized
        .replace(/[^a-z0-9_]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.includes(w));

    return [...new Set(words)];
}

/**
 * 计算两个字符串的相似度（Jaccard 相似度）
 */
export function calculateSimilarity(str1: string, str2: string): number {
    const keywords1 = new Set(extractKeywords(str1));
    const keywords2 = new Set(extractKeywords(str2));

    if (keywords1.size === 0 || keywords2.size === 0) return 0;

    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);

    return Math.round((intersection.size / union.size) * 100);
}

/**
 * 比较版本号
 * @returns true 如果 actual 满足 required 的要求
 */
export function compareVersion(actual: string, required: string): boolean {
    if (required === '*') return true;
    if (!actual || !required) return true;

    // 解析版本要求 ">=14.0.0" -> { operator: ">=", version: "14.0.0" }
    const match = required.match(/^([<>=]+)?(.+)$/);
    if (!match) return true;

    const operator = match[1] || '>=';
    const requiredVersion = match[2];

    const actualParts = actual.split('.').map(Number);
    const requiredParts = requiredVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(actualParts.length, requiredParts.length); i++) {
        const a = actualParts[i] || 0;
        const r = requiredParts[i] || 0;

        if (a > r) return operator.includes('>') || operator === '>=';
        if (a < r) return operator.includes('<') || operator === '<=';
    }

    return operator.includes('=');
}

/**
 * 计算环境匹配度
 */
export function calculateEnvironmentMatch(
    solutionEnv: Environment | undefined,
    agentEnv: AgentEnvironment | undefined
): number {
    if (!solutionEnv || !agentEnv) return 100; // 无环境信息时完全匹配

    let score = 0;
    let maxScore = 0;

    // OS 匹配 (权重 20)
    maxScore += 20;
    if (solutionEnv.os.includes(agentEnv.os) || solutionEnv.os.includes('*')) {
        score += 20;
    }

    // 运行时匹配 (权重 30)
    maxScore += 30;
    if (solutionEnv.runtime === agentEnv.runtime || solutionEnv.runtime === '*') {
        score += 30;
    } else {
        return 0; // 运行时不匹配直接返回0
    }

    // 运行时版本匹配 (权重 25)
    maxScore += 25;
    if (compareVersion(agentEnv.runtime_version, solutionEnv.runtime_version)) {
        score += 25;
    }

    // 依赖版本匹配 (权重 25)
    maxScore += 25;
    const requiredDeps = Object.keys(solutionEnv.dependencies);
    if (requiredDeps.length === 0) {
        score += 25;
    } else {
        let depMatch = 0;
        for (const dep of requiredDeps) {
            if (agentEnv.dependencies[dep]) {
                if (compareVersion(agentEnv.dependencies[dep], solutionEnv.dependencies[dep])) {
                    depMatch++;
                }
            }
        }
        score += Math.round((depMatch / requiredDeps.length) * 25);
    }

    return Math.round((score / maxScore) * 100);
}

/**
 * 智能搜索解决方案（环境感知版）
 */
export function smartSearch(
    query: string,
    database: Solution[],
    minSimilarity: number = 40,
    agentEnv?: AgentEnvironment
): SearchResult[] {
    const results: SearchResult[] = [];
    const normalizedQuery = normalizeError(query);
    const queryErrorType = extractErrorType(query);

    for (const solution of database) {
        const normalizedSolution = normalizeError(solution.error_signature);

        // 计算环境匹配度
        const envMatch = calculateEnvironmentMatch(solution.environment, agentEnv);

        // 如果运行时完全不匹配，跳过
        if (agentEnv && solution.environment && envMatch === 0) {
            continue;
        }

        // 1. 精确匹配（标准化后）
        if (normalizedQuery === normalizedSolution) {
            results.push({
                solution,
                matchType: 'exact',
                confidence: 100,
                matchReason: 'Exact match after normalization',
                environmentMatch: envMatch
            });
            continue;
        }

        // 2. 错误类型匹配
        const solutionErrorType = extractErrorType(solution.error_signature);
        if (queryErrorType && solutionErrorType && queryErrorType === solutionErrorType) {
            const similarity = calculateSimilarity(normalizedQuery, normalizedSolution);
            if (similarity >= minSimilarity) {
                results.push({
                    solution,
                    matchType: 'error_type',
                    confidence: Math.min(90, 50 + similarity * 0.4),
                    matchReason: `Same error type (${queryErrorType}) with ${similarity}% keyword match`,
                    environmentMatch: envMatch
                });
                continue;
            }
        }

        // 3. 相似度匹配
        const similarity = calculateSimilarity(query, solution.error_signature);
        if (similarity >= minSimilarity) {
            results.push({
                solution,
                matchType: 'similarity',
                confidence: similarity,
                matchReason: `${similarity}% keyword similarity`,
                environmentMatch: envMatch
            });
        }
    }

    // 按综合得分排序（置信度 * 0.6 + 环境匹配 * 0.4）
    results.sort((a, b) => {
        const scoreA = a.confidence * 0.6 + a.environmentMatch * 0.4;
        const scoreB = b.confidence * 0.6 + b.environmentMatch * 0.4;
        return scoreB - scoreA;
    });

    return results;
}

/**
 * 搜索最佳匹配
 */
export function findBestMatch(
    query: string,
    database: Solution[],
    minConfidence: number = 40,
    agentEnv?: AgentEnvironment
): SearchResult | null {
    const results = smartSearch(query, database, minConfidence, agentEnv);
    return results.length > 0 ? results[0] : null;
}
