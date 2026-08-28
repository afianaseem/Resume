"""
Real Share Resume email delivery.

The recipient gets a real email with the resume PDF attached.
SMTP credentials are required; Gmail can be used with a free App Password.
The PDF is generated using the resume's selected template and optional profile
image so the emailed attachment matches the on-screen resume as closely as
possible.
"""
import io
import html
import base64
import re
import smtplib
import ssl
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable, Image, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
)

from .config import settings


def _date_range(item: Dict[str, Any]) -> str:
    start = item.get("start_date") or ""
    end = item.get("end_date") or ""
    if item.get("current") and not end:
        end = "Present"
    return " – ".join([p for p in (start, end) if p])


def _safe(text: Any) -> str:
    return html.escape(str(text or ""))


def _profile_image(data: str):
    if not data or not isinstance(data, str) or not data.startswith("data:image/"):
        return None
    try:
        raw = data.split(",", 1)[1]
        image_bytes = base64.b64decode(raw)
        image = Image(io.BytesIO(image_bytes), width=0.95*inch, height=0.95*inch)
        image.hAlign = "CENTER"
        return image
    except Exception:
        return None


def build_resume_pdf(resume: Dict[str, Any]) -> bytes:
    """Render the selected ResumeForge template to a PDF attachment."""
    pi = resume.get("personal_info") or {}
    education = resume.get("education") or []
    experience = resume.get("experience") or []
    skills = resume.get("skills") or []
    projects = resume.get("projects") or []
    template = resume.get("template") or "classic"

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=LETTER,
        leftMargin=0.62*inch, rightMargin=0.62*inch,
        topMargin=0.55*inch, bottomMargin=0.55*inch,
        title=resume.get("name") or "Resume",
    )
    styles = getSampleStyleSheet()
    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9.2, leading=12.5,
                          textColor=colors.HexColor("#1f2937"), spaceAfter=5)
    small = ParagraphStyle("Small", parent=styles["Normal"], fontSize=8.6, leading=11,
                           textColor=colors.HexColor("#6b7280"))
    heading = ParagraphStyle("Heading", parent=styles["Heading2"], fontSize=11.5, leading=14,
                             textColor=colors.HexColor("#111827"), spaceBefore=10, spaceAfter=5)
    title = ParagraphStyle("Title", parent=styles["Title"], fontSize=21, leading=24,
                           textColor=colors.HexColor("#111827"), spaceAfter=3)
    item = ParagraphStyle("Item", parent=styles["Normal"], fontSize=9.8, leading=12,
                          textColor=colors.HexColor("#111827"), spaceAfter=1)
    sidebar_text = ParagraphStyle("SidebarText", parent=small, fontSize=8.2,
                                  textColor=colors.HexColor("#f3f4f6"))
    palettes = {"violet": ("#6d3df5", "#5730d0", "#f0ebff"), "blue": ("#2563eb", "#1d4ed8", "#dbeafe"), "green": ("#059669", "#047857", "#d1fae5"), "rose": ("#e11d48", "#be123c", "#ffe4e6")}
    accent, accent_dark, accent_light = palettes.get(resume.get("color") or "violet", palettes["violet"])
    dark = accent_dark

    def sections(story):
        if pi.get("summary"):
            story += [Paragraph("PROFESSIONAL SUMMARY", heading), Paragraph(_safe(pi["summary"]), body)]
        if experience:
            story.append(Paragraph("EXPERIENCE", heading))
            for exp in experience:
                story.append(Paragraph(_safe(exp.get("role") or "Role") + (f" — {_safe(exp.get('company'))}" if exp.get("company") else ""), item))
                if _date_range(exp): story.append(Paragraph(_safe(_date_range(exp)), small))
                if exp.get("description"): story.append(Paragraph(_safe(exp["description"]), body))
        if education:
            story.append(Paragraph("EDUCATION", heading))
            for edu in education:
                degree = _safe(edu.get("degree") or "Degree")
                if edu.get("field"): degree += ", " + _safe(edu["field"])
                story.append(Paragraph(degree, item))
                sub = "  |  ".join([_safe(x) for x in (edu.get("school"), _date_range(edu)) if x])
                if sub: story.append(Paragraph(sub, small))
                if edu.get("grade"): story.append(Paragraph(_safe(edu["grade"]), body))
        if skills:
            story += [Paragraph("SKILLS", heading), Paragraph(_safe(", ".join(map(str, skills))), body)]
        if projects:
            story.append(Paragraph("PROJECTS", heading))
            for proj in projects:
                story.append(Paragraph(_safe(proj.get("title") or "Project"), item))
                sub = "  |  ".join([_safe(x) for x in (proj.get("tech_stack"), proj.get("link")) if x])
                if sub: story.append(Paragraph(sub, small))
                if proj.get("description"): story.append(Paragraph(_safe(proj["description"]), body))

    full_name = _safe(pi.get("full_name") or "Your Name")
    contacts = "  |  ".join(_safe(x) for x in (pi.get("email"), pi.get("phone"), pi.get("address")) if x)
    image = _profile_image(pi.get("profile_image", ""))

    story = []
    if template == "sidebar":
        left = []
        if image: left.append(image)
        left += [Paragraph(full_name, ParagraphStyle("SideName", parent=sidebar_text, fontSize=13, leading=16, alignment=TA_CENTER, textColor=colors.white))]
        if contacts:
            left += [Spacer(1, 8), Paragraph("CONTACT", ParagraphStyle("SideHead", parent=sidebar_text, fontSize=8.5, leading=10, textColor=colors.white)),
                     Paragraph(contacts.replace("  |  ", "<br/>"), sidebar_text)]
        if skills:
            left += [Spacer(1, 10), Paragraph("SKILLS", ParagraphStyle("SideHead2", parent=sidebar_text, fontSize=8.5, leading=10, textColor=colors.white)),
                     Paragraph("<br/>".join(_safe(x) for x in skills), sidebar_text)]
        if education:
            left += [Spacer(1, 10), Paragraph("EDUCATION", ParagraphStyle("SideHead3", parent=sidebar_text, fontSize=8.5, leading=10, textColor=colors.white))]
            for edu in education:
                left.append(Paragraph(_safe(edu.get("degree") or "Degree"), sidebar_text))
                if edu.get("school"): left.append(Paragraph(_safe(edu["school"]), sidebar_text))
        right = []
        sections(right)
        table = Table([[left, right]], colWidths=[2.0*inch, 5.0*inch], hAlign="LEFT")
        table.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(0,0),dark), ("VALIGN",(0,0),(-1,-1),"TOP"),
            ("LEFTPADDING",(0,0),(0,0),15), ("RIGHTPADDING",(0,0),(0,0),15),
            ("TOPPADDING",(0,0),(-1,-1),14), ("BOTTOMPADDING",(0,0),(-1,-1),14),
            ("LEFTPADDING",(1,0),(1,0),20), ("RIGHTPADDING",(1,0),(1,0),5),
        ]))
        story.append(table)
    else:
        if template == "modern":
            if image:
                story.append(image)
            story += [Paragraph(full_name, title), Paragraph(contacts, small) if contacts else Spacer(1,1)]
            story.append(HRFlowable(width="100%", color=colors.HexColor(accent), thickness=3))
        elif template == "bold":
            header_data = [[image if image else "", Paragraph(full_name, ParagraphStyle("BoldName", parent=title, textColor=colors.white, fontSize=23))]]
            if contacts: header_data.append(["", Paragraph(contacts, ParagraphStyle("BoldContact", parent=small, textColor=colors.HexColor("#e5e7eb")))])
            ht = Table(header_data, colWidths=[1.05*inch, 5.95*inch])
            ht.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),colors.HexColor(dark)),
                                     ("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),10),
                                     ("TOPPADDING",(0,0),(-1,-1),10),("BOTTOMPADDING",(0,0),(-1,-1),10)]))
            story.append(ht)
        else:
            if template == "minimal":
                title.fontName = "Times-Bold"
            if image and template in ("modern", "bold"):
                story.append(image)
            story += [Paragraph(full_name, title), Paragraph(contacts, small) if contacts else Spacer(1,1),
                      HRFlowable(width="100%", color=colors.HexColor("#111827"), thickness=1)]
        sections(story)

    if not sections:
        story.append(Paragraph("This resume is currently empty.", body))
    doc.build(story)
    return buffer.getvalue()


