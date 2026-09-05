from pydantic import BaseModel
from typing import Optional, List
import datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
    full_name: str


class BusOut(BaseModel):
    id: int
    bus_id: str
    route_code: Optional[str] = None
    route_name: Optional[str] = None
    driver_status: str
    gps_status: str
    camera_status: str
    ai_status: str
    status: str
    speed_kmh: float
    lat: float
    lng: float
    last_sync: datetime.datetime
    today_detections: int

    class Config:
        from_attributes = True


class DetectionOut(BaseModel):
    id: int
    bus_id: str
    category: str
    label: str
    confidence: float
    severity: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    location_name: Optional[str] = None
    camera: str
    evidence_frame: str
    timestamp: datetime.datetime
    ai_explanation: str

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    alert_code: str
    bus_id: str
    route_code: Optional[str] = None
    detection_type: str
    confidence: float
    severity: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    location_name: Optional[str] = None
    status: str
    ai_explanation: str
    is_vehicle_incident: bool
    observed_by_buses: str
    verified: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class AlertCreate(BaseModel):
    bus_id: str
    detection_type: str
    confidence: float
    severity: str
    lat: float
    lng: float
    location_name: str
    ai_explanation: Optional[str] = ""
    is_vehicle_incident: Optional[bool] = False


class MaintenanceUpdate(BaseModel):
    status: Optional[str] = None
    officer_id: Optional[int] = None


class ReportSend(BaseModel):
    report_id: int
    officer_id: Optional[int] = None
