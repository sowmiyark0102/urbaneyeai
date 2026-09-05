import datetime
import json
import random
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from passlib.hash import bcrypt

from . import models as m, schemas as s
from .database import Base, engine, get_db
from .seed import run_seed
from .ai_engine import random_detection, random_traffic_counts
from .pdf_generator import generate_report_pdf
from . import demo_engine

Base.metadata.create_all(bind=engine)
run_seed()

app = FastAPI(title="URBAN-EYE AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/sample-frames", StaticFiles(directory=STATIC_DIR), name="sample-frames")


def bus_to_dict(b: m.Bus):
    return {
        "id": b.id, "bus_id": b.bus_id,
        "route_code": b.route.code if b.route else None,
        "route_name": b.route.name if b.route else None,
        "driver_status": b.driver_status, "gps_status": b.gps_status,
        "camera_status": b.camera_status, "ai_status": b.ai_status,
        "status": b.status, "speed_kmh": b.speed_kmh, "lat": b.lat, "lng": b.lng,
        "last_sync": b.last_sync, "today_detections": b.today_detections,
    }


def alert_to_dict(a: m.Alert):
    return {
        "id": a.id, "alert_code": a.alert_code, "bus_id": a.bus_id, "route_code": a.route_code,
        "detection_type": a.detection_type, "confidence": a.confidence, "severity": a.severity,
        "lat": a.lat, "lng": a.lng, "location_name": a.location_name, "camera": a.camera,
        "evidence_frame": a.evidence_frame, "status": a.status, "ai_explanation": a.ai_explanation,
        "is_vehicle_incident": a.is_vehicle_incident,
        "observed_by_buses": [b for b in a.observed_by_buses.split(",") if b],
        "verified": a.verified, "created_at": a.created_at,
        "officer": officer_brief(a.officer_id) if a.officer_id else None,
    }


def officer_brief(officer_id, db=None):
    return {"id": officer_id}


