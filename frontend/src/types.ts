export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface Bus {
  id: number
  bus_id: string
  route_code: string | null
  route_name: string | null
  driver_status: string
  gps_status: string
  camera_status: string
  ai_status: string
  status: string
  speed_kmh: number
  lat: number
  lng: number
  last_sync: string
  today_detections: number
}

export interface Alert {
  id: number
  alert_code: string
  bus_id: string
  route_code: string | null
  detection_type: string
  confidence: number
  severity: Severity
  lat: number
  lng: number
  location_name: string
  camera: string
  evidence_frame: string
  status: string
  ai_explanation: string
  is_vehicle_incident: boolean
  observed_by_buses: string[]
  verified: boolean
  created_at: string
  officer?: { id: number; name: string; zone: string; department: string } | null
  report?: { id: number; report_code: string; sent: boolean }
  vehicle_track?: {
    track_id: string
    vehicle_type: string
    direction: string
    ocr_plate: string
    ocr_confidence: number
    timeline: { stage: string; time: string }[]
  }
}

export interface RoadSegment {
  id: number
  name: string
  lat: number
  lng: number
  route_code: string
  primary_issue: string
  severity: Severity
  first_detected: string
  last_detected: string
  frequency: number
  status: string
  trend: "IMPROVING" | "STABLE" | "WORSENING"
  road_health_score: number
  observed_by_buses: string[]
}

export interface MaintenanceTask {
  id: number
  issue: string
  location_name: string
  severity: Severity
  officer_name: string
  officer_id: number | null
  detected_date: string
  due_date: string
  status: string
  timeline: { stage: string; timestamp: string }[]
  alert_id: number | null
}

export interface Notification {
  id: number
  level: "CRITICAL" | "WARNING" | "RESOLVED" | "INFO"
  message: string
  link: string
  read: boolean
  created_at: string
}

export interface Report {
  id: number
  report_code: string
  alert_id: number
  detection_type: string
  severity: Severity
  generated_at: string
  sent: boolean
  zone: string
  officer_name: string | null
}
