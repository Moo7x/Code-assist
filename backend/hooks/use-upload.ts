"use client"

import { useState } from "react"
import { useWallet } from "@/components/providers/wallet-provider"

interface UploadParams {
    errorSignature: string
    language: string
    code: string
    bountyId?: string
    price?: string
    environment?: {
        runtime: string
        runtime_version: string
        os: string
        dependencies?: Record<string, string>
    }
}

export function useUpload() {
    const { address } = useWallet()
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const uploadSolution = async (params: UploadParams) => {
        if (!address) {
            throw new Error("Wallet not connected")
        }

        setIsUploading(true)
        setError(null)

        try {
            // Use provided environment or build from language
            const env = params.environment || {
                runtime: params.language,
                os: "unknown",
                runtime_version: "*"
            }

            const response = await fetch("/api/upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    seller_wallet: address,
                    error_signature: params.errorSignature,
                    environment: env,
                    solution: params.code,
                    price: params.price || "0.05",
                    tags: [env.runtime, `v${env.runtime_version}`, env.os].filter(t => t && t !== "unknown" && t !== "*"),
                    bounty_id: params.bountyId
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 402) {
                    throw new Error("Insufficient stake. Please stake more USDC to upload.")
                }
                throw new Error(data.error || "Failed to upload solution")
            }

            return data
        } catch (err: any) {
            setError(err.message)
            throw err
        } finally {
            setIsUploading(false)
        }
    }

    return {
        uploadSolution,
        isUploading,
        error,
    }
}
