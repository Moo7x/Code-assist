import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const SELLERS_PATH = path.join(process.cwd(), "data", "sellers.json");

interface Solution {
    id: string;
    seller_wallet: string;
    upvotes: number;
    downvotes: number;
}

function readDB(): Solution[] {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    } catch {
        return [];
    }
}

function writeDB(data: Solution[]): void {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function readSellers(): Record<string, any> {
    try {
        return JSON.parse(fs.readFileSync(SELLERS_PATH, "utf-8"));
    } catch {
        return {};
    }
}

function writeSellers(sellers: Record<string, any>): void {
    fs.writeFileSync(SELLERS_PATH, JSON.stringify(sellers, null, 2));
}

/**
 * Vote on a solution (upvote or downvote)
 * POST /api/vote
 * Body: { solution_id: string, vote: "up" | "down" }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { solution_id, vote } = body;

        if (!solution_id || !vote || !["up", "down"].includes(vote)) {
            return NextResponse.json(
                { error: "Missing required fields: solution_id and vote (up/down)" },
                { status: 400 }
            );
        }

        const db = readDB();
        const solutionIndex = db.findIndex(s => s.id === solution_id);

        if (solutionIndex === -1) {
            return NextResponse.json(
                { error: "Solution not found" },
                { status: 404 }
            );
        }

        const solution = db[solutionIndex];

        // Update votes
        if (vote === "up") {
            solution.upvotes = (solution.upvotes || 0) + 1;
        } else {
            solution.downvotes = (solution.downvotes || 0) + 1;
        }

        // Calculate success rate
        const totalVotes = solution.upvotes + solution.downvotes;
        const successRate = totalVotes > 0
            ? Math.round((solution.upvotes / totalVotes) * 100)
            : 100;

        // Update in DB
        db[solutionIndex] = solution;
        writeDB(db);

        // Update seller reputation based on votes
        const sellers = readSellers();
        const seller = sellers[solution.seller_wallet.toLowerCase()];
        if (seller) {
            // Adjust reputation: +1 for upvote, -2 for downvote
            const adjustment = vote === "up" ? 1 : -2;
            seller.reputation_score = Math.max(0, Math.min(100,
                (seller.reputation_score || 50) + adjustment
            ));
            sellers[solution.seller_wallet.toLowerCase()] = seller;
            writeSellers(sellers);
        }

        console.log(`[VOTE] Solution ${solution_id}: ${vote}vote - Success Rate: ${successRate}%`);

        return NextResponse.json({
            success: true,
            solution_id,
            vote,
            upvotes: solution.upvotes,
            downvotes: solution.downvotes,
            success_rate: successRate,
            message: `Vote recorded: ${vote}vote`
        });

    } catch (error) {
        console.error("[VOTE] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
