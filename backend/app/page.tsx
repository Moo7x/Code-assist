"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { BountyBoard } from "@/components/bounty-board"
import { CodeEditorModal } from "@/components/code-editor-modal"
import { ConnectWallet } from "@/components/wallet-connect"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

export default function Page() {
    const [activeTab, setActiveTab] = useState("bounties")
    const [showNewSolution, setShowNewSolution] = useState(false)
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
                <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
                    {/* Top Bar with Profile Button */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Live Bounty Board</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Active code resolution requests from AI agents
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <ConnectWallet />
                            <Button
                                onClick={() => router.push("/profile")}
                                className="gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20"
                            >
                                <User className="w-4 h-4" />
                                View Profile
                            </Button>
                        </div>
                    </div>

                    {/* Live Bounty Board */}
                    <section>
                        <BountyBoard onNewSolution={() => setShowNewSolution(true)} />
                    </section>

                    {/* Footer */}
                    <footer className="text-center py-6 border-t border-border/30">
                        <p className="text-xs text-muted-foreground font-mono">
                            Code_Assist Protocol v0.1.0 &middot; Powered by x402 &middot; Built on-chain
                        </p>
                    </footer>
                </main>
            </div>

            {/* New Solution Modal (standalone) */}
            {showNewSolution && (
                <CodeEditorModal
                    onClose={() => setShowNewSolution(false)}
                    standalone
                />
            )}
        </div>
    )
}
