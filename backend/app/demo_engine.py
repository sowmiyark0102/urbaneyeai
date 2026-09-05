"""
Drives the scripted centerpiece demo flow for SIH judges:
BUS-104 -> AI detects pothole -> alert -> report -> officer -> resolved -> re-verified.

`get_demo_state()` returns the current step (0-11) and a human-readable log.
`advance_demo()` moves the state forward by one step and returns it.
`reset_demo()` resets to step 0.

This is in-memory (single-process) which is sufficient for a live demo.
"""
import datetime
import json
from sqlalchemy.orm import Session
from . import models as m
from .pdf_generator import generate_report_pdf

STEPS = [
    "Bus starts moving on map",
    "Video stream active",
    "Vehicle detection running",
    "Pothole detected (bounding box)",
    "GPS + timestamp captured",
    "Alert generated (severity HIGH)",
    "Evidence frame captured",
    "PDF report generated",
    "Officer notified (routed to zone)",
    "Officer acknowledged / maintenance started",
    "Issue marked resolved",
    "Next bus verifies repair — Road Health improves",
]

_state = {
    "step": 0,
    "alert_id": None,
    "report_id": None,
    "task_id": None,
    "log": [],
}


def get_demo_state():
    return {"step": _state["step"], "total_steps": len(STEPS), "steps": STEPS, "log": _state["log"],
            "alert_id": _state["alert_id"], "report_id": _state["report_id"]}


def reset_demo(db: Session):
    global _state
    _state = {"step": 0, "alert_id": None, "report_id": None, "task_id": None, "log": []}
    return get_demo_state()


def _log(msg):
    _state["log"].append({"time": datetime.datetime.utcnow().strftime("%H:%M:%S"), "message": msg})


def advance_demo(db: Session):
    step = _state["step"]
    if step >= len(STEPS):
        return get_demo_state()

    bus = db.query(m.Bus).filter_by(bus_id="BUS-104").first()
    label = STEPS[step]
    _log(label)

    if step == 5:  # Alert generated
        alert = m.Alert(
            alert_code=f"ALT-DEMO-{int(datetime.datetime.utcnow().timestamp())}",
            bus_id="BUS-104", route_code=bus.route.code if bus else "27B",
            detection_type="Pothole", confidence=0.94, severity="HIGH",
            lat=13.0850, lng=80.2101, location_name="Anna Nagar",
            camera="Front Camera", evidence_frame="/sample-frames/pothole_1.jpg",
            status="NEW", ai_explanation="Depression in road surface identified via edge/depth analysis. AI Flagged.",
            is_vehicle_incident=False, observed_by_buses="BUS-104",
            created_at=datetime.datetime.utcnow(),
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        _state["alert_id"] = alert.id

    if step == 7:  # PDF generated
        alert = db.query(m.Alert).get(_state["alert_id"])
        report_code = f"RPT-DEMO-{alert.id}"
        path = generate_report_pdf({
            "bus_id": alert.bus_id, "route_code": alert.route_code, "camera": alert.camera,
            "date": alert.created_at.strftime("%d %B %Y"), "time": alert.created_at.strftime("%I:%M:%S %p"),
            "location_name": alert.location_name, "lat": alert.lat, "lng": alert.lng,
            "detection_type": alert.detection_type, "confidence": alert.confidence,
            "severity": alert.severity, "ai_explanation": alert.ai_explanation,
        }, report_code)
        report = m.Report(report_code=report_code, alert_id=alert.id, file_path=path,
                           generated_at=datetime.datetime.utcnow(), sent=False, zone="North Chennai")
        db.add(report)
        db.commit()
        db.refresh(report)
        _state["report_id"] = report.id

    if step == 8:  # Officer notified
        officer = db.query(m.Officer).filter_by(zone="North Chennai").first()
        alert = db.query(m.Alert).get(_state["alert_id"])
        alert.officer_id = officer.id if officer else None
        alert.status = "ACKNOWLEDGED"
        report = db.query(m.Report).get(_state["report_id"])
        if report:
            report.sent = True
            report.sent_to_officer_id = officer.id if officer else None
        task = m.MaintenanceTask(
            alert_id=alert.id, issue=alert.detection_type, location_name=alert.location_name,
            severity=alert.severity, officer_id=officer.id if officer else None,
            detected_date=alert.created_at, due_date=alert.created_at + datetime.timedelta(days=2),
            status="ASSIGNED", timeline_json=json.dumps([
                {"stage": "DETECTED", "timestamp": alert.created_at.isoformat()},
                {"stage": "REPORT_GENERATED", "timestamp": datetime.datetime.utcnow().isoformat()},
                {"stage": "REPORT_SENT", "timestamp": datetime.datetime.utcnow().isoformat()},
                {"stage": "OFFICER_ACKNOWLEDGED", "timestamp": datetime.datetime.utcnow().isoformat()},
            ]),
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        _state["task_id"] = task.id

    if step == 9:  # maintenance started
        task = db.query(m.MaintenanceTask).get(_state["task_id"])
        task.status = "IN_PROGRESS"
        timeline = json.loads(task.timeline_json)
        timeline.append({"stage": "INSPECTION", "timestamp": datetime.datetime.utcnow().isoformat()})
        timeline.append({"stage": "MAINTENANCE", "timestamp": datetime.datetime.utcnow().isoformat()})
        task.timeline_json = json.dumps(timeline)
        db.commit()

    if step == 10:  # resolved
        task = db.query(m.MaintenanceTask).get(_state["task_id"])
        task.status = "RESOLVED"
        timeline = json.loads(task.timeline_json)
        timeline.append({"stage": "RESOLVED", "timestamp": datetime.datetime.utcnow().isoformat()})
        task.timeline_json = json.dumps(timeline)
        alert = db.query(m.Alert).get(_state["alert_id"])
        alert.status = "RESOLVED"
        db.commit()

    if step == 11:  # repair verified
        task = db.query(m.MaintenanceTask).get(_state["task_id"])
        alert = db.query(m.Alert).get(_state["alert_id"])
        rv = m.RepairVerification(
            maintenance_task_id=task.id, verifying_bus_id="BUS-101",
            before_state="Pothole detected, severity HIGH", after_state="No pothole detected",
            result="PASSED", verified_at=datetime.datetime.utcnow(),
        )
        db.add(rv)
        alert.verified = True
        db.commit()

    _state["step"] += 1
    return get_demo_state()
