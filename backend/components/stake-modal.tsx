"use client"

import { useState } from "react"
import { useStake } from "@/hooks/use-stake"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Coins, AlertCircle } from "lucide-react"

interface StakeModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function StakeModal({ isOpen, onClose, onSuccess }: StakeModalProps) {
    const [amount, setAmount] = useState("10")
    const { stake, isStaking, error } = useStake()

    const handleStake = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return
        try {
            await stake(Number(amount))
            onSuccess()
            onClose()
            setAmount("10")
        } catch (e) {
            console.error("Staking failed", e)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Stake Additional USDC</DialogTitle>
                    <DialogDescription>
                        Increase your staked amount to boost your reputation score.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Amount (USDC)</Label>
                        <div className="relative">
                            <Input
                                id="stake-amount"
                                placeholder="Amount to stake"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                type="number"
                                step="1"
                                min="1"
                                className="pl-8"
                            />
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <p>{error}</p>
                        </div>
                    )}

                    <Button onClick={handleStake} disabled={isStaking || !amount} className="w-full">
                        {isStaking ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Coins className="w-4 h-4 mr-2" />
                                Stake USDC
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Label({ children }: { children: React.ReactNode }) {
    return <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{children}</label>
}
