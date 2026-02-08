/**
 * Approve USDC for x402 Facilitator
 * Run this once before creating bounties
 */

import { createWalletClient, http, parseUnits, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const AGENT_PRIVATE_KEY = "0x00cbebd250e4912df8f87a4782ddeba184fd76f647b910ffca7b1af51b636af7";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const X402_FACILITATOR = "0x69680e1d58b0bc1a43a21c0ba6c2c15e0ce18804";

const USDC_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "spender", "type": "address" },
            { "internalType": "uint256", "name": "value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "address", "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

async function main() {
    const account = privateKeyToAccount(AGENT_PRIVATE_KEY as `0x${string}`);
    console.log(`Agent: ${account.address}`);

    const client = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http()
    });

    // Approve max amount
    const approveAmount = parseUnits("1000000", 6); // 1M USDC allowance

    console.log(`Approving USDC for x402 Facilitator: ${X402_FACILITATOR}`);
    console.log(`Amount: ${formatUnits(approveAmount, 6)} USDC`);

    try {
        const hash = await client.writeContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [X402_FACILITATOR as `0x${string}`, approveAmount]
        });

        console.log(`✅ Approval Tx: ${hash}`);
        console.log(`View on BaseScan: https://sepolia.basescan.org/tx/${hash}`);
    } catch (error) {
        console.error("Failed:", error);
    }
}

main();
