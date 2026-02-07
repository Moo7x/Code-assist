"use client"

import { useState } from "react"
import { useStake } from "@/hooks/use-stake"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, AlertCircle } from "lucide-react"

interface WithdrawModalProps {
    isOpen: boolean
    onClose: () => void
    maxAmount: string
    onSuccess: () => void
}

export function WithdrawModal({ isOpen, onClose, maxAmount, onSuccess }: WithdrawModalProps) {
    const [amount, setAmount] = useState("")
    const { withdraw, isStaking, error } = useStake()

    const handleWithdraw = async () => {
        if (!amount || isNaN(Number(amount))) return
        try {
            await withdraw(Number(amount))
            onSuccess()
            onClose()
            setAmount("")
        } catch (e) {
            console.error("Withdrawal failed", e)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Withdraw Staked USDC</DialogTitle>
                    <DialogDescription>
                        Enter the amount of USDC you want to withdraw from the treasury.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                            Available: <span className="text-foreground font-mono">{maxAmount} USDC</span>
                        </p>
                        <Input
                            id="amount"
                            placeholder="Amount to withdraw"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            type="number"
                            step="0.01"
                            min="0"
                            max={maxAmount}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <p>{error}</p>
                        </div>
                    )}

                    <Button onClick={handleWithdraw} disabled={isStaking || !amount}>
                        {isStaking ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Confirm Withdrawal"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
