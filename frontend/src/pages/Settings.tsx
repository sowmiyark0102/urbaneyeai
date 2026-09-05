import React, { useEffect, useState } from "react"
import { Play, RotateCcw } from "lucide-react"
import { api } from "../api"
import { Card, PageHeader, Button } from "../components/ui"

export default function Settings() {
  const [demo, setDemo] = useState<any>(null)
  const [running, setRunning] = useState(false)

  function refresh() { api.demoState().then(setDemo) }
  useEffect(refresh, [])

  async function startOrAdvance() {
    setRunning(true)
    const state = await api.demoStart()
    setDemo(state)
    setRunning(false)
  }
  async function runFullDemo() {
    setRunning(true)
    let state = demo
    while (!state || state.step < state.total_steps) {
      state = await api.demoStart()
      setDemo(state)
      await new Promise((r) => setTimeout(r, 700))
    }
    setRunning(false)
  }
  async function reset() {
    const state = await api.demoReset()
    setDemo(state)
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="System status, credentials, and SIH demo controls" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">System Status</div>
          <dl className="text-sm space-y-2">
            {[["System status", "ONLINE"], ["Last synchronization", "2 minutes ago"], ["Edge AI", "ONLINE"],
              ["Fleet connectivity", "98.4%"], ["Camera health", "96.8%"], ["AI processing", "ACTIVE"]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt className="text-ink-500">{k}</dt><dd className="font-medium text-success">{v}</dd></div>
            ))}
          </dl>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold text-ink-900 mb-3">Account</div>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-ink-500">Username</dt><dd className="font-medium">admin</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Role</dt><dd className="font-medium">Control Room Operator</dd></div>
          </dl>
          <p className="text-xs text-ink-300 mt-4">Demo / Simulated Data — Smart India Hackathon 2026 prototype. Not connected to any real government system.</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-ink-900">SIH Demo Mode</div>
          <div className="flex gap-2">
            <Button onClick={runFullDemo} disabled={running}><Play className="w-4 h-4" /> START LIVE DEMO</Button>
            <Button variant="secondary" onClick={reset}><RotateCcw className="w-4 h-4" /> RESET DEMO</Button>
          </div>
        </div>
        <p className="text-xs text-ink-500 mb-4">Runs the full closed-loop workflow for BUS-104: detect → verify → report → alert → action → track → re-verify.</p>

        {demo && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {demo.steps.map((s: string, i: number) => (
                <div key={i} className={`px-2.5 py-1.5 rounded-lg text-xs border ${i < demo.step ? "bg-success-light text-success border-success/20" : "bg-surface text-ink-300 border-surface-line"}`}>
                  {i + 1}. {s}
                </div>
              ))}
            </div>
            <div className="text-xs text-ink-500 mb-2">Live log</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {demo.log.slice().reverse().map((l: any, i: number) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="text-ink-300 tabular w-16 flex-shrink-0">{l.time}</span>
                  <span className="text-ink-900">{l.message}</span>
                </div>
              ))}
              {demo.log.length === 0 && <div className="text-xs text-ink-300">No demo steps run yet.</div>}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
