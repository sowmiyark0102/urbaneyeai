import React, { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Play, Pause, Camera, Siren, Car, Users } from "lucide-react"
import { api } from "../api"
import { Card, PageHeader, Button, SeverityBadge, formatTime } from "../components/ui"

export default function LiveAI() {
  const { busId: paramBusId } = useParams()
  const busId = paramBusId || "BUS-104"
  const navigate = useNavigate()
  const [running, setRunning] = useState(true)
  const [tick, setTick] = useState<any>(null)
  const [lastEvidence, setLastEvidence] = useState<string | null>(null)
  const [toast, setToast] = useState("")
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    async function poll() {
      const data = await api.liveFeed(busId).catch(() => null)
      if (data) {
        setTick(data)
        if (data.detection) setLastEvidence(data.detection.evidence_frame)
      }
    }
    poll()
    if (running) {
      intervalRef.current = window.setInterval(poll, 3000)
    }
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current) }
  }, [busId, running])

  async function capture() {
    const res = await api.captureEvent(busId)
    setLastEvidence(res.evidence_frame)
    setToast("Event captured and logged to detections.")
    setTimeout(() => setToast(""), 2500)
  }

  async function generateAlert() {
    try {
      const alert = await api.generateAlertFromLive(busId)
      setToast(`Alert ${alert.alert_code} generated.`)
      setTimeout(() => { setToast(""); navigate(`/alerts/${alert.id}`) }, 900)
    } catch (e: any) {
      setToast(e.message)
      setTimeout(() => setToast(""), 2500)
    }
  }

  const detection = tick?.detection

  return (
    <div>
      <PageHeader title="Live AI Monitoring" subtitle={`${busId} · Onboard AI edge-processing demonstration (simulated inference)`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-4">
          <div className="relative rounded-xl overflow-hidden bg-ink-900 aspect-video flex items-center justify-center">
            {lastEvidence ? (
              <img src={lastEvidence} alt="Evidence frame" className="w-full h-full object-cover" />
            ) : (
              <div className="text-white/40 text-sm">Simulated road feed — waiting for first frame...</div>
            )}
            {detection && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="border-2 border-critical rounded-md px-10 py-8 relative">
                  <span className="absolute -top-6 left-0 text-xs bg-critical text-white px-1.5 py-0.5 rounded">
                    {detection.label} {(detection.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2 py-1 rounded">
              <span className={`w-1.5 h-1.5 rounded-full ${running ? "bg-critical animate-pulse" : "bg-ink-300"}`} />
              {running ? "LIVE (simulated)" : "PAUSED"}
            </div>
            <div className="absolute bottom-3 right-3 text-white/70 text-xs">
              {tick ? formatTime(tick.timestamp) : "--:--"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={() => setRunning((v) => !v)} variant={running ? "secondary" : "primary"}>
              {running ? <><Pause className="w-4 h-4" /> PAUSE</> : <><Play className="w-4 h-4" /> START AI</>}
            </Button>
            <Button variant="secondary" onClick={capture}><Camera className="w-4 h-4" /> CAPTURE EVENT</Button>
            <Button variant="danger" onClick={generateAlert}><Siren className="w-4 h-4" /> GENERATE ALERT</Button>
          </div>
          {toast && <div className="mt-3 text-sm text-accent-dark bg-accent-light px-3 py-2 rounded-lg">{toast}</div>}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-ink-900">AI Detection Panel</span>
            <span className="flex items-center gap-1.5 text-xs text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> AI ENGINE ONLINE
            </span>
          </div>

          {detection ? (
            <div className="mb-4 p-3 rounded-lg bg-surface">
              <div className="text-sm font-semibold text-ink-900 mb-1">{detection.label}</div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-ink-500">Confidence: {(detection.confidence * 100).toFixed(0)}%</span>
                <SeverityBadge severity={detection.severity} />
              </div>
              <p className="text-xs text-ink-500">{detection.ai_explanation}</p>
            </div>
          ) : (
            <div className="mb-4 p-3 rounded-lg bg-surface text-xs text-ink-500">No active detection this frame.</div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg border border-surface-line">
              <div className="flex items-center gap-1.5 text-xs text-ink-500 mb-1"><Car className="w-3.5 h-3.5" /> Vehicle Count</div>
              {tick && (
                <div className="text-xs text-ink-900 space-y-0.5">
                  <div>Cars: {tick.vehicle_counts.cars}</div>
                  <div>Buses: {tick.vehicle_counts.buses}</div>
                  <div>Motorcycles: {tick.vehicle_counts.motorcycles}</div>
                  <div>Trucks: {tick.vehicle_counts.trucks}</div>
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg border border-surface-line">
              <div className="flex items-center gap-1.5 text-xs text-ink-500 mb-1"><Users className="w-3.5 h-3.5" /> Pedestrians</div>
              <div className="text-2xl font-semibold tabular text-ink-900">{tick?.vehicle_counts.pedestrians ?? "-"}</div>
            </div>
          </div>

          <div className="text-xs text-ink-500 space-y-1.5">
            <div className="flex justify-between"><span>GPS</span><span className="tabular text-ink-900">{tick ? `${tick.gps.lat}, ${tick.gps.lng}` : "-"}</span></div>
            <div className="flex justify-between"><span>Speed</span><span className="tabular text-ink-900">{tick?.speed_kmh ?? "-"} km/h</span></div>
            <div className="flex justify-between"><span>Timestamp</span><span className="tabular text-ink-900">{tick ? formatTime(tick.timestamp) : "-"}</span></div>
          </div>
        </Card>
      </div>
    </div>
  )
}
