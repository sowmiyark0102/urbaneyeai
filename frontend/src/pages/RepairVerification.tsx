import React, { useEffect, useState } from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import { api } from "../api"
import { Card, PageHeader, LoadingState, Button, formatDateTime } from "../components/ui"

export default function RepairVerification() {
  const [verifications, setVerifications] = useState<any[] | null>(null)
  const [resolvedTasks, setResolvedTasks] = useState<any[]>([])
  const [toast, setToast] = useState("")

  function load() {
    api.repairVerifications().then(setVerifications)
    api.maintenance().then((tasks) => setResolvedTasks(tasks.filter((t: any) => t.status === "RESOLVED")))
  }
  useEffect(load, [])

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2500) }

  async function runVerification(taskId: number) {
    const res = await api.verifyRepair(taskId)
    flash(res.result === "PASSED" ? "REPAIR VERIFIED ✓" : "REPAIR VERIFICATION FAILED — ticket reopened.")
    load()
  }

  if (!verifications) return <LoadingState label="Loading repair verification records..." />

  return (
    <div>
      <PageHeader title="Repair Verification" subtitle="The next bus passing a resolved location performs another AI check" />
      {toast && <div className="mb-4 text-sm text-accent-dark bg-accent-light px-3 py-2 rounded-lg">{toast}</div>}

      {resolvedTasks.length > 0 && (
        <Card className="p-4 mb-6">
          <div className="text-sm font-semibold text-ink-900 mb-3">Resolved — Awaiting Next-Pass Verification</div>
          <div className="space-y-2">
            {resolvedTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-surface-line">
                <div>
                  <span className="font-medium text-ink-900">{t.issue}</span>
                  <span className="text-ink-500 text-sm ml-2">· {t.location_name}</span>
                </div>
                <Button variant="secondary" onClick={() => runVerification(t.id)}>RUN VERIFICATION</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {verifications.map((v) => (
          <Card key={v.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-ink-900">{v.issue} — {v.location_name}</span>
              {v.result === "PASSED" ? (
                <span className="flex items-center gap-1 text-xs text-success font-semibold"><CheckCircle2 className="w-4 h-4" /> REPAIR VERIFIED</span>
              ) : v.result === "FAILED" ? (
                <span className="flex items-center gap-1 text-xs text-critical font-semibold"><XCircle className="w-4 h-4" /> VERIFICATION FAILED</span>
              ) : (
                <span className="text-xs text-ink-500 font-semibold">PENDING</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2.5 rounded-lg bg-surface">
                <div className="text-xs text-ink-500 mb-1">BEFORE</div>
                <div className="text-ink-900">{v.before_state}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-surface">
                <div className="text-xs text-ink-500 mb-1">AFTER</div>
                <div className="text-ink-900">{v.after_state}</div>
              </div>
            </div>
            <div className="text-xs text-ink-300 mt-2">Verified by {v.verifying_bus_id} · {formatDateTime(v.verified_at)}</div>
          </Card>
        ))}
        {verifications.length === 0 && <div className="text-sm text-ink-500 py-12 text-center col-span-2">No repair verifications recorded yet.</div>}
      </div>
    </div>
  )
}
