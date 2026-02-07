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
  Monitor,
  Terminal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/components/providers/wallet-provider"
import { useUpload } from "@/hooks/use-upload"
import { Bounty, BountyEnvironment } from "@/hooks/use-bounties"

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
              className={`text-[10px] font-mono px-2.5 py-1 rounded-md border transition-all ${isSelected
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
  const [submitState, setSubmitState] = useState<SubmitState>("idle")
  const [isOpen, setIsOpen] = useState(false)
  const [submissionStep, setSubmissionStep] = useState<string>("")
  const [txHash, setTxHash] = useState<string | null>(null)

  // Standalone mode environment tags
  const [runtimeTag, setRuntimeTag] = useState("")
  const [versionTag, setVersionTag] = useState("")
  const [osTag, setOsTag] = useState("")
  const [priceTag, setPriceTag] = useState("0.05")
  const [dependencies, setDependencies] = useState<{ name: string, version: string }[]>([])
  const [depName, setDepName] = useState("")
  const [depVersion, setDepVersion] = useState("")

  useEffect(() => {
    if (bounty) {
      setCode(bounty.codeSnippet)
      setErrorSignature(bounty.errorSignature)
      setSelectedLangs([bounty.language])
      setSelectedFrameworks([])
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

  const { address } = useWallet()
  const { uploadSolution } = useUpload()

  const handleSubmit = async () => {
    if (!address) {
      alert("Please connect your wallet first!")
      return
    }

    setSubmitState("submitting")
    setSubmissionStep("Waking Agent...")

    try {
      // Step 1: Simulate Agent Waking Up
      await new Promise(r => setTimeout(r, 1500))
      setSubmissionStep("Verifying Solution...")

      // Step 2: Upload & Verify
      // Convert dependencies array to Record
      const depsRecord: Record<string, string> = {}
      dependencies.forEach(d => { depsRecord[d.name] = d.version })

      const environment = bounty?.environment || (standalone ? {
        runtime: runtimeTag || selectedLangs[0] || "Unknown",
        runtime_version: versionTag || "*",
        os: osTag || "Unknown",
        dependencies: Object.keys(depsRecord).length > 0 ? depsRecord : undefined
      } : undefined)

      const response = await uploadSolution({
        errorSignature,
        language: runtimeTag || selectedLangs[0] || "Unknown",
        code,
        bountyId: bounty?.id,
        environment,
        price: standalone ? priceTag : undefined
      })

      // Step 3: Payout
      if (response.tx_hash) {
        setSubmissionStep("Processing Payout...")
        setTxHash(response.tx_hash)
      }

      setSubmitState("success")
      setSubmissionStep("Resolved!")

      // Keep modal open briefly to show success
    } catch (err) {
      console.error(err)
      setSubmitState("failed")
      setSubmissionStep("")
    }
  }

  const handleClose = () => {
    setCode("")
    setErrorSignature("")
    setSelectedLangs([])
    setSelectedFrameworks([])
    setSubmitState("idle")
    setIsOpen(false)
    setSubmissionStep("")
    setTxHash(null)
    onClose()
  }

  if (!isOpen) return null

  const lines = code.split("\n")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* ... (Backdrop & Modal Container) */}
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border bg-card/95 backdrop-blur-xl shadow-2xl transition-all duration-300 ${submitState === "failed"
          ? "border-destructive/50 shadow-destructive/10"
          : "border-border/50"
          }`}
      >
        {/* ... (Header) */}

        <div className="p-6 flex flex-col gap-5">
          {/* Field 1: Error Signature (Read-Only when from bounty) */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Error Signature
            </label>
            {bounty ? (
              <div className="w-full min-h-10 px-4 py-2.5 rounded-lg border border-border/50 bg-secondary/30 text-sm font-mono text-foreground">
                {errorSignature}
              </div>
            ) : (
              <input
                type="text"
                value={errorSignature}
                onChange={(e) => setErrorSignature(e.target.value)}
                placeholder="Paste the error log header..."
                className="w-full h-10 px-4 rounded-lg border border-border/50 bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
              />
            )}
          </div>

          {/* Field 2: Agent Environment (Read-Only) */}
          {bounty?.environment && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Agent Environment
              </label>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-md bg-secondary/50 border border-border/50 text-muted-foreground">
                  <Monitor className="w-3 h-3 text-primary" />
                  <span>{bounty.environment.os || "Unknown OS"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-md bg-secondary/50 border border-border/50 text-muted-foreground">
                  <Terminal className="w-3 h-3 text-success" />
                  <span>{bounty.environment.runtime || "Unknown"} {bounty.environment.runtime_version}</span>
                </div>
              </div>
              {bounty.environment.dependencies && Object.keys(bounty.environment.dependencies).length > 0 && (
                <div className="text-[10px] font-mono text-muted-foreground/60 mt-1">
                  Dependencies: {Object.entries(bounty.environment.dependencies).map(([k, v]) => `${k}@${v}`).join(", ")}
                </div>
              )}
            </div>
          )}

          {/* Field 2b: Environment Tags (Standalone Mode) */}
          {!bounty && standalone && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Solution Environment Tags
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground/60 mb-1 block">Runtime</label>
                  <input
                    type="text"
                    value={runtimeTag}
                    onChange={(e) => setRuntimeTag(e.target.value)}
                    placeholder="e.g. Python"
                    className="w-full h-9 px-3 rounded-md border border-border/50 bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground/60 mb-1 block">Version</label>
                  <input
                    type="text"
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    placeholder="e.g. 3.11.2"
                    className="w-full h-9 px-3 rounded-md border border-border/50 bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground/60 mb-1 block">OS</label>
                  <input
                    type="text"
                    value={osTag}
                    onChange={(e) => setOsTag(e.target.value)}
                    placeholder="e.g. macOS 14.2"
                    className="w-full h-9 px-3 rounded-md border border-border/50 bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Price Input */}
              <div className="mt-3">
                <label className="text-[10px] text-muted-foreground/60 mb-1 block">Price (USDC)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceTag}
                    onChange={(e) => setPriceTag(e.target.value)}
                    className="w-24 h-9 px-3 rounded-md border border-border/50 bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <span className="text-xs text-muted-foreground">USDC per query</span>
                </div>
              </div>

              {/* Dependencies Input */}
              <div className="mt-3">
                <label className="text-[10px] text-muted-foreground/60 mb-1 block">Dependencies (optional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={depName}
                    onChange={(e) => setDepName(e.target.value)}
                    placeholder="e.g. react"
                    className="w-28 h-8 px-2 rounded-md border border-border/50 bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <span className="text-xs text-muted-foreground">@</span>
                  <input
                    type="text"
                    value={depVersion}
                    onChange={(e) => setDepVersion(e.target.value)}
                    placeholder="e.g. 18.2.0"
                    className="w-24 h-8 px-2 rounded-md border border-border/50 bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (depName.trim()) {
                        setDependencies([...dependencies, { name: depName.trim(), version: depVersion.trim() || "*" }])
                        setDepName("")
                        setDepVersion("")
                      }
                    }}
                    className="h-8 px-3 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    + Add
                  </button>
                </div>
                {dependencies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {dependencies.map((dep, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary border border-border/50 text-muted-foreground flex items-center gap-1"
                      >
                        {dep.name}@{dep.version}
                        <button
                          type="button"
                          onClick={() => setDependencies(dependencies.filter((_, idx) => idx !== i))}
                          className="text-destructive hover:text-destructive/80 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {(runtimeTag || versionTag || osTag) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {runtimeTag && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary">
                      {runtimeTag}
                    </span>
                  )}
                  {versionTag && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-success/10 border border-success/30 text-success">
                      v{versionTag}
                    </span>
                  )}
                  {osTag && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary border border-border/50 text-muted-foreground">
                      {osTag}
                    </span>
                  )}
                  {priceTag && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-warning/10 border border-warning/30 text-warning">
                      ${priceTag} USDC
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

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

          {/* Success State Overlay */}
          {submitState === "success" && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Bounty Resolved!</h3>
              <p className="text-muted-foreground mb-6">
                Agent successfully accepted your solution.
              </p>

              {txHash && (
                <div className="bg-card border border-border/50 rounded-lg p-4 mb-6 w-full max-w-md">
                  <p className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">
                    Payment Sent
                  </p>
                  <a
                    href={`https://sepolia.basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-mono text-primary hover:underline break-all"
                  >
                    {txHash}
                  </a>
                </div>
              )}

              <Button onClick={handleClose}>
                Close & Refresh Board
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 sticky bottom-0 bg-card/95 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            {/* Step Status */}
            {submitState === "submitting" && (
              <div className="flex items-center gap-2 text-primary text-sm animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-medium font-mono">
                  {submissionStep}
                </span>
              </div>
            )}
            {submitState === "failed" && (
              <div className="flex items-center gap-2 text-destructive text-sm animate-in fade-in">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">
                  {submissionStep || "Verification failed. Please check error signature."}
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
              disabled={submitState === 'submitting'}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={
                submitState === "submitting" || submitState === "success" || !code || !errorSignature
              }
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[140px]"
            >
              {submitState === "submitting" ? (
                <span className="font-mono text-xs">{submissionStep}</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Upload & Sign
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
