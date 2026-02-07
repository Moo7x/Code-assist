"use client"

import { Button } from "@/components/ui/button"
import { useWallet } from "@/components/providers/wallet-provider"
import { Wallet } from "lucide-react"

export function ConnectWallet() {
    const { address, isConnected, connect, disconnect } = useWallet()

    const shortenAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    if (isConnected && address) {
        return (
            <Button
                variant="outline"
                onClick={disconnect}
                className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-mono"
            >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {shortenAddress(address)}
            </Button>
        )
    }

    return (
        <Button onClick={connect} className="gap-2">
            <Wallet className="w-4 h-4" />
            Connect Wallet
        </Button>
    )
}
