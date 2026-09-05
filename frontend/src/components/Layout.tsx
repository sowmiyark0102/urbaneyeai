import React, { useEffect, useRef, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Bus, Radio, AlertTriangle, Map, BarChart3, Construction,
  ShieldAlert, ClipboardList, LineChart, Settings as SettingsIcon, Search, Bell,
  CircleUser, LogOut, Wifi,
} from "lucide-react"
import { api } from "../api"
import type { Notification } from "../types"
import { timeAgo } from "./ui"

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/fleet", label: "Fleet Monitoring", icon: Bus },
  { to: "/live", label: "Live AI", icon: Radio },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/gis-map", label: "GIS Map", icon: Map },
  { to: "/road-intelligence", label: "Road Intelligence", icon: ShieldAlert },
  { to: "/traffic-analytics", label: "Traffic Analytics", icon: BarChart3 },
  { to: "/predictive-risk", label: "Predictive Risk", icon: LineChart },
  { to: "/maintenance", label: "Maintenance", icon: Construction },
  { to: "/reports", label: "Reports", icon: ClipboardList },
  { to: "/action-tracking", label: "Action Tracking", icon: ClipboardList },
  { to: "/repair-verification", label: "Repair Verification", icon: ShieldAlert },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<any>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [profileOpen, setProfileOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.notifications().then(setNotifs).catch(() => {})
    const interval = setInterval(() => api.notifications().then(setNotifs).catch(() => {}), 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  async function runSearch(q: string) {
    setQuery(q)
    if (q.length < 2) { setSearchResults(null); return }
    const res = await api.search(q).catch(() => null)
    setSearchResults(res)
    setSearchOpen(true)
  }

  const username = localStorage.getItem("uea_username") || "admin"
  const fullName = localStorage.getItem("uea_fullname") || "Control Room Operator"
  const unread = notifs.filter((n) => !n.read).length

  function logout() {
    localStorage.removeItem("uea_token")
    navigate("/login")
  }

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="w-60 flex-shrink-0 bg-ink-900 text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-[15px] font-semibold tracking-tight">URBAN-EYE AI</div>
          <div className="text-[11px] text-white/50 mt-0.5">Urban Intelligence Platform</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                  isActive ? "bg-accent text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 flex items-center gap-2 text-[12px] text-white/70">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          System Online
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex-shrink-0 bg-surface-card border-b border-surface-line flex items-center justify-between px-5 gap-4">
          <div className="relative flex-1 max-w-md" ref={searchRef}>
            <Search className="w-4 h-4 text-ink-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => runSearch(e.target.value)}
              onFocus={() => query.length >= 2 && setSearchOpen(true)}
              placeholder="Search bus, route, alert, location..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-surface-line bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            {searchOpen && searchResults && (
              <div className="absolute top-full mt-1 w-full bg-white border border-surface-line rounded-lg shadow-card max-h-80 overflow-y-auto z-30">
                {searchResults.buses?.map((b: any) => (
                  <div key={`b${b.id}`} className="px-3 py-2 text-sm hover:bg-surface cursor-pointer"
                    onClick={() => { navigate(`/fleet/${b.bus_id}`); setSearchOpen(false) }}>
                    <span className="text-ink-300 mr-1">Bus</span>{b.bus_id} — {b.route_name}
                  </div>
                ))}
                {searchResults.alerts?.map((a: any) => (
                  <div key={`a${a.id}`} className="px-3 py-2 text-sm hover:bg-surface cursor-pointer"
                    onClick={() => { navigate(`/alerts/${a.id}`); setSearchOpen(false) }}>
                    <span className="text-ink-300 mr-1">Alert</span>{a.alert_code} — {a.detection_type}
                  </div>
                ))}
                {searchResults.roads?.map((r: any) => (
                  <div key={`r${r.id}`} className="px-3 py-2 text-sm hover:bg-surface cursor-pointer"
                    onClick={() => { navigate(`/road-intelligence`); setSearchOpen(false) }}>
                    <span className="text-ink-300 mr-1">Road</span>{r.name}
                  </div>
                ))}
                {!searchResults.buses?.length && !searchResults.alerts?.length && !searchResults.roads?.length && (
                  <div className="px-3 py-3 text-sm text-ink-500">No matches found.</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-success bg-success-light px-2.5 py-1.5 rounded-lg">
              <Wifi className="w-3.5 h-3.5" /> System Online
            </div>

            <div className="relative">
              <button onClick={() => setNotifOpen((v) => !v)} className="relative p-2 rounded-lg hover:bg-surface">
                <Bell className="w-4.5 h-4.5 text-ink-500" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-critical text-white text-[9px] rounded-full flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-surface-line rounded-lg shadow-card z-30 max-h-96 overflow-y-auto">
                  <div className="px-3 py-2 text-xs font-semibold text-ink-500 border-b border-surface-line">NOTIFICATIONS</div>
                  {notifs.length === 0 && <div className="px-3 py-4 text-sm text-ink-500">No notifications.</div>}
                  {notifs.map((n) => (
                    <div key={n.id} className="px-3 py-2.5 border-b border-surface-line last:border-0 text-sm flex gap-2">
                      <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        n.level === "CRITICAL" ? "bg-critical" : n.level === "WARNING" ? "bg-warning" : n.level === "RESOLVED" ? "bg-success" : "bg-accent"
                      }`} />
                      <div>
                        <div className="text-ink-900">{n.message}</div>
                        <div className="text-xs text-ink-300 mt-0.5">{timeAgo(n.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface">
                <CircleUser className="w-6 h-6 text-ink-500" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-surface-line rounded-lg shadow-card z-30">
                  <div className="px-3 py-2.5 border-b border-surface-line">
                    <div className="text-sm font-medium text-ink-900">{fullName}</div>
                    <div className="text-xs text-ink-500">@{username}</div>
                  </div>
                  <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-critical hover:bg-critical-light">
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
