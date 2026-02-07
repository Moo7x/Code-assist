
import { createPublicClient, http, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const USDC_ABI = parseAbi([
    "function version() view returns (string)",
    "function name() view returns (string)"
]);

async function main() {
    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http("https://sepolia.base.org")
    });

    try {
        const name = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: "name"
        });
        console.log(`USDC Name: ${name}`);

        const version = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: "version"
        });
        console.log(`USDC Version: ${version}`);
    } catch (error) {
        console.error("Error reading USDC details:", error);
    }
}

main();
