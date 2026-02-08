/**
 * Migration Script: Add usage tracking fields to existing solutions
 * Run once to update old solutions with new fields
 */

import * as fs from "fs";
import * as path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface Solution {
    id: string;
    error_signature: string;
    solution: string;
    price: string;
    seller_wallet: string;
    seller_reputation: number;
    tags: string[];
    environment?: any;
    created_at: string;
    // New fields
    usage_count?: number;
    total_earnings?: string;
    initial_reward?: string;
    upvotes?: number;
    downvotes?: number;
    bounty_id?: string;
}

function main() {
    console.log("Reading db.json...");
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const solutions: Solution[] = JSON.parse(data);

    console.log(`Found ${solutions.length} solutions`);

    let updated = 0;
    for (const sol of solutions) {
        let changed = false;

        // Initialize usage_count if missing
        if (sol.usage_count === undefined) {
            sol.usage_count = 1;  // Assume each solution was used at least once (from bounty)
            changed = true;
        }

        // Initialize total_earnings if missing
        if (sol.total_earnings === undefined) {
            sol.total_earnings = sol.price || "0.01";  // Use price as initial earnings
            changed = true;
        }

        // Initialize initial_reward if missing
        if (sol.initial_reward === undefined) {
            sol.initial_reward = sol.price || "0.01";
            changed = true;
        }

        // Initialize votes if missing
        if (sol.upvotes === undefined) {
            sol.upvotes = 0;
            changed = true;
        }
        if (sol.downvotes === undefined) {
            sol.downvotes = 0;
            changed = true;
        }

        if (changed) {
            updated++;
            console.log(`  Updated: ${sol.id} - usage: ${sol.usage_count}, earnings: ${sol.total_earnings}`);
        }
    }

    // Write back
    fs.writeFileSync(DB_PATH, JSON.stringify(solutions, null, 2));
    console.log(`\n✅ Updated ${updated} solutions`);
}

main();
