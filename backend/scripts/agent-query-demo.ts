/**
 * Agent Query Demo - x402 Payment Flow
 * 
 * Demonstrates an Agent querying for a solution and paying via x402:
 * 1. Agent sends query request to /api/query
 * 2. Server returns 402 Payment Required
 * 3. Agent pays 0.01 USDC via x402 to Solver's address
 * 4. Agent receives the solution
 */

import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const AGENT_PRIVATE_KEY = "0x00cbebd250e4912df8f87a4782ddeba184fd76f647b910ffca7b1af51b636af7";

// Use an existing error signature from the database
const ERROR_SIGNATURE = "TypeError: Cannot read property 'foo' of undefined at line 99";

async function main() {
    console.log("=".repeat(60));
    console.log("  SYMBIONT - Agent Query Demo (x402 Payment Flow)");
    console.log("=".repeat(60));
    console.log();

    // Initialize Agent wallet
    const signer = privateKeyToAccount(AGENT_PRIVATE_KEY as `0x${string}`);
    console.log(`[Agent] Wallet: ${signer.address}`);
    console.log(`[Agent] Searching for solution to error...`);
    console.log();

    // Create x402 client
    const client = new x402Client();
    registerExactEvmScheme(client, { signer });

    const targetUrl = `http://localhost:3000/api/query?error_signature=${encodeURIComponent(ERROR_SIGNATURE)}`;

    console.log(`[Agent] Query: "${ERROR_SIGNATURE.slice(0, 50)}..."`);
    console.log();

    // First, show what happens without x402 payment
    console.log("[Step 1] Sending query WITHOUT payment header...");
    try {
        const rawResponse = await fetch(targetUrl);
        console.log(`[x402] Error Intercepted! Status: ${rawResponse.status}`);

        if (rawResponse.status === 402) {
            const paymentHeader = rawResponse.headers.get("x-payment");
            if (paymentHeader) {
                const decoded = JSON.parse(Buffer.from(paymentHeader, "base64").toString());
                console.log(`[x402] Payment Required. Amount: ${parseFloat(decoded.maxAmountRequired) / 1e6} USDC`);
                console.log(`[x402] Pay To: ${decoded.payTo}`);
            }
        }
    } catch (e) {
        console.log("[x402] Request blocked - payment required");
    }

    console.log();
    console.log("[Step 2] Retrying WITH x402 payment...");
    console.log();

    // Wrap fetch with x402 payment handling
    const fetchWithPayment = wrapFetchWithPayment(fetch, client);

    try {
        const response = await fetchWithPayment(targetUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("[x402] Payment Successful! ✓");
            console.log();
            console.log("=".repeat(60));
            console.log("  SOLUTION RECEIVED");
            console.log("=".repeat(60));
            console.log();
            console.log(`[Solution ID] ${data.id}`);
            console.log(`[Seller] ${data.seller_wallet}`);
            console.log(`[Reputation] ${data.seller_reputation}`);
            console.log(`[Price Paid] ${data.price} USDC`);
            if (data.tx_hash) {
                console.log(`[Payout Tx] ${data.tx_hash}`);
            }
            console.log();
            console.log("[Solution Content]:");
            console.log(data.solution?.slice(0, 200) || "No content");
            console.log();
            console.log("=".repeat(60));
            console.log("  Agent paid -> Treasury -> Seller via x402!");
            console.log("=".repeat(60));
        } else {
            console.error(`Request failed: ${response.status}`);
            const text = await response.text();
            console.error(text);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