# ---------------------------------------------------------------- AUTH
@app.post("/api/auth/login")
def login(req: s.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(m.User).filter_by(username=req.username).first()
    if not user or not bcrypt.verify(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"token": f"demo-token-{user.id}", "username": user.username, "full_name": user.full_name}


# ---------------------------------------------------------------- DASHBOARD
@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    active_buses = db.query(m.Bus).count()
    ai_monitoring = db.query(m.Bus).filter_by(ai_status="AI ON").count()
    active_alerts = db.query(m.Alert).filter(m.Alert.status != "RESOLVED").count()
    critical_alerts = db.query(m.Alert).filter_by(severity="CRITICAL").filter(m.Alert.status != "RESOLVED").count()
    road_issues = db.query(m.RoadSegment).count() + db.query(m.Detection).filter_by(category="ROAD").count()
    reports_generated = db.query(m.Report).count()

    buses = [bus_to_dict(b) for b in db.query(m.Bus).all()]
    recent_alerts = db.query(m.Alert).order_by(m.Alert.created_at.desc()).limit(8).all()

    map_markers = []
    for b in db.query(m.Bus).all():
        map_markers.append({"type": "bus", "lat": b.lat, "lng": b.lng, "label": b.bus_id, "status": b.status})
    for a in db.query(m.Alert).filter(m.Alert.status != "RESOLVED").all():
        sev_color = "critical" if a.severity == "CRITICAL" else ("warning" if a.severity in ("HIGH", "MEDIUM") else "info")
        map_markers.append({
            "type": "alert", "lat": a.lat, "lng": a.lng, "label": a.detection_type,
            "severity": sev_color, "alert_id": a.id, "bus_id": a.bus_id, "route_code": a.route_code,
            "time": a.created_at,
        })
    for a in db.query(m.Alert).filter_by(status="RESOLVED").limit(10).all():
        map_markers.append({"type": "alert", "lat": a.lat, "lng": a.lng, "label": a.detection_type,
                             "severity": "resolved", "alert_id": a.id, "bus_id": a.bus_id, "time": a.created_at})

    return {
        "system_status": "ONLINE",
        "cards": {
            "active_buses": active_buses, "ai_monitoring": ai_monitoring,
            "active_alerts": active_alerts, "critical_alerts": critical_alerts,
            "road_issues_detected": road_issues, "reports_generated": reports_generated,
        },
        "map_markers": map_markers,
        "recent_alerts": [alert_to_dict(a) for a in recent_alerts],
        "fleet_connectivity": 98.4, "camera_health": 96.8, "last_sync_minutes": 2,
    }


# ---------------------------------------------------------------- BUSES
@app.get("/api/buses")
def list_buses(search: str = "", route: str = "", status: str = "", db: Session = Depends(get_db)):
    q = db.query(m.Bus)
    if search:
        q = q.filter(m.Bus.bus_id.ilike(f"%{search}%"))
    if status:
        q = q.filter(m.Bus.status == status)
    buses = q.all()
    if route:
        buses = [b for b in buses if b.route and b.route.code == route]
    return [bus_to_dict(b) for b in buses]


@app.get("/api/buses/{bus_id}")
def get_bus(bus_id: str, db: Session = Depends(get_db)):
    bus = db.query(m.Bus).filter_by(bus_id=bus_id).first()
    if not bus:
        raise HTTPException(404, "Bus not found")
    detections = db.query(m.Detection).filter_by(bus_id=bus_id).order_by(m.Detection.timestamp.desc()).limit(10).all()
    return {
        **bus_to_dict(bus),
        "recent_detections": [{
            "id": d.id, "label": d.label, "category": d.category, "severity": d.severity,
            "confidence": d.confidence, "timestamp": d.timestamp, "location_name": d.location_name,
        } for d in detections],
    }


# ---------------------------------------------------------------- LIVE AI MONITORING
@app.get("/api/live/{bus_id}")
def live_feed(bus_id: str, db: Session = Depends(get_db)):
    """Simulated live AI inference tick — polled every few seconds by the Live AI Monitoring page."""
    bus = db.query(m.Bus).filter_by(bus_id=bus_id).first()
    if not bus:
        raise HTTPException(404, "Bus not found")
    detection = None
    if random.random() < 0.55:
        detection = random_detection(location_name=bus.route.name.split(" - ")[0] if bus.route else "Chennai",
                                      lat=bus.lat, lng=bus.lng)
    return {
        "bus_id": bus_id, "ai_engine": "ONLINE",
        "detection": detection,
        "vehicle_counts": random_traffic_counts(),
        "gps": {"lat": round(bus.lat, 4), "lng": round(bus.lng, 4)},
        "speed_kmh": bus.speed_kmh,
        "timestamp": datetime.datetime.utcnow(),
    }


@app.post("/api/live/{bus_id}/capture")
def capture_event(bus_id: str, db: Session = Depends(get_db)):
    bus = db.query(m.Bus).filter_by(bus_id=bus_id).first()
    if not bus:
        raise HTTPException(404, "Bus not found")
    det = random_detection(location_name=bus.route.name.split(" - ")[0] if bus.route else "Chennai",
                            lat=bus.lat, lng=bus.lng)
    d = m.Detection(bus_id=bus_id, category=det["category"], label=det["label"],
                     confidence=det["confidence"], severity=det["severity"],
                     lat=det["lat"], lng=det["lng"], location_name=det["location_name"],
                     evidence_frame=det["evidence_frame"], ai_explanation=det["ai_explanation"])
    db.add(d)
    bus.today_detections += 1
    db.commit()
    db.refresh(d)
    return {"id": d.id, **det}


@app.post("/api/live/{bus_id}/generate-alert")
def generate_alert_from_live(bus_id: str, detection_id: int = None, db: Session = Depends(get_db)):
    bus = db.query(m.Bus).filter_by(bus_id=bus_id).first()
    if not bus:
        raise HTTPException(404, "Bus not found")
    det = db.query(m.Detection).filter_by(bus_id=bus_id).order_by(m.Detection.id.desc()).first()
    if not det:
        raise HTTPException(400, "No detection available to escalate")
    code = f"ALT-{1000 + db.query(m.Alert).count() + 1}"
    alert = m.Alert(
        alert_code=code, bus_id=bus_id, route_code=bus.route.code if bus.route else "",
        detection_type=det.label, confidence=det.confidence, severity=det.severity,
        lat=det.lat, lng=det.lng, location_name=det.location_name, camera=det.camera,
        evidence_frame=det.evidence_frame, status="NEW", ai_explanation=det.ai_explanation,
        is_vehicle_incident=det.label in ("Potential Rash-Driving Event", "Potential Hit-and-Run Event"),
        observed_by_buses=bus_id,
    )
    db.add(alert)
    db.add(m.Notification(level="CRITICAL" if alert.severity == "CRITICAL" else "WARNING",
                           message=f"{alert.detection_type} detected by {bus_id}.", link=f"/alerts/{alert.id}"))
    db.commit()
    db.refresh(alert)
    return alert_to_dict(alert)


# ---------------------------------------------------------------- ALERTS
@app.get("/api/alerts")
def list_alerts(severity: str = "", status: str = "", db: Session = Depends(get_db)):
    q = db.query(m.Alert)
    if severity:
        q = q.filter(m.Alert.severity == severity)
    if status:
        q = q.filter(m.Alert.status == status)
    alerts = q.order_by(m.Alert.created_at.desc()).all()
    return [alert_to_dict(a) for a in alerts]


@app.get("/api/alerts/{alert_id}")
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    a = db.query(m.Alert).get(alert_id)
    if not a:
        raise HTTPException(404, "Alert not found")
    result = alert_to_dict(a)
    track = db.query(m.VehicleTrack).filter_by(alert_id=alert_id).first()
    if track:
        result["vehicle_track"] = {
            "track_id": track.track_id, "vehicle_type": track.vehicle_type, "direction": track.direction,
            "ocr_plate": track.ocr_plate, "ocr_confidence": track.ocr_confidence,
            "timeline": [
                {"stage": "Detected", "time": track.detected_at},
                {"stage": "Tracked", "time": track.tracked_at},
                {"stage": "License plate captured", "time": track.plate_captured_at},
                {"stage": "Potential incident flagged", "time": track.flagged_at},
            ],
        }
    officer = db.query(m.Officer).get(a.officer_id) if a.officer_id else None
    if officer:
        result["officer"] = {"id": officer.id, "name": officer.name, "zone": officer.zone, "department": officer.department}
    report = db.query(m.Report).filter_by(alert_id=alert_id).first()
    if report:
        result["report"] = {"id": report.id, "report_code": report.report_code, "sent": report.sent}
    return result


@app.post("/api/alerts")
def create_alert(payload: s.AlertCreate, db: Session = Depends(get_db)):
    code = f"ALT-{1000 + db.query(m.Alert).count() + 1}"
    alert = m.Alert(alert_code=code, **payload.dict())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert_to_dict(alert)


@app.post("/api/alerts/{alert_id}/assign-officer")
def assign_officer(alert_id: int, officer_id: int = None, db: Session = Depends(get_db)):
    a = db.query(m.Alert).get(alert_id)
    if not a:
        raise HTTPException(404, "Alert not found")
    if officer_id is None:
        officer = db.query(m.Officer).order_by(func.random()).first()
        officer_id = officer.id if officer else None
    a.officer_id = officer_id
    a.status = "ACKNOWLEDGED" if a.status == "NEW" else a.status
    db.commit()
    return alert_to_dict(a)


@app.post("/api/alerts/{alert_id}/verify")
def mark_verified(alert_id: int, db: Session = Depends(get_db)):
    a = db.query(m.Alert).get(alert_id)
    if not a:
        raise HTTPException(404, "Alert not found")
    a.verified = True
    db.commit()
    return alert_to_dict(a)


# ---------------------------------------------------------------- ROADS
@app.get("/api/roads")
def list_roads(db: Session = Depends(get_db)):
    segs = db.query(m.RoadSegment).order_by(m.RoadSegment.last_detected.desc()).all()
    return [{
        "id": r.id, "name": r.name, "lat": r.lat, "lng": r.lng, "route_code": r.route_code,
        "primary_issue": r.primary_issue, "severity": r.severity,
        "first_detected": r.first_detected, "last_detected": r.last_detected,
        "frequency": r.frequency, "status": r.status, "trend": r.trend,
        "road_health_score": r.road_health_score,
        "observed_by_buses": [b for b in r.observed_by_buses.split(",") if b],
    } for r in segs]


@app.get("/api/roads/{road_id}")
def get_road(road_id: int, db: Session = Depends(get_db)):
    r = db.query(m.RoadSegment).get(road_id)
    if not r:
        raise HTTPException(404, "Road segment not found")
    trips = []
    freq = max(r.frequency, 1)
    span_days = max((r.last_detected - r.first_detected).days, 1)
    for i in range(min(freq, 6)):
        trips.append({
            "trip": i + 1,
            "date": (r.first_detected + datetime.timedelta(days=int(span_days * i / max(min(freq, 6) - 1, 1)))),
            "observation": f"{r.primary_issue} detected" + (" — severity increased" if i == min(freq, 6) - 1 and r.trend == "WORSENING" else ""),
        })
    return {
        "id": r.id, "name": r.name, "lat": r.lat, "lng": r.lng, "route_code": r.route_code,
        "primary_issue": r.primary_issue, "severity": r.severity,
        "first_detected": r.first_detected, "last_detected": r.last_detected,
        "frequency": r.frequency, "status": r.status, "trend": r.trend,
        "road_health_score": r.road_health_score,
        "observed_by_buses": [b for b in r.observed_by_buses.split(",") if b],
        "trip_history": trips,
    }


@app.get("/api/hazard-zones")
def hazard_zones(db: Session = Depends(get_db)):
    return [{
        "id": h.id, "location_name": h.location_name, "lat": h.lat, "lng": h.lng,
        "observed_by_bus_count": h.observed_by_bus_count,
        "avg_speed_reduction_pct": h.avg_speed_reduction_pct,
        "sudden_braking_events": h.sudden_braking_events,
        "risk_level": h.risk_level, "status": h.status,
    } for h in db.query(m.HazardZone).all()]


@app.get("/api/rain-zones")
def rain_zones(db: Session = Depends(get_db)):
    return [{
        "id": rz.id, "location_name": rz.location_name, "lat": rz.lat, "lng": rz.lng,
        "rain_events": rz.rain_events, "waterlogging_events": rz.waterlogging_events,
        "risk_level": rz.risk_level, "prediction": rz.prediction,
    } for rz in db.query(m.RainRiskZone).all()]


@app.get("/api/predictive-risk")
def predictive_risk(db: Session = Depends(get_db)):
    segs = db.query(m.RoadSegment).all()
    results = []
    for r in segs:
        risk = min(97, r.frequency * 4 + (25 if r.severity in ("HIGH", "CRITICAL") else 5) + (10 if r.trend == "WORSENING" else 0))
        results.append({
            "id": r.id, "name": r.name, "lat": r.lat, "lng": r.lng, "risk_score": risk,
            "current_condition": r.severity, "historical_frequency": r.frequency,
            "recent_deterioration": r.trend == "WORSENING", "road_health_score": r.road_health_score,
        })
    results.sort(key=lambda x: -x["risk_score"])
    return results


# ---------------------------------------------------------------- REPORTS
@app.get("/api/reports")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(m.Report).order_by(m.Report.generated_at.desc()).all()
    out = []
    for r in reports:
        alert = db.query(m.Alert).get(r.alert_id)
        officer = db.query(m.Officer).get(r.sent_to_officer_id) if r.sent_to_officer_id else None
        out.append({
            "id": r.id, "report_code": r.report_code, "alert_id": r.alert_id,
            "detection_type": alert.detection_type if alert else "", "severity": alert.severity if alert else "",
            "generated_at": r.generated_at, "sent": r.sent, "zone": r.zone,
            "officer_name": officer.name if officer else None,
        })
    return out


@app.post("/api/reports/generate")
def generate_report(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(m.Alert).get(alert_id)
    if not alert:
        raise HTTPException(404, "Alert not found")
    existing = db.query(m.Report).filter_by(alert_id=alert_id).first()
    if existing:
        return {"id": existing.id, "report_code": existing.report_code, "already_existed": True}
    report_code = f"RPT-{2000 + db.query(m.Report).count() + 1}"
    path = generate_report_pdf({
        "bus_id": alert.bus_id, "route_code": alert.route_code, "camera": alert.camera,
        "date": alert.created_at.strftime("%d %B %Y"), "time": alert.created_at.strftime("%I:%M:%S %p"),
        "location_name": alert.location_name, "lat": alert.lat, "lng": alert.lng,
        "detection_type": alert.detection_type, "confidence": alert.confidence,
        "severity": alert.severity, "ai_explanation": alert.ai_explanation,
    }, report_code)
    # Zone routing by simple heuristic
    officer = db.query(m.Officer).order_by(func.random()).first()
    report = m.Report(report_code=report_code, alert_id=alert.id, file_path=path,
                       sent=False, zone=officer.zone if officer else "North Chennai")
    db.add(report)
    if alert.status == "NEW" and alert.severity in ("HIGH", "CRITICAL"):
        alert.status = "NEW"
    db.commit()
    db.refresh(report)
    return {"id": report.id, "report_code": report.report_code, "zone": report.zone, "already_existed": False}


@app.get("/api/reports/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    r = db.query(m.Report).get(report_id)
    if not r or not r.file_path or not os.path.exists(r.file_path):
        raise HTTPException(404, "Report file not found")
    return FileResponse(r.file_path, media_type="application/pdf", filename=f"{r.report_code}.pdf")


@app.post("/api/reports/send")
def send_report(payload: s.ReportSend, db: Session = Depends(get_db)):
    report = db.query(m.Report).get(payload.report_id)
    if not report:
        raise HTTPException(404, "Report not found")
    officer_id = payload.officer_id
    if officer_id is None:
        officer = db.query(m.Officer).filter_by(zone=report.zone).first() or db.query(m.Officer).first()
        officer_id = officer.id if officer else None
    report.sent = True
    report.sent_to_officer_id = officer_id
    alert = db.query(m.Alert).get(report.alert_id)
    if alert:
        alert.officer_id = officer_id
        if alert.status == "NEW":
            alert.status = "ACKNOWLEDGED"
    db.add(m.Notification(level="INFO", message=f"Report {report.report_code} routed to zone officer.",
                           link=f"/reports"))
    db.commit()
    return {"id": report.id, "sent": True, "zone": report.zone}


# ---------------------------------------------------------------- OFFICERS
@app.get("/api/officers")
def list_officers(db: Session = Depends(get_db)):
    return [{"id": o.id, "name": o.name, "designation": o.designation, "zone": o.zone,
             "department": o.department, "phone": o.phone} for o in db.query(m.Officer).all()]


# ---------------------------------------------------------------- MAINTENANCE
@app.get("/api/maintenance")
def list_maintenance(db: Session = Depends(get_db)):
    tasks = db.query(m.MaintenanceTask).order_by(m.MaintenanceTask.detected_date.desc()).all()
    out = []
    for t in tasks:
        officer = db.query(m.Officer).get(t.officer_id) if t.officer_id else None
        out.append({
            "id": t.id, "issue": t.issue, "location_name": t.location_name, "severity": t.severity,
            "officer_name": officer.name if officer else "Unassigned",
            "officer_id": t.officer_id,
            "detected_date": t.detected_date, "due_date": t.due_date, "status": t.status,
            "timeline": json.loads(t.timeline_json),
            "alert_id": t.alert_id,
        })
    return out


@app.put("/api/maintenance/{task_id}")
def update_maintenance(task_id: int, payload: s.MaintenanceUpdate, db: Session = Depends(get_db)):
    t = db.query(m.MaintenanceTask).get(task_id)
    if not t:
        raise HTTPException(404, "Maintenance task not found")
    timeline = json.loads(t.timeline_json)
    if payload.status:
        t.status = payload.status
        timeline.append({"stage": payload.status, "timestamp": datetime.datetime.utcnow().isoformat()})
        if payload.status == "RESOLVED" and t.alert_id:
            alert = db.query(m.Alert).get(t.alert_id)
            if alert:
                alert.status = "RESOLVED"
    if payload.officer_id:
        t.officer_id = payload.officer_id
        if t.status == "OPEN":
            t.status = "ASSIGNED"
            timeline.append({"stage": "ASSIGNED", "timestamp": datetime.datetime.utcnow().isoformat()})
    t.timeline_json = json.dumps(timeline)
    db.commit()
    return {"id": t.id, "status": t.status}


# ---------------------------------------------------------------- REPAIR VERIFICATION
@app.post("/api/repair/verify")
def verify_repair(task_id: int, db: Session = Depends(get_db)):
    task = db.query(m.MaintenanceTask).get(task_id)
    if not task:
        raise HTTPException(404, "Maintenance task not found")
    passed = random.random() < 0.8
    rv = m.RepairVerification(
        maintenance_task_id=task.id,
        verifying_bus_id=random.choice([b.bus_id for b in db.query(m.Bus).all()]),
        before_state=f"{task.issue} detected, severity {task.severity}",
        after_state="No defect detected" if passed else f"{task.issue} still present",
        result="PASSED" if passed else "FAILED",
    )
    db.add(rv)
    if passed:
        task.status = "RESOLVED"
        if task.road_segment_id:
            seg = db.query(m.RoadSegment).get(task.road_segment_id)
            if seg:
                seg.road_health_score = min(100, seg.road_health_score + 25)
                seg.status = "Resolved"
                seg.trend = "IMPROVING"
    else:
        task.status = "VERIFICATION_REQUIRED"
    db.commit()
    return {"result": rv.result, "task_status": task.status}


@app.get("/api/repair-verifications")
def list_repair_verifications(db: Session = Depends(get_db)):
    rvs = db.query(m.RepairVerification).order_by(m.RepairVerification.verified_at.desc()).all()
    out = []
    for rv in rvs:
        task = db.query(m.MaintenanceTask).get(rv.maintenance_task_id)
        out.append({
            "id": rv.id, "task_id": rv.maintenance_task_id,
            "issue": task.issue if task else "", "location_name": task.location_name if task else "",
            "verifying_bus_id": rv.verifying_bus_id, "before_state": rv.before_state,
            "after_state": rv.after_state, "result": rv.result, "verified_at": rv.verified_at,
        })
    return out


# ---------------------------------------------------------------- ANALYTICS
@app.get("/api/analytics")
def analytics(db: Session = Depends(get_db)):
    total_buses = db.query(m.Bus).count()
    total_road_issues = db.query(m.RoadSegment).count()
    total_traffic_obs = db.query(m.TrafficObservation).count()
    total_alerts = db.query(m.Alert).count()
    critical = db.query(m.Alert).filter_by(severity="CRITICAL").count()
    reports = db.query(m.Report).count()
    resolved = db.query(m.Alert).filter_by(status="RESOLVED").count()
    verified = db.query(m.RepairVerification).filter_by(result="PASSED").count()

    sev_dist = {}
    for sev in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        sev_dist[sev] = db.query(m.Alert).filter_by(severity=sev).count()

    issue_dist = {}
    for row in db.query(m.RoadSegment.primary_issue, func.count(m.RoadSegment.id)).group_by(m.RoadSegment.primary_issue).all():
        issue_dist[row[0]] = row[1]

    hourly = db.query(m.TrafficObservation.hour, func.avg(m.TrafficObservation.avg_speed)).group_by(m.TrafficObservation.hour).order_by(m.TrafficObservation.hour).all()
    speed_by_hour = [{"hour": h, "avg_speed": round(v, 1)} for h, v in hourly]

    top_locations = db.query(m.RoadSegment.name, m.RoadSegment.frequency).order_by(m.RoadSegment.frequency.desc()).limit(6).all()

    return {
        "totals": {
            "total_buses": total_buses, "total_road_issues": total_road_issues,
            "total_traffic_observations": total_traffic_obs, "total_alerts": total_alerts,
            "critical_incidents": critical, "reports_generated": reports,
            "issues_resolved": resolved, "repairs_verified": verified,
        },
        "severity_distribution": sev_dist,
        "issue_distribution": issue_dist,
        "avg_speed_by_hour": speed_by_hour,
        "top_problem_locations": [{"name": n, "frequency": f} for n, f in top_locations],
    }


@app.get("/api/traffic-analytics")
def traffic_analytics(route: str = "", db: Session = Depends(get_db)):
    q = db.query(m.TrafficObservation)
    if route:
        q = q.filter_by(route_code=route)
    obs = q.all()
    by_hour = {}
    for o in obs:
        by_hour.setdefault(o.hour, {"cars": 0, "buses": 0, "motorcycles": 0, "trucks": 0, "pedestrians": 0, "speeds": []})
        by_hour[o.hour]["cars"] += o.cars
        by_hour[o.hour]["buses"] += o.buses
        by_hour[o.hour]["motorcycles"] += o.motorcycles
        by_hour[o.hour]["trucks"] += o.trucks
        by_hour[o.hour]["pedestrians"] += o.pedestrians
        by_hour[o.hour]["speeds"].append(o.avg_speed)
    hourly = []
    for hour in sorted(by_hour.keys()):
        d = by_hour[hour]
        total_vehicles = d["cars"] + d["buses"] + d["motorcycles"] + d["trucks"]
        hourly.append({
            "hour": hour, "vehicles": total_vehicles,
            "avg_speed": round(sum(d["speeds"]) / len(d["speeds"]), 1) if d["speeds"] else 0,
            "pedestrians": d["pedestrians"],
        })
    by_route = {}
    for o in db.query(m.TrafficObservation).all():
        by_route.setdefault(o.route_code, []).append(o)
    density_by_route = []
    for code, items in by_route.items():
        avg_speed = sum(i.avg_speed for i in items) / len(items)
        density_by_route.append({"route": code, "avg_speed": round(avg_speed, 1),
                                  "congestion": "HIGH" if avg_speed < 22 else ("MODERATE" if avg_speed < 32 else "LOW")})
    return {"hourly": hourly, "density_by_route": density_by_route}


# ---------------------------------------------------------------- NOTIFICATIONS
@app.get("/api/notifications")
def list_notifications(db: Session = Depends(get_db)):
    notifs = db.query(m.Notification).order_by(m.Notification.created_at.desc()).limit(20).all()
    return [{"id": n.id, "level": n.level, "message": n.message, "link": n.link,
             "read": n.read, "created_at": n.created_at} for n in notifs]


@app.post("/api/notifications/{notif_id}/read")
def read_notification(notif_id: int, db: Session = Depends(get_db)):
    n = db.query(m.Notification).get(notif_id)
    if n:
        n.read = True
        db.commit()
    return {"ok": True}


# ---------------------------------------------------------------- SEARCH
@app.get("/api/search")
def search(q: str = "", db: Session = Depends(get_db)):
    if not q:
        return {"buses": [], "alerts": [], "reports": [], "roads": []}
    buses = db.query(m.Bus).filter(m.Bus.bus_id.ilike(f"%{q}%")).all()
    alerts = db.query(m.Alert).filter(
        (m.Alert.alert_code.ilike(f"%{q}%")) | (m.Alert.location_name.ilike(f"%{q}%")) |
        (m.Alert.detection_type.ilike(f"%{q}%")) | (m.Alert.bus_id.ilike(f"%{q}%"))
    ).limit(10).all()
    reports = db.query(m.Report).filter(m.Report.report_code.ilike(f"%{q}%")).limit(10).all()
    roads = db.query(m.RoadSegment).filter(m.RoadSegment.name.ilike(f"%{q}%")).limit(10).all()
    return {
        "buses": [bus_to_dict(b) for b in buses],
        "alerts": [alert_to_dict(a) for a in alerts],
        "reports": [{"id": r.id, "report_code": r.report_code} for r in reports],
        "roads": [{"id": r.id, "name": r.name} for r in roads],
    }


# ---------------------------------------------------------------- DEMO MODE
@app.get("/api/demo/state")
def demo_state():
    return demo_engine.get_demo_state()


@app.post("/api/demo/start")
def demo_start(db: Session = Depends(get_db)):
    return demo_engine.advance_demo(db)


@app.post("/api/demo/reset")
def demo_reset(db: Session = Depends(get_db)):
    return demo_engine.reset_demo(db)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "URBAN-EYE AI backend"}
