# URBAN-EYE AI
### AI-Powered Mobile Urban Intelligence Platform Using Public Transport Fleet
**Team Fade-Out — Smart India Hackathon 2026**

> Public transport buses are not just vehicles. They become moving urban
> intelligence units — detecting road hazards, then closing the loop all
> the way to verified repair.
>
> **DETECT → VERIFY → REPORT → ALERT → ACTION → TRACK → RE-VERIFY**

All data in this prototype is **Demo / Simulated Data**, clearly labelled
throughout the UI. AI detection uses a clearly-isolated simulation layer
built so a real YOLO/OpenCV model can be swapped in without touching any
router or frontend code (see "Where real AI replaces simulated AI" below).

---

## 1. Project structure

```
urban-eye-ai/
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI app + all API endpoints
│   │   ├── models.py          SQLAlchemy tables
│   │   ├── schemas.py         Pydantic request/response models
│   │   ├── database.py        Engine/session config (SQLite)
│   │   ├── seed.py            Demo data seeding
│   │   ├── ai_engine.py       Simulated AI inference layer (swap point for real YOLO)
│   │   ├── pdf_generator.py   ReportLab PDF report generation
│   │   └── demo_engine.py     Scripted end-to-end "Live Demo" state machine
│   ├── static/                Generated sample evidence frames
│   ├── generated_reports/     PDF reports land here (created at runtime)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/             19 pages (Login → Settings)
│   │   ├── components/        Layout, MapView, shared UI primitives
│   │   ├── api.ts             API service layer
│   │   └── types.ts           Shared TypeScript types
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## 2. Setup & startup

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
The database (`urban_eye.db`), sample evidence frames, and demo data are
created and seeded **automatically on first run** — no separate seed step
required. To force a fresh reseed, stop the server and delete
`backend/urban_eye.db`.

API docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 — the dev server proxies `/api` and
`/sample-frames` to the backend on port 8000 (see `vite.config.ts`), so no
manual CORS/base-URL setup is needed.

### Demo login
```
Username: admin
Password: admin123
```

---

## 3. Demo flow instructions

1. Log in with the demo credentials above.
2. **Dashboard** — see live KPI cards, the GIS map, and recent alerts.
3. **Fleet Monitoring → BUS-104 → VIEW LIVE AI MONITORING** — watch simulated
   detections stream in every few seconds; use CAPTURE EVENT and GENERATE
   ALERT to manually trigger the pipeline.
4. **Alert Details** — GENERATE REPORT, ASSIGN OFFICER, VIEW ON MAP, MARK AS
   VERIFIED all call the real backend and persist to SQLite.
5. **Maintenance / Action Tracking / Repair Verification** — walk a task
   from OPEN through the full closed-loop timeline to a verified repair.
6. **Settings → SIH Demo Mode** — click **START LIVE DEMO** to auto-play the
   entire centerpiece workflow for BUS-104 end-to-end (pothole → alert →
   PDF report → officer → resolved → next-bus verification → road health
   improves). Click **RESET DEMO** to replay it for judges as many times as
   needed.

### The centerpiece demo sequence (for SIH judges)
```
BUS-104 → Camera → AI detects pothole → Bounding box → Confidence 94%
→ GPS + timestamp captured → Alert generated (severity HIGH)
→ Evidence captured → Automatic PDF generated → Officer selected by zone
→ Report sent → Officer acknowledges → Maintenance started
→ Issue marked resolved → Next bus passes → AI re-checks same location
→ Repair verified → Road health score improves
```

---

## 4. Where real AI can replace simulated AI

All simulated inference is isolated in **`backend/app/ai_engine.py`** behind
a single conceptual entry point (`random_detection()` / `random_traffic_counts()`).
To go from prototype to production:

1. Load a real YOLO-family model (e.g. via `ultralytics`) and OpenCV frame
   capture in `ai_engine.py`.
2. Replace `random_detection()`'s body with real inference: run the model on
   a captured frame, map class names to the existing `label`/`category`/
   `severity` fields, and return the same dict shape the rest of the app
   already expects.
3. Everything downstream — alert creation, severity routing, PDF generation,
   maintenance workflow, repair verification — is untouched, because it
   only depends on that dict shape, not on how it was produced.
4. Swap the placeholder JPEG evidence frames in `backend/static/` for real
   captured frames / video segments from `backend/app/main.py`'s
   `/api/live/{bus_id}` and `/capture` endpoints.
5. Registration-plate OCR (`VehicleTrack.ocr_plate`) is similarly a stand-in
   for a real ANPR/OCR service — replace the seed/demo value with a real OCR
   call and keep the "requires human verification" labeling in the UI.

---

## 5. Implemented features

- Full closed-loop workflow: Detect → Verify → Report → Alert → Action → Track → Re-verify
- Dashboard with live KPIs, GIS map, recent alerts
- Fleet Monitoring with search/filter/sort + Bus Details
- Live AI Monitoring with simulated bounding-box detection, capture, and alert generation
- Alert Center + Alert Details with vehicle tracking / OCR (human-verification labelled)
- GIS Intelligence Map with togglable layers and category filters
- Road Intelligence + Road Memory (per-segment multi-trip history & trend)
- Invisible Danger Zones (telemetry-inferred hidden hazards)
- Rain/Waterlogging risk-zone memory
- Predictive Risk scoring (explainable, frequency-based — not a black-box claim)
- Road Health Score (0–100, clearly labelled AI-derived prototype score)
- Maintenance Management (Open/Assigned/In Progress/Resolved/Verification Required)
- Automatic PDF report generation (ReportLab) with QR code, zone-based officer routing
- Officer Action Tracking timeline (Detected → ... → Resolved)
- Repair Verification (before/after AI re-check, auto-reopens failed repairs)
- Multi-bus verification & duplicate-alert grouping (observed-by-buses on alerts/segments)
- Notification Center (critical/warning/resolved/info)
- Global search (bus, alert, route, location)
- SIH Demo Mode — scripted, repeatable, one-click end-to-end walkthrough
- Traffic Analytics & system-wide Analytics dashboards (Recharts)

---

## 6. API endpoints

```
POST /api/auth/login
GET  /api/dashboard

