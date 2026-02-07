"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { useWallet } from "@/components/providers/wallet-provider"
import { useSearchParams, useRouter } from "next/navigation"

export interface SellerProfile {
    wallet: string
    github_username?: string
    github_stars: number
    github_contributions: number
    reputation_score: number
    joined_at: string
    total_sales: number
    total_earnings: string
    stats: {
        total_earnings: number
        solutions_count: number
        success_rate: number
    }
    staked_amount: string
}

const fetcher = async (url: string): Promise<SellerProfile | null> => {
    const res = await fetch(url)
    if (res.status === 404) return null
    if (!res.ok) throw new Error("Failed to fetch")
    const data = await res.json()
    // Transform backend data to include stats object for UI compatibility
    return {
        ...data,
        stats: {
            total_earnings: parseFloat(data.total_earnings || "0"),
            solutions_count: data.total_sales || 0,
            success_rate: data.success_votes && (data.success_votes + data.failure_votes) > 0
                ? data.success_votes / (data.success_votes + data.failure_votes)
                : 0
        }
    }
}

export function useSeller() {
    const { address, isConnected } = useWallet()
    const searchParams = useSearchParams()
    const router = useRouter()

    const { data, error, isLoading, mutate } = useSWR<SellerProfile | null>(
        isConnected && address ? `/api/seller?wallet=${address}` : null,
        fetcher
    )

    // Handle GitHub Auth Success Callback Params
    useEffect(() => {
        if (searchParams.get("github_auth") === "success") {
            // Refresh data to show new reputation/github info
            mutate()
            // Clean URL
            router.replace("/profile")
        }
    }, [searchParams, mutate, router])

    return {
        seller: data,
        isLoading,
        isError: error,
        isConnected,
        refresh: mutate
    }
}
