"""
SQLAlchemy ORM models for URBAN-EYE AI.

Table groups:
 - identity: User, Officer
 - fleet: Route, Bus
 - perception: Detection, TrafficObservation, VehicleTrack
 - incidents: Alert, RoadSegment, HazardZone, RainRiskZone
 - operations: Report, MaintenanceTask, RepairVerification, Notification
"""
import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from .database import Base


def now():
    return datetime.datetime.utcnow()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, default="Control Room Operator")
    role = Column(String, default="admin")
    created_at = Column(DateTime, default=now)


class Officer(Base):
    __tablename__ = "officers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    designation = Column(String, default="Zone Maintenance Officer")
    zone = Column(String, nullable=False)
    department = Column(String, default="Road Maintenance")
    phone = Column(String, default="+91 98XXXXXX00")
    active_tasks = Column(Integer, default=0)


class RouteModel(Base):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    zone = Column(String, default="North Chennai")
    buses = relationship("Bus", back_populates="route")


class Bus(Base):
    __tablename__ = "buses"
    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(String, unique=True, index=True, nullable=False)
    route_id = Column(Integer, ForeignKey("routes.id"))
    driver_status = Column(String, default="Active")
    gps_status = Column(String, default="GPS OK")
    camera_status = Column(String, default="Camera OK")
    ai_status = Column(String, default="AI ON")
    status = Column(String, default="ONLINE")  # ONLINE / ALERT / OFFLINE
    speed_kmh = Column(Float, default=30.0)
    lat = Column(Float, default=13.0827)
    lng = Column(Float, default=80.2707)
    last_sync = Column(DateTime, default=now)
    today_detections = Column(Integer, default=0)

    route = relationship("RouteModel", back_populates="buses")


class Detection(Base):
    __tablename__ = "detections"
    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(String, ForeignKey("buses.bus_id"))
    category = Column(String, nullable=False)   # ROAD / TRAFFIC / SAFETY
    label = Column(String, nullable=False)       # e.g. Pothole, Car, Rash-driving
    confidence = Column(Float, nullable=False)
    severity = Column(String, default="LOW")     # LOW/MEDIUM/HIGH/CRITICAL
    lat = Column(Float)
    lng = Column(Float)
    location_name = Column(String)
    camera = Column(String, default="Front Camera")
    evidence_frame = Column(String, default="/sample-frames/pothole_1.jpg")
    timestamp = Column(DateTime, default=now)
    ai_explanation = Column(Text, default="")


class TrafficObservation(Base):
    __tablename__ = "traffic_observations"
    id = Column(Integer, primary_key=True, index=True)
    route_code = Column(String)
    hour = Column(Integer)
    cars = Column(Integer, default=0)
    buses = Column(Integer, default=0)
    motorcycles = Column(Integer, default=0)
    trucks = Column(Integer, default=0)
    pedestrians = Column(Integer, default=0)
    avg_speed = Column(Float, default=30.0)
    congestion_level = Column(String, default="MODERATE")
    timestamp = Column(DateTime, default=now)


class VehicleTrack(Base):
    __tablename__ = "vehicle_tracks"
    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(String, unique=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    vehicle_type = Column(String, default="Car")
    direction = Column(String, default="Northbound")
    ocr_plate = Column(String, default="TN XX XXXX")
    ocr_confidence = Column(Float, default=0.0)
    detected_at = Column(DateTime, default=now)
    tracked_at = Column(DateTime, default=now)
    plate_captured_at = Column(DateTime, default=now)
    flagged_at = Column(DateTime, default=now)


class RoadSegment(Base):
    __tablename__ = "road_segments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    route_code = Column(String, default="")
    primary_issue = Column(String, default="Pothole")
    severity = Column(String, default="MEDIUM")
    first_detected = Column(DateTime, default=now)
    last_detected = Column(DateTime, default=now)
    frequency = Column(Integer, default=1)
    status = Column(String, default="Open")  # Open / Assigned / In Progress / Resolved
    trend = Column(String, default="STABLE")  # IMPROVING / STABLE / WORSENING
    road_health_score = Column(Integer, default=70)
    observed_by_buses = Column(String, default="")  # comma separated bus ids


class HazardZone(Base):
    """Invisible danger zone — inferred from bus telemetry, no visible defect required."""
    __tablename__ = "hazard_zones"
    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    observed_by_bus_count = Column(Integer, default=0)
    avg_speed_reduction_pct = Column(Float, default=0.0)
    sudden_braking_events = Column(Integer, default=0)
    risk_level = Column(String, default="MEDIUM")
    status = Column(String, default="Needs inspection")


class RainRiskZone(Base):
    __tablename__ = "rain_risk_zones"
    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    rain_events = Column(Integer, default=0)
    waterlogging_events = Column(Integer, default=0)
    risk_level = Column(String, default="MEDIUM")
    prediction = Column(Text, default="")


class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String, unique=True, index=True)
    bus_id = Column(String, ForeignKey("buses.bus_id"))
    route_code = Column(String)
    detection_type = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    severity = Column(String, nullable=False)
    lat = Column(Float)
    lng = Column(Float)
    location_name = Column(String)
    camera = Column("camera_id", String, default="Front Camera")
    evidence_frame = Column(String, default="/sample-frames/pothole_1.jpg")
    status = Column(String, default="NEW")  # NEW/ACKNOWLEDGED/IN_PROGRESS/RESOLVED
    ai_explanation = Column(Text, default="")
    is_vehicle_incident = Column(Boolean, default=False)
    observed_by_buses = Column(String, default="")  # comma separated -> multi-bus verification
    road_segment_id = Column(Integer, ForeignKey("road_segments.id"), nullable=True)
    officer_id = Column(Integer, ForeignKey("officers.id"), nullable=True)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now)


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String, unique=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"))
    file_path = Column(String)
    generated_at = Column(DateTime, default=now)
    sent = Column(Boolean, default=False)
    sent_to_officer_id = Column(Integer, ForeignKey("officers.id"), nullable=True)
    zone = Column(String, default="")


class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    road_segment_id = Column(Integer, ForeignKey("road_segments.id"), nullable=True)
    issue = Column(String, nullable=False)
    location_name = Column(String)
    severity = Column(String, default="MEDIUM")
    officer_id = Column(Integer, ForeignKey("officers.id"), nullable=True)
    detected_date = Column(DateTime, default=now)
    due_date = Column(DateTime, default=now)
    status = Column(String, default="OPEN")  # OPEN/ASSIGNED/IN_PROGRESS/RESOLVED/VERIFICATION_REQUIRED
    timeline_json = Column(Text, default="[]")  # list of {stage, timestamp}


class RepairVerification(Base):
    __tablename__ = "repair_verifications"
    id = Column(Integer, primary_key=True, index=True)
    maintenance_task_id = Column(Integer, ForeignKey("maintenance_tasks.id"))
    verifying_bus_id = Column(String, default="")
    before_state = Column(String, default="")
    after_state = Column(String, default="")
    result = Column(String, default="PENDING")  # PASSED / FAILED / PENDING
    verified_at = Column(DateTime, default=now)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    level = Column(String, default="INFO")  # CRITICAL/WARNING/RESOLVED/INFO
    message = Column(Text, nullable=False)
    link = Column(String, default="")
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now)
