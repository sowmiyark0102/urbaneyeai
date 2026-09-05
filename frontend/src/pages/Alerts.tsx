import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api"
import { Card, PageHeader, LoadingState, SeverityBadge, StatusPill, timeAgo } from "../components/ui"
import type { Alert } from "../types"

export default function Alerts() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<Alert[] | null>(null)
  const [severity, setSeverity] = useState("")
  const [status, setStatus] = useState("")

  useEffect(() => {
    api.alerts({ severity, status }).then(setAlerts)
  }, [severity, status])

  if (!alerts) return <LoadingState label="Loading alerts..." />

  return (
    <div>
      <PageHeader title="Alert Center" subtitle={`${alerts.length} alerts matching current filters`} />

      <div className="flex gap-3 mb-4">
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-surface-line bg-white">
          <option value="">All severities</option>
          <option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-surface-line bg-white">
          <option value="">All statuses</option>
          <option value="NEW">New</option><option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option>
        </select>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-500 border-b border-surface-line">
              <th className="px-4 py-3 font-medium">Alert</th>
              <th className="px-4 py-3 font-medium">Issue</th>
              <th className="px-4 py-3 font-medium">Bus</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} onClick={() => navigate(`/alerts/${a.id}`)} className="border-b border-surface-line last:border-0 hover:bg-surface cursor-pointer">
                <td className="px-4 py-3 font-medium text-ink-900">{a.alert_code}</td>
                <td className="px-4 py-3 text-ink-700">{a.detection_type}</td>
                <td className="px-4 py-3 text-ink-500">{a.bus_id} · {a.route_code}</td>
                <td className="px-4 py-3 text-ink-500">{a.location_name}</td>
                <td className="px-4 py-3 text-ink-300 text-xs">{timeAgo(a.created_at)}</td>
                <td className="px-4 py-3"><SeverityBadge severity={a.severity} /></td>
                <td className="px-4 py-3"><StatusPill status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {alerts.length === 0 && <div className="text-center text-sm text-ink-500 py-8">No alerts match your filters.</div>}
      </Card>
    </div>
  )
}
