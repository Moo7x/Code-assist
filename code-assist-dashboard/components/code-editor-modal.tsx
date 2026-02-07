"use client"

import { useState, useCallback, useEffect } from "react"
import {
  X,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Bounty {
  id: string
  errorSignature: string
  language: string
  reward: string
  codeSnippet: string
}

type SubmitState = "idle" | "submitting" | "success" | "failed"

const languageOptions = ["Rust", "Python", "TypeScript", "Solidity", "C++", "Go", "Java"]
const frameworkOptions = [
  "React",
  "Next.js",
  "Django",
  "Flask",
  "Actix",
  "Express",
  "Hardhat",
  "Polkadot SDK",
]

function ChipSelect({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-2 block">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-md border transition-all ${
                isSelected
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-secondary/50 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CodeEditorModal({
  bounty,
  onClose,
  standalone,
}: {
  bounty?: Bounty | null
  onClose: () => void
  standalone?: boolean
}) {
  const [code, setCode] = useState("")
  const [errorSignature, setErrorSignature] = useState("")
  const [selectedLangs, setSelectedLangs] = useState<string[]>([])
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([])
  const [stakeAmount, setStakeAmount] = useState(50)
  const [submitState, setSubmitState] = useState<SubmitState>("idle")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (bounty) {
      setCode(bounty.codeSnippet)
      setErrorSignature(bounty.errorSignature)
      setSelectedLangs([bounty.language])
      setSelectedFrameworks([])
      setStakeAmount(50)
      setSubmitState("idle")
      setIsOpen(true)
    } else if (standalone) {
      setIsOpen(true)
    }
  }, [bounty, standalone])

  const toggleLang = useCallback((v: string) => {
    setSelectedLangs((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    )
  }, [])

  const toggleFramework = useCallback((v: string) => {
    setSelectedFrameworks((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    )
  }, [])

  const handleSubmit = () => {
    setSubmitState("submitting")
    setTimeout(() => {
      const isSuccess = Math.random() > 0.3
      setSubmitState(isSuccess ? "success" : "failed")
    }, 2000)
  }

  const handleClose = () => {
    setCode("")
    setErrorSignature("")
    setSelectedLangs([])
    setSelectedFrameworks([])
    setStakeAmount(50)
    setSubmitState("idle")
    setIsOpen(false)
    onClose()
  }

  if (!isOpen) return null

  const lines = code.split("\n")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border bg-card/95 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
          submitState === "failed"
            ? "border-destructive/50 shadow-destructive/10"
            : "border-border/50"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur-xl z-10">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {bounty ? `Resolve ${bounty.id}` : "New Solution"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bounty
                ? `${bounty.errorSignature} \u00b7 ${bounty.language}`
                : "Submit a fix to earn USDC"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {bounty && (
              <span className="text-sm font-mono font-semibold text-success">
                {bounty.reward} USDC
              </span>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Field 1: Error Signature */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Error Signature
            </label>
            <input
              type="text"
              value={errorSignature}
              onChange={(e) => setErrorSignature(e.target.value)}
              placeholder="Paste the error log header..."
              className="w-full h-10 px-4 rounded-lg border border-border/50 bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
            />
          </div>

          {/* Field 2: Context Chips */}
          <ChipSelect
            label="Select Language"
            options={languageOptions}
            selected={selectedLangs}
            onToggle={toggleLang}
          />
          <ChipSelect
            label="Select Framework"
            options={frameworkOptions}
            selected={selectedFrameworks}
            onToggle={toggleFramework}
          />

          {/* Field 3: Code Editor */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              The Solution
            </label>
            <div className="rounded-lg border border-border/50 bg-background overflow-hidden">
              {/* Editor Toolbar */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-secondary/30">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground ml-2">
                  solution.{selectedLangs[0]?.toLowerCase() === "typescript"
                    ? "ts"
                    : selectedLangs[0]?.toLowerCase() === "python"
                      ? "py"
                      : selectedLangs[0]?.toLowerCase() === "rust"
                        ? "rs"
                        : selectedLangs[0]?.toLowerCase() === "solidity"
                          ? "sol"
                          : selectedLangs[0]?.toLowerCase() === "c++"
                            ? "cpp"
                            : selectedLangs[0]?.toLowerCase() === "go"
                              ? "go"
                              : "txt"}
                </span>
              </div>

              {/* Code Area */}
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-secondary/20 flex flex-col items-end pr-3 pt-4 text-[10px] font-mono text-muted-foreground/40 select-none">
                  {lines.map((_, i) => (
                    <div key={i} className="leading-6">
                      {i + 1}
                    </div>
                  ))}
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full min-h-[200px] bg-transparent text-sm font-mono text-foreground p-4 pl-14 leading-6 resize-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/40"
                  placeholder="Write your solution here..."
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          {/* Field 4: Stake Slider */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Skin in the Game
            </label>
            <div className="rounded-lg border border-border/50 bg-background p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground font-medium">
                    Stake Collateral
                  </span>
                </div>
                <span className="text-lg font-bold font-mono text-primary">
                  {stakeAmount} USDC
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={stakeAmount}
                onChange={(e) => setStakeAmount(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-secondary cursor-pointer accent-primary"
              />
              <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-muted-foreground">
                <span>1 USDC</span>
                <span>100 USDC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 sticky bottom-0 bg-card/95 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            {submitState === "success" && (
              <div className="flex items-center gap-2 text-success text-sm animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">
                  Solution verified! +5 Reputation
                </span>
              </div>
            )}
            {submitState === "failed" && (
              <div className="flex items-center gap-2 text-destructive text-sm animate-in fade-in">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">
                  Verification failed. Stake slashed -1 USDC
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={
                submitState === "submitting" || submitState === "success"
              }
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitState === "submitting" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verifying...
                </>
              ) : submitState === "success" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </>
              ) : submitState === "failed" ? (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  Retry
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Upload & Sign (x402)
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
