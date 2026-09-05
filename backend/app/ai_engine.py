"""
Simulated AI inference layer.

This module stands in for a real OpenCV + YOLO-style detection pipeline.
It is intentionally isolated behind the `run_inference()` function so a real
model can be dropped in later without touching any router or frontend code:

    def run_inference(frame) -> DetectionResult:
        # replace this body with real YOLO inference, e.g.:
        # results = yolo_model(frame)
        # return DetectionResult.from_yolo(results)
        ...

Everything below (`DETECTION_CATALOG`, `random_detection`, `random_traffic_counts`)
is clearly-labeled demo/simulation logic only.
"""
import random
import datetime

ROAD_LABELS = [
    "Pothole", "Cracked Road", "Damaged Road", "Missing Road Divider",
    "Missing Zebra Crossing", "Damaged Traffic Sign", "Missing Traffic Sign",
    "Road Debris", "Waterlogging", "Road Obstruction",
]

SAFETY_LABELS = [
    "Pedestrian Crossing Risk", "School-Zone Pedestrian Risk",
    "Potential Rash-Driving Event", "Potential Hit-and-Run Event",
    "Sudden Vehicle Maneuver",
]

SEVERITY_BY_LABEL = {
    "Pothole": "HIGH", "Cracked Road": "MEDIUM", "Damaged Road": "HIGH",
    "Missing Road Divider": "MEDIUM", "Missing Zebra Crossing": "MEDIUM",
    "Damaged Traffic Sign": "LOW", "Missing Traffic Sign": "LOW",
    "Road Debris": "MEDIUM", "Waterlogging": "HIGH", "Road Obstruction": "CRITICAL",
    "Pedestrian Crossing Risk": "HIGH", "School-Zone Pedestrian Risk": "CRITICAL",
    "Potential Rash-Driving Event": "CRITICAL", "Potential Hit-and-Run Event": "CRITICAL",
    "Sudden Vehicle Maneuver": "MEDIUM",
}

EXPLANATIONS = {
    "Pothole": "Depression in road surface identified via edge/depth analysis. AI Flagged — requires field verification.",
    "Waterlogging": "Standing water region identified through texture and reflectance analysis. AI Flagged.",
    "Road Obstruction": "Object detected in roadway with abnormal vehicle movement around it. Requires human verification.",
    "Potential Rash-Driving Event": "Abnormal acceleration/braking pattern detected. Potential Incident — requires human verification.",
    "Potential Hit-and-Run Event": "Vehicle contact pattern flagged followed by rapid departure. Potential Incident — requires human verification.",
}


def random_frame():
    frames = [
        "/sample-frames/pothole_1.jpg", "/sample-frames/pothole_2.jpg",
        "/sample-frames/waterlogging_1.jpg", "/sample-frames/obstruction_1.jpg",
        "/sample-frames/traffic_1.jpg",
    ]
    return random.choice(frames)


def random_detection(location_name="Anna Nagar", lat=13.0850, lng=80.2101):
    """Simulates a single detection event the way a YOLO pipeline would emit one."""
    label = random.choice(ROAD_LABELS + SAFETY_LABELS)
    category = "SAFETY" if label in SAFETY_LABELS else "ROAD"
    severity = SEVERITY_BY_LABEL.get(label, "MEDIUM")
    confidence = round(random.uniform(0.72, 0.98), 2)
    explanation = EXPLANATIONS.get(
        label, "Anomaly identified by onboard perception model. AI Flagged — requires human verification."
    )
    return {
        "label": label,
        "category": category,
        "severity": severity,
        "confidence": confidence,
        "location_name": location_name,
        "lat": lat + random.uniform(-0.002, 0.002),
        "lng": lng + random.uniform(-0.002, 0.002),
        "evidence_frame": random_frame(),
        "ai_explanation": explanation,
        "timestamp": datetime.datetime.utcnow(),
    }


def random_traffic_counts():
    return {
        "cars": random.randint(8, 30),
        "buses": random.randint(1, 6),
        "motorcycles": random.randint(5, 25),
        "trucks": random.randint(0, 8),
        "pedestrians": random.randint(2, 20),
    }
