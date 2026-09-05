import React, { useEffect, useState } from "react"
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts"
import { api } from "../api"
import { Card, PageHeader, LoadingState } from "../components/ui"

export default function TrafficAnalytics() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.trafficAnalytics().then(setData)
  }, [])

  if (!data) return <LoadingState label="Loading traffic analytics..." />

  const avgSpeed = data.hourly.length ? (data.hourly.reduce((s: number, h: any) => s + h.avg_speed, 0) / data.hourly.length).toFixed(1) : "-"
  const peak = data.hourly.length ? [...data.hourly].sort((a: any, b: any) => b.vehicles - a.vehicles)[0] : null

  return (
    <div>
      <PageHeader title="Traffic Analytics" subtitle="Fleet-observed vehicle counts, speed, and congestion across Chennai routes" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4"><div className="text-xs text-ink-500">Average speed</div><div className="text-2xl font-semibold tabular">{avgSpeed} km/h</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">Peak traffic hour</div><div className="text-2xl font-semibold tabular">{peak ? `${peak.hour}:00` : "-"}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">Routes tracked</div><div className="text-2xl font-semibold tabular">{data.density_by_route.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-ink-500">High congestion routes</div><div className="text-2xl font-semibold tabular">{data.density_by_route.filter((r: any) => r.congestion === "HIGH").length}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">Vehicles per Hour</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EA" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="vehicles" fill="#0B5FA8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">Average Speed Trend</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EA" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="avg_speed" stroke="#0B5FA8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <div className="text-sm font-semibold text-ink-900 mb-3">Traffic Density by Route</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-500 border-b border-surface-line">
                <th className="py-2">Route</th><th className="py-2">Avg. Speed</th><th className="py-2">Congestion</th>
              </tr>
            </thead>
            <tbody>
              {data.density_by_route.map((r: any) => (
                <tr key={r.route} className="border-b border-surface-line last:border-0">
                  <td className="py-2 font-medium">{r.route}</td>
                  <td className="py-2 tabular">{r.avg_speed} km/h</td>
                  <td className="py-2">
                    <span className={`text-xs font-semibold ${r.congestion === "HIGH" ? "text-critical" : r.congestion === "MODERATE" ? "text-warning" : "text-success"}`}>{r.congestion}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
