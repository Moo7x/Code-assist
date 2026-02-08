/**
 * Agent Vote Script - Downvote a solution
 */

async function main() {
    const solutionId = "279e70d73eac83a6";
    const vote = "down";  // "up" or "down"

    console.log(`Voting ${vote} on solution: ${solutionId}`);

    try {
        const response = await fetch("http://localhost:3000/api/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                solution_id: solutionId,
                vote: vote,
                agent_wallet: "0xf4f447e2639657e5e8e14aa8c82ff77b4bde42a5"
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Vote recorded!");
            console.log(`   Upvotes: ${data.upvotes}`);
            console.log(`   Downvotes: ${data.downvotes}`);
            console.log(`   Success Rate: ${data.success_rate}%`);
        } else {
            console.error("❌ Vote failed:", data);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
