import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { paymentProxy } from "@x402/next";
import { createPaywall } from "@x402/paywall";
import { evmPaywall } from "@x402/paywall/evm";

const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_URL;
const payTo = process.env.RESOURCE_WALLET_ADDRESS as `0x${string}`;
const network = process.env.NETWORK;

if (!facilitatorUrl) {
    throw new Error("NEXT_PUBLIC_FACILITATOR_URL environment variable is required");
}
if (!payTo) {
    throw new Error("RESOURCE_WALLET_ADDRESS environment variable is required");
}
if (!network) {
    throw new Error("NETWORK environment variable is required");
}

// CAIP-2 network type (e.g., "eip155:84532")
type Caip2Network = `${string}:${string}`;

// Convert legacy network names to CAIP-2 format for backwards compatibility
const networkToCaip2: Record<string, Caip2Network> = {
    "base-sepolia": "eip155:84532",
    base: "eip155:8453",
    ethereum: "eip155:1",
    sepolia: "eip155:11155111",
};

const caip2Network: Caip2Network = networkToCaip2[network] || (network as Caip2Network);
const isTestnet = caip2Network.includes("84532") || caip2Network.includes("11155111");

// Create facilitator client and resource server
const facilitatorClient = new HTTPFacilitatorClient({
    url: facilitatorUrl,
});

// Export server for potential API route usage
export const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server);

// Create paywall for UI
const paywall = createPaywall()
    .withNetwork(evmPaywall)
    .withConfig({
        appName: "Code-Assist - AI Agent Fix Marketplace",
        testnet: isTestnet,
    })
    .build();

// x402 支付网关配置
// /api/query 端点需要支付才能获取解决方案
export const middleware = paymentProxy(
    {
        "/api/query": {
            accepts: [
                {
                    scheme: "exact",
                    price: "$0.01",  // MVP 固定价格：每次查询 0.01 USDC
                    network: caip2Network,
                    payTo,
                },
            ],
            description: "Purchase runtime error fix from Code-Assist marketplace",
            mimeType: "application/json",
        },
        "/api/bounty/create": {
            accepts: [
                {
                    scheme: "exact",
                    price: "$0.30",
                    network: caip2Network,
                    payTo,
                },
            ],
            description: "Post a new bounty on Code-Assist",
            mimeType: "application/json",
        },
    },
    server,
    undefined,
    paywall,
);

// Configure which paths the middleware should run on
export const config = {
    matcher: ["/api/query/:path*", "/api/bounty/create/:path*"],
};
