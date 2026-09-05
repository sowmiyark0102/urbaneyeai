import React from "react"
import { Loader2, Inbox, AlertTriangle } from "lucide-react"

export function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    CRITICAL: "bg-critical-light text-critical",
    HIGH: "bg-warning-light text-warning",
    MEDIUM: "bg-accent-light text-accent-dark",
    LOW: "bg-success-light text-success",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${styles[severity] || styles.MEDIUM}`}>
      {severity}
    </span>
  )
}

export function StatusPill({ status }: { status: string }) {
  const s = status.toUpperCase()
  const map: Record<string, string> = {
    ONLINE: "bg-success-light text-success",
    ALERT: "bg-critical-light text-critical",
    OFFLINE: "bg-ink-300/20 text-ink-500",
    NEW: "bg-critical-light text-critical",
    ACKNOWLEDGED: "bg-warning-light text-warning",
    IN_PROGRESS: "bg-accent-light text-accent-dark",
    RESOLVED: "bg-success-light text-success",
    OPEN: "bg-warning-light text-warning",
    ASSIGNED: "bg-accent-light text-accent-dark",
    VERIFICATION_REQUIRED: "bg-critical-light text-critical",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[s] || "bg-ink-300/20 text-ink-500"}`}>
      {s.replace(/_/g, " ")}
    </span>
  )
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-surface-card border border-surface-line rounded-xl shadow-card ${className}`}>{children}</div>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="text-sm text-ink-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-ink-500 py-16">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({ label = "Nothing here yet" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-ink-500 py-16">
      <Inbox className="w-8 h-8 text-ink-300" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-critical bg-critical-light rounded-lg px-4 py-3 text-sm">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function Button({
  children, onClick, variant = "primary", disabled, className = "", type = "button",
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "danger" | "ghost"
  disabled?: boolean
  className?: string
  type?: "button" | "submit"
}) {
  const variants: Record<string, string> = {
    primary: "bg-accent text-white hover:bg-accent-dark",
    secondary: "bg-white border border-surface-line text-ink-700 hover:bg-surface",
    danger: "bg-critical text-white hover:bg-critical/90",
    ghost: "text-ink-500 hover:bg-surface",
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`
  return `${Math.floor(hours / 24)} day(s) ago`
}
