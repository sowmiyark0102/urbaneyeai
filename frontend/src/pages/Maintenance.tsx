import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api"
import { Card, PageHeader, LoadingState, SeverityBadge, Button, formatDateTime } from "../components/ui"
import type { MaintenanceTask } from "../types"

const SECTIONS = [
  { key: "OPEN", label: "Open Issues" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "VERIFICATION_REQUIRED", label: "Verification Required" },
]

export default function Maintenance() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<MaintenanceTask[] | null>(null)
  const [officers, setOfficers] = useState<any[]>([])
  const [toast, setToast] = useState("")

  function load() {
    api.maintenance().then(setTasks)
  }
  useEffect(() => { load(); api.officers().then(setOfficers) }, [])

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2200) }

  async function assign(taskId: number) {
    const officer = officers[Math.floor(Math.random() * officers.length)]
    await api.updateMaintenance(taskId, { officer_id: officer.id })
    flash(`Assigned to ${officer.name}`)
    load()
  }
  async function advanceStatus(taskId: number, next: string) {
    await api.updateMaintenance(taskId, { status: next })
    flash(`Status updated to ${next.replace(/_/g, " ")}`)
    load()
  }

  if (!tasks) return <LoadingState label="Loading maintenance tasks..." />

  return (
    <div>
      <PageHeader title="Maintenance Management" subtitle="Every HIGH/CRITICAL issue tracked from detection to resolution" />
      {toast && <div className="mb-4 text-sm text-accent-dark bg-accent-light px-3 py-2 rounded-lg">{toast}</div>}

      {SECTIONS.map((sec) => {
        const items = tasks.filter((t) => t.status === sec.key)
        return (
          <div key={sec.key} className="mb-6">
            <div className="text-sm font-semibold text-ink-900 mb-2">{sec.label} <span className="text-ink-300 font-normal">({items.length})</span></div>
            <Card className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-500 border-b border-surface-line">
                    <th className="px-4 py-3 font-medium">Issue</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Severity</th>
                    <th className="px-4 py-3 font-medium">Officer</th>
                    <th className="px-4 py-3 font-medium">Detected</th>
                    <th className="px-4 py-3 font-medium">Due</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.id} className="border-b border-surface-line last:border-0">
                      <td className="px-4 py-3 font-medium text-ink-900">{t.issue}</td>
                      <td className="px-4 py-3 text-ink-500">{t.location_name}</td>
                      <td className="px-4 py-3"><SeverityBadge severity={t.severity} /></td>
                      <td className="px-4 py-3 text-ink-500">{t.officer_name}</td>
                      <td className="px-4 py-3 text-ink-300 text-xs">{formatDateTime(t.detected_date)}</td>
                      <td className="px-4 py-3 text-ink-300 text-xs">{formatDateTime(t.due_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {!t.officer_id && <Button variant="secondary" onClick={() => assign(t.id)}>ASSIGN</Button>}
                          {sec.key === "OPEN" && t.officer_id && <Button variant="secondary" onClick={() => advanceStatus(t.id, "IN_PROGRESS")}>START</Button>}
                          {sec.key === "ASSIGNED" && <Button variant="secondary" onClick={() => advanceStatus(t.id, "IN_PROGRESS")}>UPDATE STATUS</Button>}
                          {sec.key === "IN_PROGRESS" && <Button variant="secondary" onClick={() => advanceStatus(t.id, "RESOLVED")}>UPDATE STATUS</Button>}
                          {t.alert_id && <Button variant="ghost" onClick={() => navigate(`/alerts/${t.alert_id}`)}>VIEW REPORT</Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-sm text-ink-500 py-6">No tasks in this stage.</td></tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
