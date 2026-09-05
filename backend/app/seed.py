"""
Seeds the SQLite database with realistic Chennai-themed demo data.
Run directly:  python -m app.seed
Also invoked automatically on server startup if the DB is empty.

All data here is explicitly Demo / Simulated Data for the SIH 2026 prototype.
"""
import datetime
import random
import json
from passlib.hash import bcrypt

from .database import Base, engine, SessionLocal
from . import models as m

random.seed(42)

CHENNAI_LOCATIONS = [
    ("Anna Nagar", 13.0850, 80.2101), ("T Nagar", 13.0418, 80.2341),
    ("Guindy", 13.0067, 80.2206), ("Adyar", 13.0012, 80.2565),
    ("Velachery", 12.9791, 80.2212), ("Mylapore", 13.0339, 80.2619),
    ("Anna Salai", 13.0604, 80.2496), ("Perambur", 13.1143, 80.2329),
    ("Tambaram", 12.9249, 80.1000), ("Porur", 13.0374, 80.1575),
    ("Egmore", 13.0732, 80.2609), ("Nungambakkam", 13.0569, 80.2425),
]

ROUTES = [
    ("27B", "Anna Nagar - Broadway", "North Chennai"),
    ("21G", "Guindy - Egmore", "Central Chennai"),
    ("70C", "Tambaram - T Nagar", "South Chennai"),
    ("18A", "Velachery - Parrys", "South Chennai"),
    ("5M", "Porur - Egmore", "West Chennai"),
    ("47B", "Adyar - Perambur", "Central Chennai"),
    ("102", "Mylapore - Anna Nagar", "North Chennai"),
    ("29C", "Nungambakkam - Tambaram", "South Chennai"),
    ("15X", "Anna Salai - Velachery", "Central Chennai"),
    ("33K", "Perambur - Porur", "West Chennai"),
    ("9J", "Egmore - Guindy", "Central Chennai"),
]

ROAD_ISSUE_LABELS = [
    "Pothole", "Cracked Road", "Damaged Road", "Waterlogging",
    "Road Debris", "Road Obstruction", "Missing Zebra Crossing", "Missing Traffic Sign",
]
SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def run_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(m.User).first():
            return  # already seeded
        _seed(db)
    finally:
        db.close()


