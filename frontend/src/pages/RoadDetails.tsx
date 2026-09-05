import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { api } from "../api"
import { Card, PageHeader, LoadingState, SeverityBadge } from "../components/ui"
import MapView, { MARKER_COLORS } from "../components/MapView"

const TREND_COLOR: Record<string, string> = { WORSENING: "text-critical", STABLE: "text-warning", IMPROVING: "text-success" }

export default function RoadDetails() {
  const { roadId } = useParams()
  const [road, setRoad] = useState<any>(null)

  useEffect(() => { if (roadId) api.road(Number(roadId)).then(setRoad) }, [roadId])

  if (!road) return <LoadingState label="Loading road segment memory..." />

  const healthTrend = road.trip_history.map((t: any, i: number) => ({
    trip: `Trip ${t.trip}`,
    health: Math.max(10, road.road_health_score + (road.trend === "WORSENING" ? (road.trip_history.length - i) * 6 : -(road.trip_history.length - i) * 3)),
  }))

  return (
    <div>
      <PageHeader
        title={road.name}
        subtitle="Road Memory — the system remembers this segment across every bus trip that passes it"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><div className="text-xs text-ink-500">Road Health Score</div><div className="text-2xl font-semibold tabular">{road.road_health_score}/100</div><div className="text-xs text-ink-300 mt-1">AI-derived prototype score</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">Detection Frequency</div><div className="text-2xl font-semibold tabular">{road.frequency}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">Severity Trend</div><div className={`text-2xl font-semibold ${TREND_COLOR[road.trend]}`}>{road.trend}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">Observed by</div><div className="text-2xl font-semibold tabular">{road.observed_by_buses.length} buses</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">Road Condition Trend</div>
          <div className={`text-sm font-semibold mb-3 ${TREND_COLOR[road.trend]}`}>ROAD CONDITION: {road.trend}</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={healthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EA" />
              <XAxis dataKey="trip" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="health" stroke="#0B5FA8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">Location</div>
          <MapView markers={[{ id: "r", lat: road.lat, lng: road.lng, color: MARKER_COLORS.warning, label: road.name }]} zoom={14} center={[road.lat, road.lng]} height={220} />
        </Card>
      </div>

      <Card className="p-4">
        <div className="text-sm font-semibold text-ink-900 mb-3">Trip-by-Trip Memory</div>
        <div className="space-y-2">
          {road.trip_history.map((t: any) => (
            <div key={t.trip} className="flex items-center gap-4 text-sm px-3 py-2.5 rounded-lg border border-surface-line">
              <span className="font-semibold text-ink-500 w-16">Trip {t.trip}</span>
              <span className="text-ink-300 text-xs w-24">{new Date(t.date).toLocaleDateString()}</span>
              <span className="text-ink-900">{t.observation}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
