"use client"

import useSWR from "swr"

export type BountyStatus = "waiting" | "sleeping" | "urgent" | "solved"

export interface BountyEnvironment {
    os: string
    runtime: string
    runtime_version: string
    dependencies?: Record<string, string>
}

export interface Bounty {
    id: string
    errorSignature: string
    language: string
    context: string[]
    reward: string
    status: BountyStatus
    statusLabel: string
    codeSnippet: string
    agentWallet: string
    backendStatus: "open" | "claimed" | "solved"
    environment: BountyEnvironment
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useBounties() {
    const { data, error, isLoading, mutate } = useSWR("/api/bounty", fetcher, {
        refreshInterval: 5000 // Poll every 5 seconds for updates
    })

    // Transform backend data to frontend format
    const bounties: Bounty[] = data?.bounties?.map((b: any) => {
        let status: BountyStatus = "waiting"
        let statusLabel = "Agent Waiting"

        if (b.status === "claimed") {
            status = "sleeping"
            statusLabel = "Agent Sleeping"
        } else if (b.status === "solved") {
            status = "solved"
            statusLabel = "Solved"
        } else if (parseFloat(b.reward) >= 5.0) {
            status = "urgent"
            statusLabel = "Agent Urgent"
        }

        const env: BountyEnvironment = b.environment || { os: "Unknown", runtime: "Unknown", runtime_version: "" }

        return {
            id: b.id,
            errorSignature: b.error_signature,
            language: (env.runtime || "Unknown").split(" ")[0], // Simple parse
            context: [env.os, env.runtime_version].filter(Boolean),
            reward: b.reward,
            status,
            statusLabel,
            codeSnippet: `// Error in ${b.error_signature}\n// Environment: ${JSON.stringify(env)}\n// Waiting for solution...`,
            agentWallet: b.agent_wallet,
            backendStatus: b.status,
            environment: env
        }
    }) || []

    return {
        bounties,
        isLoading,
        isError: error,
        refresh: mutate,
    }
}
