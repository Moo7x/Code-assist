import {
  Github,
  CheckCircle2,
  Shield,
  Calendar,
  Coins,
  TrendingUp,
  DollarSign,
  Code2,
  MinusCircle,
  PlusCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSeller } from "@/hooks/use-seller"
import { ConnectWallet } from "@/components/wallet-connect"
import { useWallet } from "@/components/providers/wallet-provider"
import { useState } from "react"
import { SetupProfileModal } from "@/components/setup-profile-modal"
import { WithdrawModal } from "@/components/withdraw-modal"
import { StakeModal } from "@/components/stake-modal"

function StakedRing({ amount }: { amount: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  // Max stake for visual progress is 100 USDC
  const progress = Math.min(amount, 100) / 100 * circumference
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
        <span className="text-2xl font-bold text-foreground">${amount.toFixed(0)}</span>
        <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">
          Staked
        </span>
      </div>
    </div>
  )
}

export function ProfileHeader() {
  const { address } = useWallet()
  const { seller, isLoading, isConnected, refresh } = useSeller()
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showStakeModal, setShowStakeModal] = useState(false)

  const handleRegister = () => {
    if (!isConnected || !address) return
    setShowSetupModal(true)
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-10 gap-4 border border-dashed border-border rounded-xl">
        <p className="text-muted-foreground">Please connect your wallet to view profile</p>
        <ConnectWallet />
      </div>
    )
  }

  if (isLoading) {
    return <div className="p-10 text-center animate-pulse">Loading profile...</div>
  }

  if (!seller) {
    return (
      <>
        <div className="flex flex-col items-center justify-center p-10 gap-4 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground">Profile not found. Register as a seller?</p>
          <Button onClick={handleRegister}>
            Register Now
          </Button>
        </div>
        <SetupProfileModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onComplete={refresh}
        />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Profile Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* User Card */}
        <div className="flex items-center gap-5 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 lg:w-[320px] shrink-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full border-2 border-border/60 bg-secondary flex items-center justify-center overflow-hidden">
              {/* Placeholder Avatar based on wallet */}
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center text-xs font-mono text-muted-foreground">
                {seller.wallet.slice(0, 4)}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-card flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-success-foreground" />
            </div>
          </div>

          {/* User Info */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">
              {seller.github_username || "Anon Solver"}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>Joined recently</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Github className="w-3 h-3 shrink-0" />
              <span className="truncate">{seller.github_username ? `github.com/${seller.github_username}` : "No GitHub linked"}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5 text-xs">
                <Shield className="w-3 h-3 text-success shrink-0" />
                <span className="font-mono text-success">{seller.reputation_score} Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          {/* Staked USDC Card (Replaces Reputation) */}
          <div className="group relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 hover:border-primary/30 transition-all duration-300">
            <div className="absolute inset-0 rounded-xl bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                    <Coins className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Staking
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Base Sepolia
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center">
                <StakedRing amount={parseFloat(seller.staked_amount) || 0} />

                <div className="mt-4 w-full flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5"
                    onClick={() => setShowStakeModal(true)}
                  >
                    <PlusCircle className="w-3 h-3" />
                    Stake
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5 border-dashed"
                    onClick={() => setShowWithdrawModal(true)}
                  >
                    <MinusCircle className="w-3 h-3" />
                    Withdraw
                  </Button>
                </div>
              </div>
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
                  ${(seller.stats?.total_earnings || 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Paid by x402 Protocol
                </p>
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
                    {seller.stats?.solutions_count || 0}
                  </span>
                  <span className="text-base text-muted-foreground">/</span>
                  <span className="text-base text-success font-mono">{((seller.stats?.success_rate || 0) * 100).toFixed(0)}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Success Rate
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        maxAmount={seller.staked_amount}
        onSuccess={refresh}
      />
      <StakeModal
        isOpen={showStakeModal}
        onClose={() => setShowStakeModal(false)}
        onSuccess={refresh}
      />
    </div>
  )
}
