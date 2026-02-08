import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface Solution {
    id: string;
    price: string;
    [key: string]: any;
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

/**
 * Update solution price
 * PATCH /api/solution/[id]
 * Body: { price: string }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { price } = body;

        if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            return NextResponse.json(
                { error: "Invalid price. Must be a positive number." },
                { status: 400 }
            );
        }

        const db = readDB();
        const solutionIndex = db.findIndex(s => s.id === id);

        if (solutionIndex === -1) {
            return NextResponse.json(
                { error: "Solution not found" },
                { status: 404 }
            );
        }

        // Update price
        db[solutionIndex].price = parseFloat(price).toFixed(2);
        writeDB(db);

        console.log(`[SOLUTION] Updated price for ${id}: ${db[solutionIndex].price} USDC`);

        return NextResponse.json({
            success: true,
            solution_id: id,
            price: db[solutionIndex].price,
            message: `Price updated to ${db[solutionIndex].price} USDC per query`
        });

    } catch (error) {
        console.error("[SOLUTION] Update error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Get solution details
 * GET /api/solution/[id]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const db = readDB();
        const solution = db.find(s => s.id === id);

        if (!solution) {
            return NextResponse.json(
                { error: "Solution not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ solution });

    } catch (error) {
        console.error("[SOLUTION] Get error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
