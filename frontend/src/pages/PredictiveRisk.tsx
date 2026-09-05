import React, { useEffect, useState } from "react"
import { api } from "../api"
import { Card, PageHeader, LoadingState } from "../components/ui"

export default function PredictiveRisk() {
  const [risk, setRisk] = useState<any[] | null>(null)
  const [hazards, setHazards] = useState<any[]>([])
  const [rain, setRain] = useState<any[]>([])

  useEffect(() => {
    api.predictiveRisk().then(setRisk)
    api.hazardZones().then(setHazards)
    api.rainZones().then(setRain)
  }, [])

  if (!risk) return <LoadingState label="Computing predictive risk scores..." />

  return (
    <div>
      <PageHeader title="Predictive Risk" subtitle="Explainable risk scoring from repeated historical observations — not a black-box ML claim" />

      <Card className="p-4 mb-6">
        <div className="text-sm font-semibold text-ink-900 mb-3">High Risk Locations</div>
        <div className="space-y-2">
          {risk.slice(0, 8).map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-3 py-2.5 rounded-lg border border-surface-line">
              <span className="font-medium text-ink-900 flex-1">{r.name}</span>
              <div className="w-40 h-2 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-critical rounded-full" style={{ width: `${r.risk_score}%` }} />
              </div>
              <span className="tabular font-semibold text-critical w-14 text-right">{r.risk_score}%</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-300 mt-4">Risk score is based on repeated historical observations: detection frequency, current severity, and recent deterioration trend.</p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-1">Invisible Danger Zones</div>
          <p className="text-xs text-ink-500 mb-3">Inferred from repeated abnormal bus telemetry — no visible defect required.</p>
          <div className="space-y-2">
            {hazards.map((h) => (
              <div key={h.id} className="px-3 py-2.5 rounded-lg border border-surface-line text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-ink-900">{h.location_name}</span>
                  <span className={`text-xs font-semibold ${h.risk_level === "CRITICAL" || h.risk_level === "HIGH" ? "text-critical" : "text-warning"}`}>{h.risk_level}</span>
                </div>
                <div className="text-xs text-ink-500">Observed by {h.observed_by_bus_count} buses · Speed reduction {h.avg_speed_reduction_pct}% · {h.sudden_braking_events} sudden braking events</div>
                <div className="text-xs text-ink-300 mt-0.5">Status: {h.status}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-1">Rain / Waterlogging Memory</div>
          <p className="text-xs text-ink-500 mb-3">Weather-condition-linked event history by location.</p>
          <div className="space-y-2">
            {rain.map((r) => (
              <div key={r.id} className="px-3 py-2.5 rounded-lg border border-surface-line text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-ink-900">{r.location_name}</span>
                  <span className={`text-xs font-semibold ${r.risk_level === "HIGH" ? "text-critical" : "text-warning"}`}>{r.risk_level}</span>
                </div>
                <div className="text-xs text-ink-500">{r.waterlogging_events} of {r.rain_events} rain events caused waterlogging</div>
                <div className="text-xs text-ink-300 mt-0.5">{r.prediction}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
