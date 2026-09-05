import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ScanEye, Loader2 } from "lucide-react"
import { api } from "../api"

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("admin123")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await api.login(username, password)
      localStorage.setItem("uea_token", res.token)
      localStorage.setItem("uea_username", res.username)
      localStorage.setItem("uea_fullname", res.full_name)
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
            <ScanEye className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white text-xl font-semibold tracking-tight">URBAN-EYE AI</h1>
          <p className="text-white/50 text-sm mt-1 text-center">AI-Powered Mobile Urban Intelligence Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-500 mb-1.5 block">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-500 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-surface-line text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              placeholder="••••••••"
            />
          </div>
          {error && <div className="text-critical text-xs bg-critical-light rounded-lg px-3 py-2">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            LOGIN
          </button>
          <p className="text-center text-xs text-ink-300 pt-1">Demo credentials — admin / admin123</p>
        </form>
        <p className="text-center text-white/30 text-xs mt-6">Smart India Hackathon 2026 · Team Fade-Out</p>
      </div>
    </div>
  )
}
