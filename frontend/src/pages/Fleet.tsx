import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import { api } from "../api"
import { Card, PageHeader, LoadingState, StatusPill } from "../components/ui"
import type { Bus } from "../types"

export default function Fleet() {
  const navigate = useNavigate()
  const [buses, setBuses] = useState<Bus[] | null>(null)
  const [search, setSearch] = useState("")
  const [routeFilter, setRouteFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sortKey, setSortKey] = useState<"bus_id" | "speed_kmh">("bus_id")

  useEffect(() => {
    api.buses().then(setBuses)
  }, [])

  const routes = useMemo(() => Array.from(new Set((buses || []).map((b) => b.route_code).filter(Boolean))), [buses])

  const filtered = useMemo(() => {
    if (!buses) return []
    let list = buses.filter((b) => b.bus_id.toLowerCase().includes(search.toLowerCase()))
    if (routeFilter) list = list.filter((b) => b.route_code === routeFilter)
    if (statusFilter) list = list.filter((b) => b.status === statusFilter)
    list = [...list].sort((a, b) => sortKey === "bus_id" ? a.bus_id.localeCompare(b.bus_id) : b.speed_kmh - a.speed_kmh)
    return list
  }, [buses, search, routeFilter, statusFilter, sortKey])

  if (!buses) return <LoadingState label="Loading fleet..." />

  return (
    <div>
      <PageHeader title="Fleet Monitoring" subtitle={`${buses.length} buses in the URBAN-EYE AI network`} />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bus ID..."
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-surface-line bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <select value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-surface-line bg-white">
          <option value="">All routes</option>
          {routes.map((r) => <option key={r} value={r!}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-surface-line bg-white">
          <option value="">All statuses</option>
          <option value="ONLINE">Online</option>
          <option value="ALERT">Alert</option>
          <option value="OFFLINE">Offline</option>
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)} className="px-3 py-2 text-sm rounded-lg border border-surface-line bg-white">
          <option value="bus_id">Sort: Bus ID</option>
          <option value="speed_kmh">Sort: Speed</option>
        </select>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-500 border-b border-surface-line">
              <th className="px-4 py-3 font-medium">Bus ID</th>
              <th className="px-4 py-3 font-medium">Route</th>
              <th className="px-4 py-3 font-medium">Driver</th>
              <th className="px-4 py-3 font-medium">GPS</th>
              <th className="px-4 py-3 font-medium">Camera</th>
              <th className="px-4 py-3 font-medium">AI Engine</th>
              <th className="px-4 py-3 font-medium">Speed</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} onClick={() => navigate(`/fleet/${b.bus_id}`)} className="border-b border-surface-line last:border-0 hover:bg-surface cursor-pointer">
                <td className="px-4 py-3 font-medium text-ink-900">{b.bus_id}</td>
                <td className="px-4 py-3 text-ink-500">{b.route_code}</td>
                <td className="px-4 py-3 text-ink-500">{b.driver_status}</td>
                <td className="px-4 py-3 text-ink-500">{b.gps_status}</td>
                <td className="px-4 py-3 text-ink-500">{b.camera_status}</td>
                <td className="px-4 py-3 text-ink-500">{b.ai_status}</td>
                <td className="px-4 py-3 tabular text-ink-500">{b.speed_kmh} km/h</td>
                <td className="px-4 py-3"><StatusPill status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center text-sm text-ink-500 py-8">No buses match your filters.</div>}
      </Card>
    </div>
  )
}
