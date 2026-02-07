"use client"

import {
  Github,
  CheckCircle2,
  Shield,
  Calendar,
  Coins,
  TrendingUp,
  DollarSign,
  Code2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

function ReputationRing({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = (score / 1000) * circumference
  const offset = circumference - progress

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="6"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{score}</span>
        <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">
          Score
        </span>
      </div>
    </div>
  )
}

export function ProfileHeader() {
  return (
    <div className="flex flex-col gap-4">
      {/* Profile Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* User Card */}
        <div className="flex items-center gap-5 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 lg:w-[320px] shrink-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full border-2 border-border/60 bg-secondary flex items-center justify-center overflow-hidden">
              <svg
                viewBox="0 0 80 80"
                className="w-full h-full text-muted-foreground/30"
              >
                <circle cx="40" cy="30" r="14" fill="currentColor" />
                <ellipse cx="40" cy="68" rx="22" ry="16" fill="currentColor" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-card flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-success-foreground" />
            </div>
          </div>

          {/* User Info */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">
              DevSolver_42
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>Joined Jan 2025</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Github className="w-3 h-3 shrink-0" />
              <span className="truncate">github.com/devsolver42</span>
              <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5 text-xs">
                <Shield className="w-3 h-3 text-success shrink-0" />
                <span className="font-mono text-success">50 USDC</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground border border-border/50"
              >
                Withdraw
              </Button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Coins className="w-3 h-3 shrink-0" />
              <span>Amounts used: <span className="font-mono text-foreground">12</span></span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          {/* Reputation Card */}
          <div className="group relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 hover:border-primary/30 transition-all duration-300">
            <div className="absolute inset-0 rounded-xl bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Reputation
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Top 1%
                </span>
              </div>
              <ReputationRing score={850} />
              <p className="text-center text-[10px] text-muted-foreground mt-2">
                Top 1% Solver
              </p>
            </div>
          </div>

          {/* Earnings Card */}
          <div className="group relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 hover:border-success/30 transition-all duration-300">
            <div className="absolute inset-0 rounded-xl bg-success/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-success/10">
                    <DollarSign className="w-3.5 h-3.5 text-success" />
                  </div>
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Earnings
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">
                  x402
                </span>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  $124.50
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Paid by x402 Protocol
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-3">
                <span>Last payout</span>
                <span className="font-mono text-foreground">+$5.00 USDC</span>
              </div>
            </div>
          </div>

          {/* Solutions Card */}
          <div className="group relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 hover:border-primary/30 transition-all duration-300">
            <div className="absolute inset-0 rounded-xl bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                    <Code2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Solutions
                  </h3>
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-3xl font-bold text-foreground tracking-tight">
                    42
                  </span>
                  <span className="text-base text-muted-foreground">/</span>
                  <span className="text-base text-destructive">2</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Fixed / Failed
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="text-center p-1.5 rounded-lg bg-success/5 border border-success/10">
                  <p className="text-base font-semibold text-success">95.5%</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                    Success
                  </p>
                </div>
                <div className="text-center p-1.5 rounded-lg bg-destructive/5 border border-destructive/10">
                  <p className="text-base font-semibold text-destructive">
                    4.5%
                  </p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                    Failed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
