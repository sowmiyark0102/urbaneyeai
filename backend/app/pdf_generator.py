"""
Generates the URBAN-EYE AI Urban Incident & Road Maintenance Report as a PDF
using ReportLab. Called from the /api/reports/generate endpoint.
"""
import os
import io
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "generated_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

NAVY = colors.HexColor("#0F2A43")
STEEL = colors.HexColor("#3D5A73")
LINE = colors.HexColor("#D7DEE5")
RED = colors.HexColor("#C0392B")
ORANGE = colors.HexColor("#C9791C")


def _severity_color(sev):
    return {"CRITICAL": RED, "HIGH": ORANGE, "MEDIUM": STEEL, "LOW": colors.HexColor("#2E7D32")}.get(sev, STEEL)


def generate_report_pdf(alert: dict, report_code: str) -> str:
    """alert: dict with all fields needed for the report. Returns absolute file path."""
    file_path = os.path.join(REPORTS_DIR, f"{report_code}.pdf")
    doc = SimpleDocTemplate(
        file_path, pagesize=A4,
        topMargin=18 * mm, bottomMargin=18 * mm, leftMargin=18 * mm, rightMargin=18 * mm
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", parent=styles["Heading1"], textColor=NAVY, fontSize=18, spaceAfter=2)
    sub_style = ParagraphStyle("sub", parent=styles["Normal"], textColor=STEEL, fontSize=11, spaceAfter=14)
    label_style = ParagraphStyle("label", parent=styles["Normal"], textColor=STEEL, fontSize=9)
    body_style = ParagraphStyle("body", parent=styles["Normal"], textColor=NAVY, fontSize=11, leading=15)

    elements = []
    elements.append(Paragraph("URBAN-EYE AI", title_style))
    elements.append(Paragraph("URBAN INCIDENT &amp; ROAD MAINTENANCE REPORT", sub_style))

    # QR code with report id
    qr_img = qrcode.make(f"URBAN-EYE-AI:{report_code}")
    qr_buf = io.BytesIO()
    qr_img.save(qr_buf, format="PNG")
    qr_buf.seek(0)

    header_table_data = [
        [Paragraph(f"<b>Report ID:</b> {report_code}", body_style),
         Image(qr_buf, width=22 * mm, height=22 * mm)],
    ]
    header_table = Table(header_table_data, colWidths=[140 * mm, 22 * mm])
    header_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(header_table)
    elements.append(Spacer(1, 10 * mm))

    def row(label, value):
        return [Paragraph(f"<b>{label}</b>", label_style), Paragraph(str(value), body_style)]

    sev = alert.get("severity", "MEDIUM")
    data = [
        row("Bus ID", alert.get("bus_id", "-")),
        row("Route", alert.get("route_code", "-")),
        row("Camera", alert.get("camera", "Front Camera")),
        row("Date", alert.get("date", "-")),
        row("Time", alert.get("time", "-")),
        row("Location", alert.get("location_name", "-")),
        row("GPS Coordinates", f'{alert.get("lat", 0):.4f}, {alert.get("lng", 0):.4f}'),
        row("Detection Type", alert.get("detection_type", "-")),
        row("AI Confidence", f'{alert.get("confidence", 0) * 100:.0f}%'),
        row("Severity", sev),
        row("Description", alert.get("ai_explanation", "-")),
        row("Recommended Action", alert.get("recommended_action", "Immediate road inspection and maintenance assessment.")),
    ]
    t = Table(data, colWidths=[42 * mm, 120 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 6 * mm))

    sev_box = Table([[Paragraph(f"SEVERITY: {sev}", ParagraphStyle(
        "sevbox", parent=styles["Normal"], textColor=colors.white, fontSize=11, alignment=1
    ))]], colWidths=[162 * mm], rowHeights=[9 * mm])
    sev_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), _severity_color(sev)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(sev_box)
    elements.append(Spacer(1, 8 * mm))

    if alert.get("evidence_note"):
        elements.append(Paragraph(f"<b>Evidence:</b> {alert['evidence_note']}", body_style))
        elements.append(Spacer(1, 4 * mm))

    elements.append(Paragraph(
        "This report was generated automatically by URBAN-EYE AI from bus-mounted camera "
        "telemetry. Detection data is AI-generated and subject to human verification. "
        "Demo / Simulated Data — Smart India Hackathon 2026 prototype.",
        ParagraphStyle("footer", parent=styles["Normal"], textColor=STEEL, fontSize=8, spaceBefore=10)
    ))

    doc.build(elements)
    return file_path
