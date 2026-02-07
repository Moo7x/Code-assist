"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { ProfileHeader } from "@/components/profile-header"
import { ContributionsTable } from "@/components/contributions-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("reputation")
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-background">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      {/* Top radial glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.04] blur-[120px] rounded-full pointer-events-none" />

      {/* Sidebar */}
      <div className="relative z-20 hidden md:block">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col min-h-screen">
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full flex flex-col gap-8">
          {/* Top Bar with Back Button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-foreground border border-border/50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bounties
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">My Profile</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your reputation, earnings, and contribution history
              </p>
            </div>
          </div>

          {/* Profile Header + Stats */}
          <section>
            <ProfileHeader />
          </section>

          {/* Contributions Table */}
          <section>
            <ContributionsTable />
          </section>

          {/* Footer */}
          <footer className="text-center py-6 border-t border-border/30">
            <p className="text-xs text-muted-foreground font-mono">
              Code_Assist Protocol v0.1.0 &middot; Powered by x402 &middot; Built on-chain
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
