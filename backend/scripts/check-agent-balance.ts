
import { createPublicClient, http, formatUnits, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";

const AGENT_ADDRESS = "0xF4F447E2639657E5E8e14aA8C82ff77B4BdE42a5";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const USDC_ABI = parseAbi([
    "function balanceOf(address owner) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)"
]);

async function main() {
    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http("https://sepolia.base.org")
    });

    console.log(`Checking balances for ${AGENT_ADDRESS}...`);

    const ethBalance = await publicClient.getBalance({ address: AGENT_ADDRESS });
    console.log(`ETH Balance: ${formatUnits(ethBalance, 18)} ETH`);

    const usdcBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: [AGENT_ADDRESS]
    });
    console.log(`USDC Balance: ${formatUnits(usdcBalance as bigint, 6)} USDC`);

    // The x402 facilitator for Base Sepolia is usually the x402 settlement contract.
    // I need to know the spender address to check allowance.
    // Common x402 settlement contracts:
    // 0x69680e1d58b0bc1a43a21c0ba6c2c15e0ce18804 (Found in some x402 examples)
    const possibleSpenders = [
        "0x69680e1d58b0bc1a43a21c0ba6c2c15e0ce18804", // x402 Settlement v1?
    ];

    for (const spender of possibleSpenders) {
        const allowance = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: "allowance",
            args: [AGENT_ADDRESS, spender as `0x${string}`]
        });
        console.log(`Allowance for ${spender}: ${formatUnits(allowance as bigint, 6)} USDC`);
    }
}

main();
