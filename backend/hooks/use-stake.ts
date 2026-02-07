"use client"

import { useState } from "react"
import { useWallet } from "@/components/providers/wallet-provider"

// USDC Contract on Base Sepolia
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
// Treasury/Staking Contract (Burn address for demo)
// Treasury/Staking Contract
const TREASURY_ADDRESS = "0xf5726ed13f95b6fb4231fce364bed622f70c9ad2"

const BASE_SEPOLIA_CHAIN_ID = "0x14a33" // 84531
// Actually Base Sepolia is 84532 (0x14a34)
const CHAIN_ID = "0x14a34"

const ERC20_ABI_TRANSFER = "0xa9059cbb" // transfer(address,uint256) function selector

export function useStake() {
    const { address } = useWallet()
    const [isStaking, setIsStaking] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const stake = async (amount: number) => {
        // ... (existing stake logic) ...
        if (!address) throw new Error("Wallet not connected")

        setIsStaking(true)
        setError(null)

        try {
            if (typeof window === "undefined" || !(window as any).ethereum) {
                throw new Error("Ethereum provider not found")
            }

            // 1. Switch Network to Base Sepolia
            try {
                await (window as any).ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: CHAIN_ID }],
                })
            } catch (switchError: any) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                    await (window as any).ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [{
                            chainId: CHAIN_ID,
                            chainName: "Base Sepolia",
                            rpcUrls: ["https://sepolia.base.org"],
                            nativeCurrency: {
                                name: "ETH",
                                symbol: "ETH",
                                decimals: 18
                            },
                            blockExplorerUrls: ["https://sepolia.basescan.org"]
                        }],
                    })
                } else {
                    throw switchError
                }
            }

            // 2. Prepare USDC Transfer Data
            const usdcDecimals = 6
            const rawAmount = BigInt(Math.floor(amount * Math.pow(10, usdcDecimals)))
            const paddedAddress = TREASURY_ADDRESS.slice(2).padStart(64, "0")
            const paddedAmount = rawAmount.toString(16).padStart(64, "0")

            const data = `${ERC20_ABI_TRANSFER}${paddedAddress}${paddedAmount}`

            // 3. Send Transaction
            const txHash = await (window as any).ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    from: address,
                    to: USDC_ADDRESS,
                    data: data,
                    value: "0x0"
                }]
            })

            console.log("Staking TX Hash:", txHash)

            // 3.5 Wait for Transaction Receipt
            let receipt = null
            while (receipt === null) {
                try {
                    receipt = await (window as any).ethereum.request({
                        method: "eth_getTransactionReceipt",
                        params: [txHash],
                    })
                    if (receipt === null) {
                        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2s
                    }
                } catch (e) {
                    console.error("Error checking receipt:", e)
                    break
                }
            }

            if (receipt && receipt.status === "0x0") {
                throw new Error("Transaction reverted on chain")
            }

            // 4. Notify Backend
            const response = await fetch("/api/stake", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: address, amount: amount, txHash }),
            })

            const resData = await response.json()
            if (!response.ok) throw new Error(resData.error || "Failed to stake")

            return resData
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Staking failed")
            throw err
        } finally {
            setIsStaking(false)
        }
    }

    const withdraw = async (amount: number) => {
        if (!address) throw new Error("Wallet not connected")
        setIsStaking(true)
        setError(null)
        try {
            const response = await fetch("/api/stake", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: address, amount: amount }),
            })
            const resData = await response.json()
            if (!response.ok) throw new Error(resData.error || "Failed to withdraw")
            return resData
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Withdrawal failed")
            throw err
        } finally {
            setIsStaking(false)
        }
    }

    return { stake, withdraw, isStaking, error }
}