def send_resume_email(to_email: str, resume: Dict[str, Any], sender_name: str = "", note: str = "", pdf_bytes: bytes | None = None) -> bool:
    resume_name = resume.get("name") or "My Resume"
    if pdf_bytes is None:
        pdf_bytes = build_resume_pdf(resume)
    subject = f"{sender_name + ' shared their' if sender_name else 'Your'} resume: {resume_name}"
    intro = note.strip() if note else (
        f"{sender_name} shared a resume with you via ResumeForge."
        if sender_name else "Here is the resume you requested from ResumeForge."
    )
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = to_email
    msg.attach(MIMEText(
        f'<div style="font-family:Arial,sans-serif;color:#1f2937"><p>{html.escape(intro)}</p>'
        f'<p>The resume <strong>{html.escape(resume_name)}</strong> is attached as a PDF.</p>'
        f'<p style="font-size:12px;color:#6b7280">Sent from ResumeForge.</p></div>',
        "html"
    ))
    attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
    safe_name = re.sub(r"[^A-Za-z0-9 _-]", "", resume_name).strip() or "resume"
    attachment.add_header("Content-Disposition", "attachment", filename=f"{safe_name}.pdf")
    msg.attach(attachment)

    if not settings.smtp_host or not settings.smtp_from_email:
        raise RuntimeError("Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD and SMTP_FROM_EMAIL in backend/.env.")

    context = ssl.create_default_context()
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        if settings.smtp_use_tls:
            server.starttls(context=context)
        if settings.smtp_user and settings.smtp_password:
            server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from_email, [to_email], msg.as_string())
    return True
