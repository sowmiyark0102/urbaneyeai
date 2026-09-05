import React, { useEffect, useState } from "react"
import { Download, Send } from "lucide-react"
import { api } from "../api"
import { Card, PageHeader, LoadingState, SeverityBadge, Button, formatDateTime } from "../components/ui"
import type { Report } from "../types"

export default function Reports() {
  const [reports, setReports] = useState<Report[] | null>(null)
  const [toast, setToast] = useState("")

  function load() { api.reports().then(setReports) }
  useEffect(load, [])

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2200) }

  async function send(id: number) {
    await api.sendReport(id)
    flash("Report sent to zone officer.")
    load()
  }

  if (!reports) return <LoadingState label="Loading reports..." />

  return (
    <div>
      <PageHeader title="Incident & Maintenance Reports" subtitle="Auto-generated PDF reports for HIGH and CRITICAL detections" />
      {toast && <div className="mb-4 text-sm text-accent-dark bg-accent-light px-3 py-2 rounded-lg">{toast}</div>}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-500 border-b border-surface-line">
              <th className="px-4 py-3 font-medium">Report</th>
              <th className="px-4 py-3 font-medium">Detection</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Generated</th>
              <th className="px-4 py-3 font-medium">Routed To</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-surface-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink-900">{r.report_code}</td>
                <td className="px-4 py-3 text-ink-700">{r.detection_type}</td>
                <td className="px-4 py-3"><SeverityBadge severity={r.severity} /></td>
                <td className="px-4 py-3 text-ink-300 text-xs">{formatDateTime(r.generated_at)}</td>
                <td className="px-4 py-3 text-ink-500">{r.zone}{r.officer_name ? ` — ${r.officer_name}` : ""}</td>
                <td className="px-4 py-3">
                  {r.sent ? <span className="text-xs text-success font-semibold">REPORT GENERATED ✓ ROUTED</span> : <span className="text-xs text-warning font-semibold">PENDING SEND</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <a href={api.downloadReportUrl(r.id)} target="_blank" rel="noreferrer">
                      <Button variant="secondary"><Download className="w-3.5 h-3.5" /> DOWNLOAD PDF</Button>
                    </a>
                    {!r.sent && <Button onClick={() => send(r.id)}><Send className="w-3.5 h-3.5" /> SEND</Button>}
                  </div>
                </td>
              </tr>
            ))}
            {reports.length === 0 && <tr><td colSpan={7} className="text-center text-sm text-ink-500 py-8">No reports generated yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
