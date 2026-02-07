"use client"

import { useState } from "react"
import { FileText, Search, CheckCircle2, XCircle } from "lucide-react"

interface Contribution {
  id: number
  contributionDate: string
  errorType: string
  language: string
  submissionDate: string
  successRate: number
  amountsUsed: number
  earnings: string
  status: "success" | "failed"
}

const contributions: Contribution[] = [
  {
    id: 1,
    contributionDate: "2025-01-15",
    errorType: "Cargo Build Failed",
    language: "Rust",
    submissionDate: "2025-01-15",
    successRate: 100,
    amountsUsed: 1,
    earnings: "+5.00",
    status: "success",
  },
  {
    id: 2,
    contributionDate: "2025-01-14",
    errorType: "Import Error: Module Not Found",
    language: "Python",
    submissionDate: "2025-01-14",
    successRate: 100,
    amountsUsed: 1,
    earnings: "+3.50",
    status: "success",
  },
  {
    id: 3,
    contributionDate: "2025-01-13",
    errorType: "TypeError: Cannot read properties",
    language: "TypeScript",
    submissionDate: "2025-01-13",
    successRate: 0,
    amountsUsed: 2,
    earnings: "-1.00",
    status: "failed",
  },
  {
    id: 4,
    contributionDate: "2025-01-12",
    errorType: "Gas Limit Exceeded",
    language: "Solidity",
    submissionDate: "2025-01-12",
    successRate: 100,
    amountsUsed: 1,
    earnings: "+8.00",
    status: "success",
  },
  {
    id: 5,
    contributionDate: "2025-01-11",
    errorType: "Segmentation Fault",
    language: "C++",
    submissionDate: "2025-01-11",
    successRate: 100,
    amountsUsed: 1,
    earnings: "+6.00",
    status: "success",
  },
  {
    id: 6,
    contributionDate: "2025-01-10",
    errorType: "Null Pointer Exception",
    language: "Java",
    submissionDate: "2025-01-10",
    successRate: 100,
    amountsUsed: 1,
    earnings: "+4.50",
    status: "success",
  },
  {
    id: 7,
    contributionDate: "2025-01-09",
    errorType: "Panic: index out of range",
    language: "Go",
    submissionDate: "2025-01-09",
    successRate: 0,
    amountsUsed: 3,
    earnings: "-1.00",
    status: "failed",
  },
  {
    id: 8,
    contributionDate: "2025-01-08",
    errorType: "Stack Overflow",
    language: "Rust",
    submissionDate: "2025-01-08",
    successRate: 100,
    amountsUsed: 1,
    earnings: "+5.50",
    status: "success",
  },
]

export function ContributionsTable() {
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = contributions.filter(
    (c) =>
      c.errorType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.language.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <th className="text-left px-6 py-3 font-medium">#</th>
              <th className="text-left px-4 py-3 font-medium">
                Contribution Date
              </th>
              <th className="text-left px-4 py-3 font-medium">Error Type</th>
              <th className="text-left px-4 py-3 font-medium">
                Submission Date
              </th>
              <th className="text-center px-4 py-3 font-medium">
                Success Rate
              </th>
              <th className="text-center px-4 py-3 font-medium">
                Amounts Used
              </th>
              <th className="text-right px-6 py-3 font-medium">Earnings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {filtered.map((c, i) => (
              <tr
                key={c.id}
                className="hover:bg-secondary/20 transition-colors"
              >
                <td className="px-6 py-3 text-muted-foreground font-mono">
                  {i + 1}.
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {c.contributionDate}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">
                      {c.errorType}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border/50">
                      {c.language}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {c.submissionDate}
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
