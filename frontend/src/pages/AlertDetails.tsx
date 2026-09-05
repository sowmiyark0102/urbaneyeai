import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { AlertTriangle, FileText, UserCheck, CheckCircle2, Map as MapIcon } from "lucide-react"
import { api } from "../api"
import { Card, PageHeader, LoadingState, SeverityBadge, Button, formatDateTime } from "../components/ui"
import MapView, { MARKER_COLORS } from "../components/MapView"
import type { Alert } from "../types"

export default function AlertDetails() {
  const { alertId } = useParams()
  const navigate = useNavigate()
  const [alert, setAlert] = useState<Alert | null>(null)
  const [toast, setToast] = useState("")
  const [showMap, setShowMap] = useState(false)

  function load() {
    if (alertId) api.alert(Number(alertId)).then(setAlert)
  }
  useEffect(load, [alertId])

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 2500)
  }

  async function handleGenerateReport() {
    if (!alert) return
    const res = await api.generateReport(alert.id)
    flash(res.already_existed ? `Report ${res.report_code} already exists.` : `Report ${res.report_code} generated and routed.`)
    load()
  }
  async function handleAssignOfficer() {
    if (!alert) return
    await api.assignOfficer(alert.id)
    flash("Officer assigned.")
    load()
  }
  async function handleVerify() {
    if (!alert) return
    await api.verifyAlert(alert.id)
    flash("Marked as verified.")
    load()
  }

  if (!alert) return <LoadingState label="Loading alert..." />

  const critical = alert.severity === "CRITICAL"

  return (
    <div>
      <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${critical ? "bg-critical-light" : "bg-warning-light"}`}>
        <AlertTriangle className={`w-6 h-6 ${critical ? "text-critical" : "text-warning"}`} />
        <div>
          <div className={`text-xs font-semibold uppercase ${critical ? "text-critical" : "text-warning"}`}>{alert.severity} ALERT</div>
          <div className="text-lg font-semibold text-ink-900">
            {alert.is_vehicle_incident ? "Potential Road Safety Incident" : `${alert.detection_type} — Road Intelligence Alert`}
          </div>
        </div>
      </div>

      <PageHeader
        title={alert.alert_code}
        subtitle="Detected via bus-mounted AI perception — evidence and AI explanation below"
        actions={
          <>
            <Button onClick={handleGenerateReport}><FileText className="w-4 h-4" /> GENERATE REPORT</Button>
            <Button variant="secondary" onClick={() => setShowMap((v) => !v)}><MapIcon className="w-4 h-4" /> VIEW ON MAP</Button>
            <Button variant="secondary" onClick={handleAssignOfficer}><UserCheck className="w-4 h-4" /> ASSIGN OFFICER</Button>
            <Button variant="secondary" onClick={handleVerify}><CheckCircle2 className="w-4 h-4" /> MARK AS VERIFIED</Button>
          </>
        }
      />
      {toast && <div className="mb-4 text-sm text-accent-dark bg-accent-light px-3 py-2 rounded-lg">{toast}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">Evidence</div>
          <img src={alert.evidence_frame} alt="Evidence" className="w-full rounded-lg mb-3" />
          {showMap && (
            <MapView markers={[{ id: "a", lat: alert.lat, lng: alert.lng, color: MARKER_COLORS.critical, label: alert.detection_type }]} zoom={15} center={[alert.lat, alert.lng]} height={220} />
          )}
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">Incident Details</div>
          <dl className="text-sm space-y-2">
            {[
              ["Bus", alert.bus_id], ["Route", alert.route_code], ["Camera", alert.camera],
              ["Date", new Date(alert.created_at).toLocaleDateString()], ["Time", new Date(alert.created_at).toLocaleTimeString()],
              ["Location", alert.location_name], ["GPS", `${alert.lat.toFixed(4)}, ${alert.lng.toFixed(4)}`],
              ["AI Confidence", `${(alert.confidence * 100).toFixed(0)}%`],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between">
                <dt className="text-ink-500">{label}</dt>
                <dd className="text-ink-900 font-medium tabular">{val as string}</dd>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <dt className="text-ink-500">Severity</dt>
              <dd><SeverityBadge severity={alert.severity} /></dd>
            </div>
          </dl>
          <div className="mt-3 pt-3 border-t border-surface-line">
            <div className="text-xs text-ink-500 mb-1">AI Explanation</div>
            <p className="text-sm text-ink-900">{alert.ai_explanation}</p>
          </div>
          {alert.observed_by_buses.length > 1 && (
            <div className="mt-3 pt-3 border-t border-surface-line">
              <div className="text-xs text-ink-500 mb-1">Multi-Bus Verification</div>
              <p className="text-sm text-ink-900">{alert.observed_by_buses.length} independent observations ({alert.observed_by_buses.join(", ")}) — confidence upgraded to <span className="font-semibold">VERY HIGH</span>.</p>
            </div>
          )}
          {alert.officer && (
            <div className="mt-3 pt-3 border-t border-surface-line">
              <div className="text-xs text-ink-500 mb-1">Assigned Officer</div>
              <p className="text-sm text-ink-900">{alert.officer.name} — {alert.officer.department}, {alert.officer.zone}</p>
            </div>
          )}
          {alert.verified && <div className="mt-3 text-xs text-success font-medium">✓ Verified</div>}
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">Vehicle Tracking</div>
          {alert.vehicle_track ? (
            <>
              <dl className="text-sm space-y-2 mb-3">
                <div className="flex justify-between"><dt className="text-ink-500">Track ID</dt><dd className="font-medium tabular">{alert.vehicle_track.track_id}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-500">Vehicle type</dt><dd className="font-medium">{alert.vehicle_track.vehicle_type}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-500">Direction</dt><dd className="font-medium">{alert.vehicle_track.direction}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-500">Registration (OCR)</dt><dd className="font-medium tabular">{alert.vehicle_track.ocr_plate}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-500">OCR confidence</dt><dd className="font-medium">{(alert.vehicle_track.ocr_confidence * 100).toFixed(0)}%</dd></div>
              </dl>
              <p className="text-xs text-warning bg-warning-light rounded-lg px-2.5 py-2 mb-3">AI/OCR result — registration number requires human verification.</p>
              <div className="space-y-2">
                {alert.vehicle_track.timeline.map((t, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="text-ink-300 tabular w-16 flex-shrink-0">{formatDateTime(t.time)}</span>
                    <span className="text-ink-900">{t.stage}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-ink-500 py-6 text-center">No vehicle tracking associated with this alert.</div>
          )}
          {alert.report && (
            <div className="mt-4 pt-3 border-t border-surface-line text-sm">
              <div className="text-xs text-ink-500 mb-1">Report</div>
              <button className="text-accent underline" onClick={() => navigate("/reports")}>{alert.report.report_code} {alert.report.sent ? "(sent)" : "(not sent)"}</button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
