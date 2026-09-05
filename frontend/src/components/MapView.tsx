import React from "react"
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"

export interface MapMarker {
  id: string | number
  lat: number
  lng: number
  color: string
  label: string
  popup?: React.ReactNode
}

const CHENNAI_CENTER: [number, number] = [13.0500, 80.2200]

export default function MapView({
  markers, height = 420, zoom = 12, center,
}: {
  markers: MapMarker[]
  height?: number
  zoom?: number
  center?: [number, number]
}) {
  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-surface-line">
      <MapContainer center={center || CHENNAI_CENTER} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((mk) => (
          <CircleMarker
            key={mk.id}
            center={[mk.lat, mk.lng]}
            radius={8}
            pathOptions={{ color: mk.color, fillColor: mk.color, fillOpacity: 0.85, weight: 2 }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">{mk.label}</div>
                {mk.popup}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}

export const MARKER_COLORS: Record<string, string> = {
  critical: "#C0392B",
  warning: "#C9791C",
  resolved: "#1E8449",
  bus: "#0B5FA8",
  info: "#3D5A73",
}
