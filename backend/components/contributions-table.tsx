"use client"

import { useState, useEffect } from "react"
import { FileText, Search, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useWallet } from "@/components/providers/wallet-provider"
import useSWR from "swr"

interface Contribution {
  id: string
  contributionDate: string
  errorType: string
  language: string
  submissionDate: string
  successRate: number
  amountsUsed: number
  earnings: string
  status: "success" | "failed"
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ContributionsTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const { address } = useWallet()

  // Fetch solutions
  const { data: solutionsData, isLoading: isLoadingSolutions } = useSWR(
    address ? `/api/upload?seller_wallet=${address}` : null,
    fetcher
  )

  // Fetch votes for this seller to calculate stats
  const { data: votesData } = useSWR(
    address ? `/api/vote?seller=${address}` : null,
    fetcher
  )

  const contributions: Contribution[] = (solutionsData?.solutions || []).map((s: any) => {
    // Use solution's tracked stats directly
    const upvotes = s.upvotes || 0
    const downvotes = s.downvotes || 0
    const totalVotes = upvotes + downvotes
    const successRate = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 100

    return {
      id: s.id,
      contributionDate: new Date(s.created_at || Date.now()).toLocaleDateString(),
      errorType: s.error_signature,
      language: s.environment?.runtime || "Unknown",
      submissionDate: new Date(s.created_at || Date.now()).toLocaleDateString(),
      successRate,
      amountsUsed: s.usage_count || 0,  // Use tracked usage count
      earnings: `+${s.total_earnings || "0.00"}`,  // Use tracked earnings
      status: downvotes > upvotes ? "failed" : "success"
    }
  })

  // Filter local data
  const filtered = contributions.filter(
    (c) =>
      c.errorType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.language.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!address) return null

  if (isLoadingSolutions) {
    return <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Detailed Contributions
            </h2>
            <p className="text-xs text-muted-foreground">
              {filtered.length} entries
            </p>
          </div>
        </div>
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contributions..."
            className="w-full h-8 pl-9 pr-3 rounded-lg border border-border/50 bg-background text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/30 text-muted-foreground">
              <th className="text-left px-6 py-3 font-medium">ID (Hash)</th>
              <th className="text-left px-4 py-3 font-medium">
                Contribution Date
              </th>
              <th className="text-left px-4 py-3 font-medium">Error Signature</th>
              <th className="text-center px-4 py-3 font-medium">
                Success Rate
              </th>
              <th className="text-center px-4 py-3 font-medium">
                Usage Count
              </th>
              <th className="text-right px-6 py-3 font-medium">Est. Earnings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">No contributions found.</td>
              </tr>
            ) : filtered.map((c, i) => (
              <tr
                key={c.id}
                className="hover:bg-secondary/20 transition-colors"
              >
                <td className="px-6 py-3 text-muted-foreground font-mono">
                  {c.id.slice(0, 8)}...
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {c.contributionDate}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium truncate max-w-[200px]" title={c.errorType}>
                      {c.errorType}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border/50">
                      {c.language}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {c.status === "success" ? (
                      <CheckCircle2 className="w-3 h-3 text-success" />
                    ) : (
                      <XCircle className="w-3 h-3 text-destructive" />
                    )}
                    <span
                      className={
                        c.status === "success"
                          ? "text-success font-mono"
                          : "text-destructive font-mono"
                      }
                    >
                      {c.successRate}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                  {c.amountsUsed}
                </td>
                <td className="px-6 py-3 text-right">
                  <span
                    className={`font-mono font-semibold ${c.earnings.startsWith("+") ? "text-success" : "text-destructive"}`}
                  >
                    {c.earnings} USDC
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