GET  /api/buses
GET  /api/buses/{bus_id}
GET  /api/live/{bus_id}
POST /api/live/{bus_id}/capture
POST /api/live/{bus_id}/generate-alert

GET  /api/alerts
GET  /api/alerts/{alert_id}
POST /api/alerts
POST /api/alerts/{alert_id}/assign-officer
POST /api/alerts/{alert_id}/verify

GET  /api/roads
GET  /api/roads/{road_id}
GET  /api/hazard-zones
GET  /api/rain-zones
GET  /api/predictive-risk

GET  /api/reports
POST /api/reports/generate
GET  /api/reports/{report_id}/download
POST /api/reports/send

GET  /api/officers

GET  /api/maintenance
PUT  /api/maintenance/{task_id}

POST /api/repair/verify
GET  /api/repair-verifications

GET  /api/analytics
GET  /api/traffic-analytics

GET  /api/notifications
POST /api/notifications/{notif_id}/read

GET  /api/search

GET  /api/demo/state
POST /api/demo/start
POST /api/demo/reset

GET  /api/health
```

---

## 7. Database schema (SQLite via SQLAlchemy)

`users`, `officers`, `routes`, `buses`, `detections`, `traffic_observations`,
`vehicle_tracks`, `road_segments`, `hazard_zones`, `rain_risk_zones`,
`alerts`, `reports`, `maintenance_tasks`, `repair_verifications`,
`notifications`.

Key relationships: `buses.route_id → routes`, `alerts.bus_id → buses`,
`alerts.road_segment_id → road_segments`, `alerts.officer_id → officers`,
`maintenance_tasks.alert_id → alerts`, `repair_verifications.maintenance_task_id
→ maintenance_tasks`, `reports.alert_id → alerts`. Full column definitions
are in `backend/app/models.py`.

---

## 8. Notes on scope

- The 12 buses / 11 routes / 24 alerts / 14 road segments / 6 hidden-hazard
  zones / 5 rain-risk zones seeded on first run comfortably exceed the
  demo-data minimums in the brief and are clearly labelled as simulated.
- "Road Memory" is implemented as the per-segment trip history and trend
  view inside **Road Intelligence → [segment]**, rather than as a separate
  top-level nav item, since that is where the memory is actually anchored
  to a specific road.
- Bus-to-bus safety alerts and duplicate-alert grouping are represented via
  each alert/segment's `observed_by_buses` list (visible on Alert Details
  and Road Details) rather than a separate simulated push-notification UI.