def _seed(db):
    now = datetime.datetime.utcnow()

    # --- users ---
    db.add(m.User(username="admin", password_hash=bcrypt.hash("admin123"),
                  full_name="Control Room Operator", role="admin"))

    # --- officers ---
    zones = ["North Chennai", "South Chennai", "Central Chennai", "West Chennai"]
    officers = []
    officer_names = ["R. Kumar", "S. Priya", "A. Manikandan", "V. Lakshmi",
                      "K. Suresh", "N. Divya", "M. Ramesh", "P. Anitha"]
    for i, name in enumerate(officer_names):
        o = m.Officer(name=name, designation="Zone Maintenance Officer",
                       zone=zones[i % len(zones)], department="Road Maintenance",
                       phone=f"+91 98{random.randint(10000000,99999999)}", active_tasks=0)
        db.add(o)
        officers.append(o)
    db.flush()

    # --- routes ---
    route_objs = {}
    for code, name, zone in ROUTES:
        r = m.RouteModel(code=code, name=name, zone=zone)
        db.add(r)
        route_objs[code] = r
    db.flush()

    # --- buses (12) ---
    bus_ids = []
    route_codes = list(route_objs.keys())
    for i in range(101, 113):
        bus_id = f"BUS-{i}"
        route_code = route_codes[(i - 101) % len(route_codes)]
        loc = random.choice(CHENNAI_LOCATIONS)
        status = "ONLINE"
        if i in (104, 108):
            status = "ALERT"
        bus = m.Bus(
            bus_id=bus_id, route_id=route_objs[route_code].id,
            driver_status="Active", gps_status="GPS OK", camera_status="Camera OK",
            ai_status="AI ON", status=status,
            speed_kmh=round(random.uniform(18, 45), 1),
            lat=loc[1] + random.uniform(-0.01, 0.01), lng=loc[2] + random.uniform(-0.01, 0.01),
            last_sync=now - datetime.timedelta(minutes=random.randint(0, 4)),
            today_detections=random.randint(2, 14),
        )
        db.add(bus)
        bus_ids.append(bus_id)
    db.flush()

    # --- road segments (14) ---
    road_segments = []
    for idx in range(14):
        loc_name, lat, lng = CHENNAI_LOCATIONS[idx % len(CHENNAI_LOCATIONS)]
        freq = random.randint(2, 19)
        trend = random.choice(["WORSENING", "STABLE", "IMPROVING"])
        severity = random.choice(SEVERITIES)
        health = max(15, 100 - freq * 4 - (20 if severity in ("HIGH", "CRITICAL") else 0))
        seg = m.RoadSegment(
            name=f"{loc_name} Main Road", lat=lat + random.uniform(-0.005, 0.005),
            lng=lng + random.uniform(-0.005, 0.005),
            route_code=random.choice(route_codes),
            primary_issue=random.choice(ROAD_ISSUE_LABELS),
            severity=severity,
            first_detected=now - datetime.timedelta(days=random.randint(20, 60)),
            last_detected=now - datetime.timedelta(days=random.randint(0, 5)),
            frequency=freq, status=random.choice(["Open", "Assigned", "In Progress", "Resolved"]),
            trend=trend, road_health_score=health,
            observed_by_buses=",".join(random.sample(bus_ids, k=min(3, len(bus_ids)))),
        )
        db.add(seg)
        road_segments.append(seg)
    db.flush()

    # --- hazard zones (invisible danger, 6) ---
    for i in range(6):
        loc_name, lat, lng = random.choice(CHENNAI_LOCATIONS)
        db.add(m.HazardZone(
            location_name=f"{loc_name} Junction", lat=lat + random.uniform(-0.004, 0.004),
            lng=lng + random.uniform(-0.004, 0.004),
            observed_by_bus_count=random.randint(3, 9),
            avg_speed_reduction_pct=round(random.uniform(20, 55), 1),
            sudden_braking_events=random.randint(6, 22),
            risk_level=random.choice(["MEDIUM", "HIGH", "CRITICAL"]),
            status="Needs inspection",
        ))

    # --- rain risk zones (5) ---
    rain_spots = ["T Nagar", "Velachery", "Perambur", "Porur", "Mylapore"]
    for loc_name in rain_spots:
        base = next(l for l in CHENNAI_LOCATIONS if l[0] == loc_name)
        rain_events = random.randint(4, 12)
        waterlog = random.randint(2, rain_events)
        risk = "HIGH" if waterlog / rain_events > 0.6 else "MEDIUM"
        db.add(m.RainRiskZone(
            location_name=loc_name, lat=base[1], lng=base[2],
            rain_events=rain_events, waterlogging_events=waterlog, risk_level=risk,
            prediction=f"This location frequently develops waterlogging during heavy rain "
                       f"({waterlog} of {rain_events} recent rain events)."
        ))

    # --- alerts (24) + detections + maintenance + reports + vehicle tracks ---
    detection_labels_by_severity = {
        "CRITICAL": ["Road Obstruction", "Potential Rash-Driving Event", "School-Zone Pedestrian Risk"],
        "HIGH": ["Pothole", "Waterlogging", "Pedestrian Crossing Risk"],
        "MEDIUM": ["Cracked Road", "Missing Road Divider", "Road Debris"],
        "LOW": ["Damaged Traffic Sign", "Missing Traffic Sign"],
    }
    explanations = {
        "Pothole": "Depression in road surface identified via edge/depth analysis. AI Flagged.",
        "Waterlogging": "Standing water region identified through texture and reflectance analysis. AI Flagged.",
        "Road Obstruction": "Object detected in roadway with abnormal vehicle movement. Requires human verification.",
        "Potential Rash-Driving Event": "Abnormal acceleration/braking pattern detected. Potential Incident — requires human verification.",
        "School-Zone Pedestrian Risk": "Repeated close pedestrian-vehicle proximity near school zone. AI Flagged.",
        "Pedestrian Crossing Risk": "Pedestrians crossing outside marked zebra crossing detected repeatedly. AI Flagged.",
        "Cracked Road": "Surface crack pattern identified via texture analysis.",
        "Missing Road Divider": "Expected divider not detected across multiple passes.",
        "Road Debris": "Foreign object(s) identified on carriageway.",
        "Damaged Traffic Sign": "Sign geometry / reflectivity below expected threshold.",
        "Missing Traffic Sign": "Expected signage absent at this GPS marker across passes.",
    }

    alert_objs = []
    for i in range(24):
        severity = random.choices(SEVERITIES, weights=[3, 4, 3, 2])[0]
        label = random.choice(detection_labels_by_severity[severity])
        loc_name, lat, lng = random.choice(CHENNAI_LOCATIONS)
        bus_id = random.choice(bus_ids)
        route_code = db.query(m.Bus).filter_by(bus_id=bus_id).first().route.code
        created_at = now - datetime.timedelta(hours=random.randint(0, 96), minutes=random.randint(0, 59))
        status = random.choice(["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED"])
        is_vehicle = label in ("Potential Rash-Driving Event", "Potential Hit-and-Run Event")
        multi = random.random() < 0.35
        observed = [bus_id] + (random.sample([b for b in bus_ids if b != bus_id], k=2) if multi else [])
        alert = m.Alert(
            alert_code=f"ALT-{1000 + i}", bus_id=bus_id, route_code=route_code,
            detection_type=label, confidence=round(random.uniform(0.75, 0.98), 2),
            severity=severity, lat=lat + random.uniform(-0.003, 0.003), lng=lng + random.uniform(-0.003, 0.003),
            location_name=loc_name, camera="Front Camera",
            evidence_frame=f"/sample-frames/{'pothole_1' if 'Pothole' in label else 'road_generic'}.jpg",
            status=status, ai_explanation=explanations.get(label, "AI Flagged — requires human verification."),
            is_vehicle_incident=is_vehicle, observed_by_buses=",".join(observed),
            road_segment_id=random.choice(road_segments).id if random.random() < 0.6 else None,
            officer_id=random.choice(officers).id if status != "NEW" else None,
            verified=(status == "RESOLVED" and random.random() < 0.7),
            created_at=created_at,
        )
        db.add(alert)
        alert_objs.append(alert)
    db.flush()

    for alert in alert_objs:
        db.add(m.Detection(
            bus_id=alert.bus_id, category="SAFETY" if alert.is_vehicle_incident else "ROAD",
            label=alert.detection_type, confidence=alert.confidence, severity=alert.severity,
            lat=alert.lat, lng=alert.lng, location_name=alert.location_name,
            camera=alert.camera, evidence_frame=alert.evidence_frame,
            timestamp=alert.created_at, ai_explanation=alert.ai_explanation,
        ))
        if alert.is_vehicle_incident:
            t0 = alert.created_at
            db.add(m.VehicleTrack(
                track_id=f"TRK-{100+alert.id}", alert_id=alert.id,
                vehicle_type=random.choice(["Car", "Motorcycle", "Truck"]),
                direction=random.choice(["Northbound", "Southbound", "Eastbound", "Westbound"]),
                ocr_plate=f"TN {random.randint(10,99)} {random.choice('ABCDEFGH')}{random.choice('ABCDEFGH')} {random.randint(1000,9999)}",
                ocr_confidence=round(random.uniform(0.7, 0.95), 2),
                detected_at=t0, tracked_at=t0 + datetime.timedelta(seconds=1),
                plate_captured_at=t0 + datetime.timedelta(seconds=3),
                flagged_at=t0 + datetime.timedelta(seconds=7),
            ))

    # maintenance tasks for HIGH/CRITICAL alerts
    for alert in alert_objs:
        if alert.severity in ("HIGH", "CRITICAL"):
            stage_map = {
                "NEW": ["DETECTED", "REPORT_GENERATED"],
                "ACKNOWLEDGED": ["DETECTED", "REPORT_GENERATED", "REPORT_SENT", "OFFICER_ACKNOWLEDGED"],
                "IN_PROGRESS": ["DETECTED", "REPORT_GENERATED", "REPORT_SENT", "OFFICER_ACKNOWLEDGED", "INSPECTION", "MAINTENANCE"],
                "RESOLVED": ["DETECTED", "REPORT_GENERATED", "REPORT_SENT", "OFFICER_ACKNOWLEDGED", "INSPECTION", "MAINTENANCE", "RESOLVED"],
            }
            stages = stage_map.get(alert.status, ["DETECTED"])
            t0 = alert.created_at
            timeline = []
            for j, stage in enumerate(stages):
                timeline.append({"stage": stage, "timestamp": (t0 + datetime.timedelta(minutes=j * 25)).isoformat()})
            status_map = {"NEW": "OPEN", "ACKNOWLEDGED": "ASSIGNED", "IN_PROGRESS": "IN_PROGRESS", "RESOLVED": "RESOLVED"}
            task = m.MaintenanceTask(
                alert_id=alert.id, road_segment_id=alert.road_segment_id,
                issue=alert.detection_type, location_name=alert.location_name, severity=alert.severity,
                officer_id=alert.officer_id, detected_date=alert.created_at,
                due_date=alert.created_at + datetime.timedelta(days=3),
                status=status_map[alert.status], timeline_json=json.dumps(timeline),
            )
            db.add(task)
            db.flush()
            if alert.status == "RESOLVED":
                passed = random.random() < 0.75
                db.add(m.RepairVerification(
                    maintenance_task_id=task.id,
                    verifying_bus_id=random.choice(bus_ids),
                    before_state=f"{alert.detection_type} detected, severity {alert.severity}",
                    after_state="No defect detected" if passed else f"{alert.detection_type} still present",
                    result="PASSED" if passed else "FAILED",
                    verified_at=alert.created_at + datetime.timedelta(hours=6),
                ))
                if not passed:
                    task.status = "VERIFICATION_REQUIRED"

    # reports for HIGH/CRITICAL alerts
    from .pdf_generator import generate_report_pdf
    report_i = 0
    for alert in alert_objs:
        if alert.severity in ("HIGH", "CRITICAL") and report_i < 14:
            report_code = f"RPT-{2000 + report_i}"
            officer = random.choice(officers)
            try:
                path = generate_report_pdf({
                    "bus_id": alert.bus_id, "route_code": alert.route_code, "camera": alert.camera,
                    "date": alert.created_at.strftime("%d %B %Y"), "time": alert.created_at.strftime("%I:%M:%S %p"),
                    "location_name": alert.location_name, "lat": alert.lat, "lng": alert.lng,
                    "detection_type": alert.detection_type, "confidence": alert.confidence,
                    "severity": alert.severity, "ai_explanation": alert.ai_explanation,
                }, report_code)
            except Exception:
                path = ""
            db.add(m.Report(
                report_code=report_code, alert_id=alert.id, file_path=path,
                generated_at=alert.created_at + datetime.timedelta(minutes=1),
                sent=(alert.status != "NEW"), sent_to_officer_id=officer.id, zone=officer.zone,
            ))
            report_i += 1

    # notifications
    notif_samples = [
        ("CRITICAL", "Potential safety incident detected by BUS-104."),
        ("WARNING", "Waterlogging detected in T Nagar."),
        ("RESOLVED", "Road issue RD-1023 verified repaired."),
        ("WARNING", "Pothole cluster confirmed by 3 buses on Anna Salai."),
        ("CRITICAL", "Road obstruction flagged near Guindy — officer notified."),
        ("INFO", "Fleet connectivity nominal at 98.4%."),
    ]
    for level, msg in notif_samples:
        db.add(m.Notification(level=level, message=msg, created_at=now - datetime.timedelta(minutes=random.randint(1, 300))))

    # traffic observations (for analytics charts) — per route, per hour of day
    for route_code in route_codes:
        for hour in range(6, 22):
            base_congestion = "HIGH" if hour in (8, 9, 18, 19) else ("MODERATE" if hour in (10, 17, 20) else "LOW")
            db.add(m.TrafficObservation(
                route_code=route_code, hour=hour,
                cars=random.randint(10, 60), buses=random.randint(2, 10),
                motorcycles=random.randint(8, 45), trucks=random.randint(0, 12),
                pedestrians=random.randint(3, 40),
                avg_speed=round(random.uniform(14, 42), 1),
                congestion_level=base_congestion,
            ))

    db.commit()
