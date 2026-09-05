import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bus, Radio, AlertTriangle, ShieldAlert, Construction, FileText } from "lucide-react"
import { api } from "../api"
import { Card, PageHeader, LoadingState, ErrorState, SeverityBadge } from "../components/ui"
import { timeAgo } from "../components/ui"
import MapView, { MARKER_COLORS } from "../components/MapView"

const CARD_DEFS = [
  { key: "active_buses", label: "Active Buses", icon: Bus },
  { key: "ai_monitoring", label: "AI Monitoring", icon: Radio },
  { key: "active_alerts", label: "Active Alerts", icon: AlertTriangle },
  { key: "critical_alerts", label: "Critical Alerts", icon: ShieldAlert },
  { key: "road_issues_detected", label: "Road Issues Detected", icon: Construction },
  { key: "reports_generated", label: "Reports Generated", icon: FileText },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(e.message))
    const iv = setInterval(() => api.dashboard().then(setData).catch(() => {}), 20000)
    return () => clearInterval(iv)
  }, [])

  if (error) return <ErrorState message={error} />
  if (!data) return <LoadingState label="Loading city overview..." />

  return (
    <div>
      <PageHeader title="URBAN-EYE AI" subtitle={`System Status: ${data.system_status} · Fleet connectivity ${data.fleet_connectivity}% · Camera health ${data.camera_health}%`} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {CARD_DEFS.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="p-4">
            <Icon className="w-4 h-4 text-accent mb-2" />
            <div className="text-2xl font-semibold tabular text-ink-900">{data.cards[key]}</div>
            <div className="text-xs text-ink-500 mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">City Overview — GIS Map</div>
          <MapView
            markers={data.map_markers.map((mk: any, i: number) => ({
              id: i,
              lat: mk.lat, lng: mk.lng,
              color: mk.type === "bus" ? MARKER_COLORS.bus : MARKER_COLORS[mk.severity] || MARKER_COLORS.info,
              label: mk.type === "bus" ? mk.label : mk.label,
              popup: mk.type === "bus" ? (
                <div>Status: {mk.status}</div>
              ) : (
                <div className="space-y-0.5">
                  <div>Bus: {mk.bus_id}</div>
                  <div>Route: {mk.route_code}</div>
                  <button className="text-accent underline text-xs mt-1" onClick={() => navigate(`/alerts/${mk.alert_id}`)}>View Details</button>
                </div>
              ),
            }))}
          />
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">Recent Alerts</div>
          <div className="space-y-1 max-h-[420px] overflow-y-auto">
            {data.recent_alerts.map((a: any) => (
              <button
                key={a.id}
                onClick={() => navigate(`/alerts/${a.id}`)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-surface border border-transparent hover:border-surface-line transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-ink-900">{a.detection_type}</span>
                  <SeverityBadge severity={a.severity} />
                </div>
                <div className="text-xs text-ink-500">{a.bus_id} · Route {a.route_code} · {a.location_name}</div>
                <div className="text-xs text-ink-300 mt-0.5">{timeAgo(a.created_at)}</div>
              </button>
            ))}
            {data.recent_alerts.length === 0 && <div className="text-sm text-ink-500 py-6 text-center">No alerts yet.</div>}
          </div>
        </Card>
      </div>
    </div>
  )
}
