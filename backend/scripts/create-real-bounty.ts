
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const AGENT_PRIVATE_KEY = "0x00cbebd250e4912df8f87a4782ddeba184fd76f647b910ffca7b1af51b636af7";

async function main() {
    console.log("Initializing Agent Wallet for x402...");
    const signer = privateKeyToAccount(AGENT_PRIVATE_KEY as `0x${string}`);
    console.log(`Agent Address: ${signer.address}`);

    // Create x402 client
    const client = new x402Client();
    registerExactEvmScheme(client, { signer });

    console.log("Sending request to create bounty...");

    const targetUrl = "http://localhost:3000/api/bounty/create";

    // Wrap fetch with x402 payment handling
    const fetchWithPayment = wrapFetchWithPayment(fetch, client);

    try {
        const response = await fetchWithPayment(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                error_signature: `ReferenceError: process is not defined at ${Date.now()}`,
                environment: {
                    os: "macOS 14.2 (Sonoma)",
                    runtime: "Node.js",
                    runtime_version: "18.19.0",
                    dependencies: {
                        "react": "18.2.0",
                        "next": "15.0.0"
                    }
                },
                reward: "0.50",
                agent_wallet: signer.address
            })
        });

        if (!response.ok) {
            console.error(`Request failed with status: ${response.status}`);
            const text = await response.text();
            console.error("Response:", text);
            return;
        }

        const result = await response.json();
        console.log("Bounty Created using x402!", result);

    } catch (error) {
        console.error("Error creating bounty:", error);
    }
}

main();
