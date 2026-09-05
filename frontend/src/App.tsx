import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import Layout from "./components/Layout"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Fleet from "./pages/Fleet"
import BusDetails from "./pages/BusDetails"
import LiveAI from "./pages/LiveAI"
import Alerts from "./pages/Alerts"
import AlertDetails from "./pages/AlertDetails"
import GISMap from "./pages/GISMap"
import TrafficAnalytics from "./pages/TrafficAnalytics"
import RoadIntelligence from "./pages/RoadIntelligence"
import RoadDetails from "./pages/RoadDetails"
import PredictiveRisk from "./pages/PredictiveRisk"
import Maintenance from "./pages/Maintenance"
import Reports from "./pages/Reports"
import ActionTracking from "./pages/ActionTracking"
import RepairVerification from "./pages/RepairVerification"
import Analytics from "./pages/Analytics"
import Settings from "./pages/Settings"

function isAuthed() {
  return !!localStorage.getItem("uea_token")
}

function Protected({ children }: { children: React.ReactNode }) {
  if (!isAuthed()) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/fleet" element={<Protected><Fleet /></Protected>} />
      <Route path="/fleet/:busId" element={<Protected><BusDetails /></Protected>} />
      <Route path="/live" element={<Protected><LiveAI /></Protected>} />
      <Route path="/live/:busId" element={<Protected><LiveAI /></Protected>} />
      <Route path="/alerts" element={<Protected><Alerts /></Protected>} />
      <Route path="/alerts/:alertId" element={<Protected><AlertDetails /></Protected>} />
      <Route path="/gis-map" element={<Protected><GISMap /></Protected>} />
      <Route path="/traffic-analytics" element={<Protected><TrafficAnalytics /></Protected>} />
      <Route path="/road-intelligence" element={<Protected><RoadIntelligence /></Protected>} />
      <Route path="/road-intelligence/:roadId" element={<Protected><RoadDetails /></Protected>} />
      <Route path="/predictive-risk" element={<Protected><PredictiveRisk /></Protected>} />
      <Route path="/maintenance" element={<Protected><Maintenance /></Protected>} />
      <Route path="/reports" element={<Protected><Reports /></Protected>} />
      <Route path="/action-tracking" element={<Protected><ActionTracking /></Protected>} />
      <Route path="/repair-verification" element={<Protected><RepairVerification /></Protected>} />
      <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="/" element={<Navigate to={isAuthed() ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
