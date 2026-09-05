import React, { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { api } from "../api"
import { Card, PageHeader, LoadingState } from "../components/ui"

const SEV_COLORS: Record<string, string> = { CRITICAL: "#C0392B", HIGH: "#C9791C", MEDIUM: "#0B5FA8", LOW: "#1E8449" }
const METRIC_LABELS: Record<string, string> = {
  total_buses: "Total Buses Monitored", total_road_issues: "Total Road Issues",
  total_traffic_observations: "Traffic Observations", total_alerts: "Total Alerts",
  critical_incidents: "Critical Incidents", reports_generated: "Reports Generated",
  issues_resolved: "Issues Resolved", repairs_verified: "Repairs Verified",
}

export default function Analytics() {
  const [data, setData] = useState<any>(null)

  useEffect(() => { api.analytics().then(setData) }, [])

  if (!data) return <LoadingState label="Loading analytics..." />

  const sevPie = Object.entries(data.severity_distribution).map(([k, v]) => ({ name: k, value: v as number }))
  const issuePie = Object.entries(data.issue_distribution).map(([k, v]) => ({ name: k, value: v as number }))

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Overall URBAN-EYE AI system performance" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(data.totals).map(([key, val]) => (
          <Card key={key} className="p-4">
            <div className="text-xs text-ink-500">{METRIC_LABELS[key] || key}</div>
            <div className="text-2xl font-semibold tabular text-ink-900">{val as number}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">Alert Severity Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={sevPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {sevPie.map((e) => <Cell key={e.name} fill={SEV_COLORS[e.name]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">Road Issue Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={issuePie} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EA" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
              <Tooltip />
              <Bar dataKey="value" fill="#0B5FA8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-4">
        <div className="text-sm font-semibold text-ink-900 mb-3">Top Problem Locations</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.top_problem_locations}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EA" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="frequency" fill="#C9791C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
