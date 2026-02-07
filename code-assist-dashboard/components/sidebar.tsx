"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Terminal,
  Bug,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  {
    id: "bounties",
    label: "Live Bounties",
    icon: Bug,
    badge: "5",
    href: "/",
  },
  {
    id: "reputation",
    label: "My Reputation",
    icon: TrendingUp,
    badge: "850",
    href: "/profile",
  },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border/50">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
          <Terminal className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold tracking-tight text-foreground truncate">
              Code_Assist
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              v0.1.0
            </span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id)
                router.push(item.href)
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  <span
                    className={cn(
                      "ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {item.badge}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* Collapse Button */}
      <div className="px-3 pb-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* System Status */}
      <div className="px-4 py-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
          {!collapsed && (
            <span className="text-[11px] text-muted-foreground font-mono truncate">
              System: Online
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}
