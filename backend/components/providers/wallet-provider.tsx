"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface WalletContextType {
    address: string | null
    isConnected: boolean
    connect: () => Promise<void>
    disconnect: () => void
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [address, setAddress] = useState<string | null>(null)

    useEffect(() => {
        // Check if already connected
        const checkConnection = async () => {
            if (typeof window !== "undefined" && (window as any).ethereum) {
                try {
                    const accounts = await (window as any).ethereum.request({ method: "eth_accounts" })
                    if (accounts.length > 0) {
                        setAddress(accounts[0])
                    }
                } catch (error) {
                    console.error("Failed to check wallet connection:", error)
                }
            }
        }
        checkConnection()

        // Listen for account changes
        if (typeof window !== "undefined" && (window as any).ethereum) {
            (window as any).ethereum.on("accountsChanged", (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAddress(accounts[0])
                } else {
                    setAddress(null)
                }
            })
        }
    }, [])

    const connect = async () => {
        if (typeof window !== "undefined" && (window as any).ethereum) {
            try {
                const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" })
                if (accounts.length > 0) {
                    setAddress(accounts[0])
                }
            } catch (error) {
                console.error("Failed to connect wallet:", error)
                throw error
            }
        } else {
            alert("Please install MetaMask or another Web3 wallet!")
        }
    }

    const disconnect = () => {
        setAddress(null)
    }

    return (
        <WalletContext.Provider value={{ address, isConnected: !!address, connect, disconnect }}>
            {children}
        </WalletContext.Provider>
    )
}

export const useWallet = () => {
    const context = useContext(WalletContext)
    if (context === undefined) {
        throw new Error("useWallet must be used within a WalletProvider")
    }
    return context
}
