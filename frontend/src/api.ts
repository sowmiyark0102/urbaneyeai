const BASE = "/api"

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(detail.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  login: (username: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  dashboard: () => request("/dashboard"),

  buses: (params: { search?: string; route?: string; status?: string } = {}) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return request(`/buses${q ? `?${q}` : ""}`)
  },
  bus: (busId: string) => request(`/buses/${busId}`),

  liveFeed: (busId: string) => request(`/live/${busId}`),
  captureEvent: (busId: string) => request(`/live/${busId}/capture`, { method: "POST" }),
  generateAlertFromLive: (busId: string) => request(`/live/${busId}/generate-alert`, { method: "POST" }),

  alerts: (params: { severity?: string; status?: string } = {}) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return request(`/alerts${q ? `?${q}` : ""}`)
  },
  alert: (id: number) => request(`/alerts/${id}`),
  assignOfficer: (id: number) => request(`/alerts/${id}/assign-officer`, { method: "POST" }),
  verifyAlert: (id: number) => request(`/alerts/${id}/verify`, { method: "POST" }),

  roads: () => request("/roads"),
  road: (id: number) => request(`/roads/${id}`),
  hazardZones: () => request("/hazard-zones"),
  rainZones: () => request("/rain-zones"),
  predictiveRisk: () => request("/predictive-risk"),

  reports: () => request("/reports"),
  generateReport: (alertId: number) => request(`/reports/generate?alert_id=${alertId}`, { method: "POST" }),
  sendReport: (reportId: number, officerId?: number) =>
    request("/reports/send", { method: "POST", body: JSON.stringify({ report_id: reportId, officer_id: officerId }) }),
  downloadReportUrl: (reportId: number) => `${BASE}/reports/${reportId}/download`,

  officers: () => request("/officers"),

  maintenance: () => request("/maintenance"),
  updateMaintenance: (id: number, payload: { status?: string; officer_id?: number }) =>
    request(`/maintenance/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  verifyRepair: (taskId: number) => request(`/repair/verify?task_id=${taskId}`, { method: "POST" }),
  repairVerifications: () => request("/repair-verifications"),

  analytics: () => request("/analytics"),
  trafficAnalytics: (route?: string) => request(`/traffic-analytics${route ? `?route=${route}` : ""}`),

  notifications: () => request("/notifications"),
  readNotification: (id: number) => request(`/notifications/${id}/read`, { method: "POST" }),

  search: (q: string) => request(`/search?q=${encodeURIComponent(q)}`),

  demoState: () => request("/demo/state"),
  demoStart: () => request("/demo/start", { method: "POST" }),
  demoReset: () => request("/demo/reset", { method: "POST" }),
}
