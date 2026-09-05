import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api"
import { Card, PageHeader, LoadingState } from "../components/ui"
import MapView, { MARKER_COLORS } from "../components/MapView"

const FILTERS = ["ALL", "ROAD", "TRAFFIC", "WATER", "SAFETY", "MAINTENANCE"]
const LAYERS = [
  { key: "buses", label: "Buses" },
  { key: "alerts", label: "Alerts / Road Damage" },
  { key: "hazards", label: "High-risk Zones (Invisible Hazards)" },
  { key: "rain", label: "Waterlogging Risk" },
  { key: "roads", label: "Maintenance Segments" },
]

export default function GISMap() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<any>(null)
  const [hazards, setHazards] = useState<any[]>([])
  const [rain, setRain] = useState<any[]>([])
  const [roads, setRoads] = useState<any[]>([])
  const [filter, setFilter] = useState("ALL")
  const [layers, setLayers] = useState<Record<string, boolean>>({
    buses: true, alerts: true, hazards: true, rain: true, roads: true,
  })

  useEffect(() => {
    api.dashboard().then(setDashboard)
    api.hazardZones().then(setHazards)
    api.rainZones().then(setRain)
    api.roads().then(setRoads)
  }, [])

  const markers = useMemo(() => {
    const list: any[] = []
    if (!dashboard) return list
    if (layers.buses) {
      for (const mk of dashboard.map_markers.filter((x: any) => x.type === "bus")) {
        list.push({ id: `bus-${mk.label}`, lat: mk.lat, lng: mk.lng, color: MARKER_COLORS.bus, label: mk.label, popup: <div>Bus — {mk.status}</div> })
      }
    }
    if (layers.alerts) {
      for (const mk of dashboard.map_markers.filter((x: any) => x.type === "alert")) {
        if (filter !== "ALL") {
          const isWater = mk.label === "Waterlogging"
          const isSafety = ["Pedestrian Crossing Risk", "School-Zone Pedestrian Risk", "Potential Rash-Driving Event", "Potential Hit-and-Run Event"].includes(mk.label)
          if (filter === "WATER" && !isWater) continue
          if (filter === "SAFETY" && !isSafety) continue
          if (filter === "ROAD" && (isWater || isSafety)) continue
        }
        list.push({
          id: `alert-${mk.alert_id}`, lat: mk.lat, lng: mk.lng, color: MARKER_COLORS[mk.severity] || MARKER_COLORS.info,
          label: mk.label,
          popup: <div><div>{mk.bus_id} · {mk.route_code}</div><button className="text-accent underline text-xs mt-1" onClick={() => navigate(`/alerts/${mk.alert_id}`)}>View Details</button></div>,
        })
      }
    }
    if (layers.hazards && (filter === "ALL" || filter === "SAFETY")) {
      for (const h of hazards) {
        list.push({ id: `hz-${h.id}`, lat: h.lat, lng: h.lng, color: "#8E44AD", label: h.location_name,
          popup: <div>Observed by {h.observed_by_bus_count} buses · {h.sudden_braking_events} braking events · Risk {h.risk_level}</div> })
      }
    }
    if (layers.rain && (filter === "ALL" || filter === "WATER")) {
      for (const r of rain) {
        list.push({ id: `rz-${r.id}`, lat: r.lat, lng: r.lng, color: "#1F8AC0", label: r.location_name,
          popup: <div>{r.prediction}</div> })
      }
    }
    if (layers.roads && (filter === "ALL" || filter === "MAINTENANCE")) {
      for (const r of roads) {
        list.push({ id: `road-${r.id}`, lat: r.lat, lng: r.lng, color: "#7690A3", label: r.name,
          popup: <div>{r.primary_issue} · Health {r.road_health_score}/100</div> })
      }
    }
    return list
  }, [dashboard, hazards, rain, roads, layers, filter])

  if (!dashboard) return <LoadingState label="Loading GIS intelligence map..." />

  return (
    <div>
      <PageHeader title="GIS Intelligence Map" subtitle="Full-fleet spatial view of buses, alerts, and risk zones" />

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${filter === f ? "bg-accent text-white border-accent" : "bg-white text-ink-500 border-surface-line"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-4 lg:order-2 lg:col-span-1">
          <div className="text-sm font-semibold text-ink-900 mb-3">Map Layers</div>
          <div className="space-y-2">
            {LAYERS.map((l) => (
              <label key={l.key} className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" checked={layers[l.key]} onChange={(e) => setLayers({ ...layers, [l.key]: e.target.checked })} />
                {l.label}
              </label>
            ))}
          </div>
        </Card>
        <div className="lg:order-1 lg:col-span-3">
          <MapView markers={markers} height={560} zoom={11} />
        </div>
      </div>
    </div>
  )
}
