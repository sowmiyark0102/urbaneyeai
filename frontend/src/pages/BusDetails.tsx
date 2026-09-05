import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Radio } from "lucide-react"
import { api } from "../api"
import { Card, PageHeader, LoadingState, SeverityBadge, Button, formatDateTime } from "../components/ui"
import MapView, { MARKER_COLORS } from "../components/MapView"

export default function BusDetails() {
  const { busId } = useParams()
  const navigate = useNavigate()
  const [bus, setBus] = useState<any>(null)

  useEffect(() => {
    if (busId) api.bus(busId).then(setBus)
  }, [busId])

  if (!bus) return <LoadingState label="Loading bus details..." />

  return (
    <div>
      <PageHeader
        title={bus.bus_id}
        subtitle={`Route ${bus.route_code} — ${bus.route_name}`}
        actions={<Button onClick={() => navigate(`/live/${bus.bus_id}`)}><Radio className="w-4 h-4" /> VIEW LIVE AI MONITORING</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          ["Current speed", `${bus.speed_kmh} km/h`],
          ["Driver status", bus.driver_status],
          ["Camera status", bus.camera_status],
          ["AI status", bus.ai_status],
          ["GPS", bus.gps_status],
          ["Last sync", formatDateTime(bus.last_sync)],
          ["Today's detections", bus.today_detections],
          ["Status", bus.status],
        ].map(([label, val]) => (
          <Card key={label as string} className="p-4">
            <div className="text-xs text-ink-500 mb-1">{label}</div>
            <div className="text-sm font-semibold text-ink-900">{val}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">Current Location</div>
          <MapView
            markers={[{ id: bus.bus_id, lat: bus.lat, lng: bus.lng, color: MARKER_COLORS.bus, label: bus.bus_id }]}
            zoom={14} center={[bus.lat, bus.lng]} height={340}
          />
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">Recent Detections</div>
          <div className="space-y-1 max-h-[340px] overflow-y-auto">
            {bus.recent_detections.map((d: any) => (
              <div key={d.id} className="px-3 py-2.5 rounded-lg border border-surface-line">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-ink-900">{d.label}</span>
                  <SeverityBadge severity={d.severity} />
                </div>
                <div className="text-xs text-ink-500">{d.location_name} · Confidence {(d.confidence * 100).toFixed(0)}%</div>
                <div className="text-xs text-ink-300 mt-0.5">{formatDateTime(d.timestamp)}</div>
              </div>
            ))}
            {bus.recent_detections.length === 0 && <div className="text-sm text-ink-500 py-6 text-center">No detections recorded yet today.</div>}
          </div>
        </Card>
      </div>
    </div>
  )
}
