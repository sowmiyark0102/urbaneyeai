import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api"
import { Card, PageHeader, LoadingState, SeverityBadge } from "../components/ui"
import type { RoadSegment } from "../types"

export default function RoadIntelligence() {
  const navigate = useNavigate()
  const [roads, setRoads] = useState<RoadSegment[] | null>(null)

  useEffect(() => { api.roads().then(setRoads) }, [])

  if (!roads) return <LoadingState label="Loading road intelligence..." />

  return (
    <div>
      <PageHeader title="Road Intelligence" subtitle="Every road issue the fleet has detected, ranked by recency" />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-500 border-b border-surface-line">
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Issue</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">First Detected</th>
              <th className="px-4 py-3 font-medium">Last Detected</th>
              <th className="px-4 py-3 font-medium">Frequency</th>
              <th className="px-4 py-3 font-medium">Route</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {roads.map((r) => (
              <tr key={r.id} onClick={() => navigate(`/road-intelligence/${r.id}`)} className="border-b border-surface-line last:border-0 hover:bg-surface cursor-pointer">
                <td className="px-4 py-3 font-medium text-ink-900">{r.name}</td>
                <td className="px-4 py-3 text-ink-700">{r.primary_issue}</td>
                <td className="px-4 py-3"><SeverityBadge severity={r.severity} /></td>
                <td className="px-4 py-3 text-ink-500 text-xs">{new Date(r.first_detected).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-ink-500 text-xs">{new Date(r.last_detected).toLocaleDateString()}</td>
                <td className="px-4 py-3 tabular text-ink-500">{r.frequency} detections</td>
                <td className="px-4 py-3 text-ink-500">{r.route_code}</td>
                <td className="px-4 py-3 text-ink-500">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
