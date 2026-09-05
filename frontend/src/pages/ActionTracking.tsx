import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, Circle } from "lucide-react"
import { api } from "../api"
import { Card, PageHeader, LoadingState, SeverityBadge, formatDateTime } from "../components/ui"
import type { MaintenanceTask } from "../types"

const FULL_FLOW = ["DETECTED", "REPORT_GENERATED", "REPORT_SENT", "OFFICER_ACKNOWLEDGED", "INSPECTION", "MAINTENANCE", "RESOLVED"]

export default function ActionTracking() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<MaintenanceTask[] | null>(null)

  useEffect(() => { api.maintenance().then(setTasks) }, [])

  if (!tasks) return <LoadingState label="Loading action tracking..." />

  return (
    <div>
      <PageHeader title="Officer Action Tracking" subtitle="DETECTED → REPORT → SENT → ACKNOWLEDGED → INSPECTION → MAINTENANCE → RESOLVED" />
      <div className="space-y-4">
        {tasks.map((t) => {
          const doneStages = new Set(t.timeline.map((tl) => tl.stage))
          return (
            <Card key={t.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-medium text-ink-900">{t.issue}</span>
                  <span className="text-ink-500 text-sm ml-2">· {t.location_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={t.severity} />
                  {t.alert_id && <button className="text-xs text-accent underline" onClick={() => navigate(`/alerts/${t.alert_id}`)}>View alert</button>}
                </div>
              </div>
              <div className="flex items-center overflow-x-auto pb-1">
                {FULL_FLOW.map((stage, i) => {
                  const tl = t.timeline.find((x) => x.stage === stage)
                  const done = !!tl
                  return (
                    <React.Fragment key={stage}>
                      <div className="flex flex-col items-center min-w-[110px]">
                        {done ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-ink-300" />}
                        <div className={`text-xs mt-1 text-center ${done ? "text-ink-900 font-medium" : "text-ink-300"}`}>{stage.replace(/_/g, " ")}</div>
                        {tl && <div className="text-[10px] text-ink-300 tabular">{formatDateTime(tl.timestamp)}</div>}
                      </div>
                      {i < FULL_FLOW.length - 1 && <div className={`h-0.5 flex-1 min-w-[16px] ${done ? "bg-success" : "bg-surface-line"}`} />}
                    </React.Fragment>
                  )
                })}
              </div>
            </Card>
          )
        })}
        {tasks.length === 0 && <div className="text-center text-sm text-ink-500 py-12">No maintenance tasks tracked yet.</div>}
      </div>
    </div>
  )
}
