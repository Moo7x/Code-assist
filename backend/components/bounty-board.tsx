"use client"

import { useState } from "react"
import { Bug, ChevronRight, CircleDot, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeEditorModal } from "@/components/code-editor-modal"
import { useBounties, Bounty, BountyStatus } from "@/hooks/use-bounties"

const statusConfig: Record<BountyStatus | "solved", { color: string; dot: string; bg: string }> = {
  waiting: { color: "text-success", dot: "bg-success", bg: "bg-success/5" },
  sleeping: { color: "text-warning", dot: "bg-warning", bg: "bg-warning/5" },
  urgent: { color: "text-destructive", dot: "bg-destructive", bg: "bg-destructive/5" },
  solved: { color: "text-muted-foreground", dot: "bg-muted-foreground", bg: "bg-muted/10" },
}




const langColors: Record<string, string> = {
  Rust: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Python: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  TypeScript: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Solidity: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "C++": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Go: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
}

export function BountyBoard({ onNewSolution }: { onNewSolution?: () => void }) {
  const { bounties, isLoading } = useBounties()
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredBounties = bounties.filter(
    (b) =>
      b.errorSignature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.context.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20 text-muted-foreground animate-pulse">
        Loading bounties from chain...
      </div>
    )
  }

  return (
    <>
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Bug className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Live Bounty Board
            </h2>
            <p className="text-xs text-muted-foreground">
              {filteredBounties.length} stuck agents need help
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onNewSolution}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-3.5 h-3.5" />
          New Solution
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by Error Signature or Language..."
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all font-mono"
        />
      </div>

      {/* Bounty Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredBounties.length === 0 ? (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No active bounties found. check back later!
          </div>
        ) : filteredBounties.map((bounty) => {
          const status = statusConfig[bounty.status] || statusConfig.waiting
          return (
            <div
              key={bounty.id}
              className="group rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 hover:border-primary/30 transition-all duration-300 cursor-pointer flex flex-col"
              onClick={() => setSelectedBounty(bounty)}
            >
              {/* Error Title */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-destructive truncate">
                    {bounty.language}: {bounty.errorSignature}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    Bounty {bounty.id}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <CircleDot className={`w-3 h-3 ${status.color}`} />
                  <span className={`text-[10px] font-medium ${status.color}`}>
                    {bounty.statusLabel}
                  </span>
                </div>
              </div>

              {/* Context Chips */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${langColors[bounty.language] || "bg-muted text-muted-foreground border-border"}`}
                >
                  {bounty.language}
                </span>
                {bounty.context.map((ctx) => (
                  <span
                    key={ctx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary border border-border/50 text-muted-foreground"
                  >
                    {ctx}
                  </span>
                ))}
              </div>

              {/* Bottom Row: Reward + Resolve */}
              <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/30">
                <span className="text-base font-bold font-mono text-success">
                  {bounty.reward} USDC
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs text-primary hover:text-primary hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedBounty(bounty)
                  }}
                >
                  Resolve
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <CodeEditorModal
        bounty={selectedBounty}
        onClose={() => setSelectedBounty(null)}
      />
    </>
  )
}
