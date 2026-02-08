"use client"

import { useState } from "react"
import { FileText, Search, CheckCircle2, XCircle, Loader2, X, DollarSign, Edit2 } from "lucide-react"
import { useWallet } from "@/components/providers/wallet-provider"
import useSWR, { mutate } from "swr"

interface Contribution {
  id: string
  contributionDate: string
  errorType: string
  language: string
  submissionDate: string
  successRate: number
  amountsUsed: number
  earnings: string
  price: string
  status: "success" | "failed"
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ContributionsTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSolution, setSelectedSolution] = useState<Contribution | null>(null)
  const [newPrice, setNewPrice] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const { address } = useWallet()

  // Fetch solutions
  const { data: solutionsData, isLoading: isLoadingSolutions } = useSWR(
    address ? `/api/upload?seller_wallet=${address}` : null,
    fetcher
  )

  const contributions: Contribution[] = (solutionsData?.solutions || []).map((s: any) => {
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
      amountsUsed: s.usage_count || 0,
      earnings: `+${s.total_earnings || "0.00"}`,
      price: s.price || "0.01",
      status: downvotes > upvotes ? "failed" : "success"
    }
  })

  const filtered = contributions.filter(
    (c) =>
      c.errorType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.language.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRowClick = (contribution: Contribution) => {
    setSelectedSolution(contribution)
    setNewPrice(contribution.price)
  }

  const handleUpdatePrice = async () => {
    if (!selectedSolution || !newPrice) return

    setIsUpdating(true)
    try {
      const res = await fetch(`/api/solution/${selectedSolution.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: newPrice })
      })

      if (res.ok) {
        // Refresh data
        mutate(`/api/upload?seller_wallet=${address}`)
        setSelectedSolution(null)
      }
    } catch (error) {
      console.error("Failed to update price:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!address) return null

  if (isLoadingSolutions) {
    return <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
  }

  return (
    <>
      {/* Edit Price Modal */}
      {selectedSolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border/50 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" />
                Set Query Price
              </h3>
              <button
                onClick={() => setSelectedSolution(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Error Signature</p>
                <p className="text-sm font-mono text-foreground truncate">{selectedSolution.errorType}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Usage Count</p>
                  <p className="text-lg font-bold text-foreground">{selectedSolution.amountsUsed}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
                  <p className="text-lg font-bold text-success">{selectedSolution.earnings} USDC</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Price per Query (USDC)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full h-12 pl-9 pr-4 rounded-lg border border-border/50 bg-background text-foreground font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="0.05"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This is how much agents will pay each time they query this solution.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedSolution(null)}
                  className="flex-1 h-10 rounded-lg border border-border/50 text-muted-foreground hover:bg-secondary/50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePrice}
                  disabled={isUpdating || !newPrice}
                  className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Save Price</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {filtered.length} entries • Click row to set price
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
              ) : filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => handleRowClick(c)}
                  className="hover:bg-secondary/20 transition-colors cursor-pointer"
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
    </>
  )
}
