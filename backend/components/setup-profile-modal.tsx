"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github, Shield, CheckCircle2, Loader2, ArrowRight } from "lucide-react"
import { useStake } from "@/hooks/use-stake"
import { useWallet } from "@/components/providers/wallet-provider"
import { useSeller } from "@/hooks/use-seller"
import { useEffect } from "react"

interface SetupProfileModalProps {
    isOpen: boolean
    onClose: () => void
    onComplete: () => void
}

export function SetupProfileModal({ isOpen, onClose, onComplete }: SetupProfileModalProps) {
    const { address } = useWallet()
    const { stake, isStaking } = useStake()
    const { seller } = useSeller()
    const [step, setStep] = useState<1 | 2>(1)
    const [stakeAmount, setStakeAmount] = useState("10")
    const [isGithubLinking, setIsGithubLinking] = useState(false)

    // Check if already staked
    useEffect(() => {
        if (seller && parseFloat(seller.staked_amount) >= 10) {
            setStep(2)
        }
    }, [seller])

    const handleStake = async () => {
        try {
            await stake(Number(stakeAmount))
            setStep(2)
        } catch (e) {
            console.error("Staking failed", e)
            // In a real app, show toast error
        }
    }

    const handleGithubLink = () => {
        setIsGithubLinking(true)
        // Redirect to GitHub Auth
        // Ensure we are using the current origin for the callback if needed, but the API handles the redirect
        // Passing wallet is crucial for binding
        const target = `/api/auth/github?wallet=${address}`
        window.location.href = target
    }

    const handleSkipGithub = () => {
        // Just close and refresh
        if (onComplete) onComplete()
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Complete Your Profile</DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? "Stake USDC to activate your seller account and build reputation."
                            : "Link your GitHub account to showcase your contributions."}
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Stake Amount (USDC)</Label>
                            <div className="relative">
                                <Input
                                    id="amount"
                                    value={stakeAmount}
                                    onChange={(e) => setStakeAmount(e.target.value)}
                                    type="number"
                                    min="10"
                                    className="pl-8"
                                />
                                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            </div>
                            <p className="text-[0.8rem] text-muted-foreground">
                                Minimum stake is 10 USDC. Higher stake = higher initial reputation.
                            </p>
                        </div>
                        <Button onClick={handleStake} disabled={isStaking} className="w-full">
                            {isStaking ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Staking...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Stake & Continue
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/50">
                            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-6 h-6 text-success" />
                            </div>
                            <h3 className="font-semibold mb-1">Staking Successful!</h3>
                            <p className="text-sm text-center text-muted-foreground">
                                Your reputation initialized. Now link GitHub to verify your history.
                            </p>
                        </div>

                        <Button onClick={handleGithubLink} disabled={isGithubLinking} className="w-full bg-[#24292F] hover:bg-[#24292F]/90">
                            {isGithubLinking ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Redirecting...
                                </>
                            ) : (
                                <>
                                    <Github className="mr-2 h-4 w-4" />
                                    Connect GitHub
                                </>
                            )}
                        </Button>

                        <Button variant="ghost" onClick={handleSkipGithub} className="w-full">
                            Skip for now
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
