from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether, PageBreak
from reportlab.lib.units import cm
from datetime import datetime
import uuid, os

# Corporate Color Palette
NAVY    = colors.HexColor("#0f172a") # Slate 900
DARK    = colors.HexColor("#1e293b") # Slate 800
RED     = colors.HexColor("#e11d48") # Rose 600
ORANGE  = colors.HexColor("#f97316") # Orange 500
YELLOW  = colors.HexColor("#eab308") # Yellow 500
GREEN   = colors.HexColor("#10b981") # Emerald 500
GRAY    = colors.HexColor("#64748b") # Slate 500
LIGHT   = colors.HexColor("#f1f5f9") # Slate 100
WHITE   = colors.white

def sev_color(s):
    return {"CRITICAL": RED, "HIGH": ORANGE, "MEDIUM": YELLOW, "LOW": GREEN}.get(s, GREEN)

def sev_bg(s):
    return {
        "CRITICAL": colors.HexColor("#ffe4e6"), # Rose 100
        "HIGH":     colors.HexColor("#ffedd5"), # Orange 100
        "MEDIUM":   colors.HexColor("#fef9c3"), # Yellow 100
        "LOW":      colors.HexColor("#d1fae5"), # Emerald 100
    }.get(s, WHITE)

def draw_cover(canvas, doc):
    canvas.saveState()
    # Dark Navy Cover
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, A4[0], A4[1], fill=True, stroke=False)
    
    # Red accent line
    canvas.setFillColor(RED)
    canvas.rect(0, A4[1] - 8*cm, 1.2*cm, 10*cm, fill=True, stroke=False)
    
    # Text
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 38)
    canvas.drawString(3*cm, A4[1] - 10*cm, "SECURITY")
    canvas.drawString(3*cm, A4[1] - 11.5*cm, "ASSESSMENT REPORT")
    
    canvas.setFont("Helvetica-Bold", 14)
    canvas.setFillColor(RED)
    canvas.drawString(3*cm, A4[1] - 13*cm, "STRICTLY CONFIDENTIAL")
    
    canvas.setFont("Helvetica", 12)
    canvas.setFillColor(GRAY)
    canvas.drawString(3*cm, 6*cm, "Prepared by:")
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 14)
    canvas.drawString(3*cm, 5.3*cm, "PentaScope Security Team")
    
    canvas.setFont("Helvetica", 12)
    canvas.setFillColor(GRAY)
    canvas.drawString(3*cm, 4*cm, f"Date: {datetime.now().strftime('%B %d, %Y')}")
    canvas.restoreState()

def draw_header_footer(canvas, doc):
    canvas.saveState()
    # Header
    canvas.setFont("Helvetica-Bold", 10)
    canvas.setFillColor(NAVY)
    canvas.drawString(2*cm, A4[1] - 1.5*cm, "PentaScope")
    canvas.setFont("Helvetica", 10)
    canvas.setFillColor(GRAY)
    canvas.drawRightString(A4[0] - 2*cm, A4[1] - 1.5*cm, "Security Assessment Report")
    
    canvas.setStrokeColor(LIGHT)
    canvas.line(2*cm, A4[1] - 1.8*cm, A4[0] - 2*cm, A4[1] - 1.8*cm)
    
    # Footer
    canvas.setFont("Helvetica-Bold", 9)
    canvas.setFillColor(RED)
    canvas.drawString(2*cm, 1.5*cm, "STRICTLY CONFIDENTIAL")
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(GRAY)
    canvas.drawRightString(A4[0] - 2*cm, 1.5*cm, f"Page {doc.page}")
    canvas.restoreState()

def generate_report(target: str, recon_data: dict, vuln_data: dict, output_path: str = None) -> str:
    if output_path is None:
        os.makedirs("reports", exist_ok=True)
        output_path = f"reports/report_{uuid.uuid4().hex}.pdf"
    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2.5*cm, bottomMargin=2.5*cm)
    styles = getSampleStyleSheet()
    story  = []

    h1   = ParagraphStyle("h1",   fontSize=16, textColor=NAVY, fontName="Helvetica-Bold", spaceAfter=12, spaceBefore=24)
    h2   = ParagraphStyle("h2",   fontSize=12, textColor=DARK, fontName="Helvetica-Bold", spaceAfter=8,  spaceBefore=16)
    body = ParagraphStyle("body", fontSize=10, textColor=colors.black, spaceAfter=8,  leading=15, fontName="Helvetica")
    code = ParagraphStyle("code", fontSize=9,  textColor=RED, fontName="Courier", spaceAfter=8, leading=12)

    W = A4[0] - 4*cm  # content width

    # The cover is handled by onFirstPage, so we start with a PageBreak
    story.append(PageBreak())

    # ── INFO TABLE ─────────────────────────────────────────────
    all_vulns = vuln_data.get("vulnerabilities",[]) + vuln_data.get("missing_headers",[])
    critical  = sum(1 for v in all_vulns if v.get("severity")=="CRITICAL")
    high      = sum(1 for v in all_vulns if v.get("severity")=="HIGH")
    medium    = sum(1 for v in all_vulns if v.get("severity")=="MEDIUM")
    low       = sum(1 for v in all_vulns if v.get("severity")=="LOW")
    risk      = "CRITICAL" if critical>0 else "HIGH" if high>0 else "MEDIUM" if medium>0 else "LOW"
    risk_col  = sev_color(risk)

    story.append(Paragraph("Assessment Overview", h1))
    
    info = [
        ["Target Application", target],
        ["Date of Testing",    datetime.now().strftime("%Y-%m-%d")],
        ["Methodology",        "OWASP Top 10, PTES Standard"],
        ["Tool Framework",     "PentaScope v1.0 Enterprise"],
        ["Overall Risk Level", risk],
    ]
    t = Table(info, colWidths=[4.5*cm, W - 4.5*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(0,-1), LIGHT),
        ("TEXTCOLOR",(0,0),(0,-1), DARK),
        ("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),
        ("FONTNAME",(1,0),(1,-1),"Helvetica"),
        ("FONTSIZE",(0,0),(-1,-1), 10),
        ("BACKGROUND",(1,4),(1,4), sev_bg(risk)),
        ("TEXTCOLOR",(1,4),(1,4), risk_col),
        ("FONTNAME",(1,4),(1,4),"Helvetica-Bold"),
        ("GRID",(0,0),(-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ("PADDING",(0,0),(-1,-1), 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5*cm))

    # ── EXECUTIVE SUMMARY ──────────────────────────────────────
    story.append(Paragraph("1. Executive Summary", h1))
    story.append(Paragraph(
        f"A comprehensive security assessment was performed against <b>{target}</b>. "
        f"The objective of this assessment was to identify security vulnerabilities, misconfigurations, and architectural weaknesses "
        f"that could be exploited by malicious actors.", body))
    
    story.append(Paragraph(
        f"The assessment identified a total of <b>{len(all_vulns)} security findings</b>. "
        f"The overall risk level for this application has been rated as <b><font color='{risk_col}'>{risk}</font></b>.", body))

    # Severity summary table
    sev_data = [
        [Paragraph("<b>Severity</b>",ParagraphStyle("sh",fontSize=10,fontName="Helvetica-Bold",textColor=WHITE)),
         Paragraph("<b>Issues</b>",  ParagraphStyle("sh",fontSize=10,fontName="Helvetica-Bold",textColor=WHITE)),
         Paragraph("<b>CVSS Range</b>",   ParagraphStyle("sh",fontSize=10,fontName="Helvetica-Bold",textColor=WHITE)),
         Paragraph("<b>Action Required</b>", ParagraphStyle("sh",fontSize=10,fontName="Helvetica-Bold",textColor=WHITE))],
        ["CRITICAL", str(critical), "9.0 – 10.0", "Immediate resolution required"],
        ["HIGH",     str(high),     "7.0 – 8.9",  "Resolve within 7 days"],
        ["MEDIUM",   str(medium),   "4.0 – 6.9",  "Resolve within 30 days"],
        ["LOW",      str(low),      "0.1 – 3.9",  "Resolve within 90 days"],
    ]
    st = Table(sev_data, colWidths=[3.5*cm, 2.5*cm, 3.5*cm, W - 9.5*cm])
    st.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0), NAVY),
        ("BACKGROUND",(0,1),(-1,1), sev_bg("CRITICAL")),
        ("BACKGROUND",(0,2),(-1,2), sev_bg("HIGH")),
        ("BACKGROUND",(0,3),(-1,3), sev_bg("MEDIUM")),
        ("BACKGROUND",(0,4),(-1,4), sev_bg("LOW")),
        ("TEXTCOLOR",(0,1),(0,1), RED),
        ("TEXTCOLOR",(0,2),(0,2), ORANGE),
        ("TEXTCOLOR",(0,3),(0,3), YELLOW),
        ("TEXTCOLOR",(0,4),(0,4), GREEN),
        ("FONTNAME",(0,1),(0,-1),"Helvetica-Bold"),
        ("FONTSIZE",(0,0),(-1,-1), 10),
        ("GRID",(0,0),(-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ("PADDING",(0,0),(-1,-1), 10),
        ("ALIGN",(1,0),(1,-1),"CENTER"),
    ]))
    story.append(Spacer(1, 0.3*cm))
    story.append(st)
    story.append(Spacer(1, 0.5*cm))

    # ── RECON ──────────────────────────────────────────────────
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("2. Reconnaissance & Topology", h1))

    ports = recon_data.get("ports", [])
    if ports:
        pd = [["Port", "Service", "State", "Version Identification"]]
        for p in ports:
            pd.append([str(p.get("port","")), p.get("service","").upper(), p.get("state","").upper(), p.get("version","") or "Unknown"])
        pt = Table(pd, colWidths=[2.5*cm, 3.5*cm, 2.5*cm, W - 8.5*cm])
        pt.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,0), NAVY),
            ("TEXTCOLOR",(0,0),(-1,0), WHITE),
            ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
            ("ROWBACKGROUNDS",(0,1),(-1,-1),[LIGHT, WHITE]),
            ("GRID",(0,0),(-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ("FONTSIZE",(0,0),(-1,-1), 10),
            ("PADDING",(0,0),(-1,-1), 10),
            ("TEXTCOLOR",(2,1),(2,-1), GREEN),
            ("FONTNAME",(0,1),(0,-1),"Helvetica-Bold"),
        ]))
        story.append(pt)
    else:
        story.append(Paragraph("No open ports or services were detected during the external network scan.", body))
    story.append(Spacer(1, 0.5*cm))

    # ── VULNERABILITY FINDINGS ─────────────────────────────────
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("3. Technical Findings", h1))

    if not all_vulns:
        story.append(Paragraph("No vulnerabilities were identified during this assessment. The target appears to follow security best practices for the areas tested.", body))
    else:
        sorted_vulns = sorted(all_vulns, key=lambda v: v.get("cvss",0), reverse=True)
        for i, v in enumerate(sorted_vulns, 1):
            sev  = v.get("severity","LOW")
            col  = sev_color(sev)
            bg   = sev_bg(sev)
            rows = [
                ["Finding ID",     f"FIN-{i:03d}"],
                ["Vulnerability",  v.get('type','N/A')],
                ["Severity Risk",  sev],
                ["CVSS v3.1 Score",str(v.get("cvss","N/A"))],
                ["Description",    Paragraph(v.get("description", v.get("header","N/A")), body)],
                ["Remediation",    Paragraph(v.get("remediation","Apply security best practices."), body)],
            ]
            if v.get("param"):
                rows.insert(4, ["Affected Input", v.get("param")])
            if v.get("payload"):
                rows.append(["PoC Payload", Paragraph(v.get("payload"), code)])

            vt = Table(rows, colWidths=[3.5*cm, W - 3.5*cm])
            vt.setStyle(TableStyle([
                ("BACKGROUND",(0,0),(-1,0), NAVY),
                ("TEXTCOLOR",(0,0),(-1,0), WHITE),
                ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
                ("FONTSIZE",(0,0),(-1,0), 10),
                
                ("BACKGROUND",(0,1),(0,-1), LIGHT),
                ("FONTNAME",(0,1),(0,-1),"Helvetica-Bold"),
                ("TEXTCOLOR",(0,1),(0,-1), DARK),
                
                ("FONTSIZE",(0,0),(-1,-1), 10),
                
                # Severity coloring
                ("BACKGROUND",(1,2),(1,2), bg),
                ("TEXTCOLOR",(1,2),(1,2), col),
                ("FONTNAME",(1,2),(1,2),"Helvetica-Bold"),
                
                ("GRID",(0,0),(-1,-1), 0.5, colors.HexColor("#cbd5e1")),
                ("PADDING",(0,0),(-1,-1), 10),
                ("VALIGN",(0,0),(-1,-1),"TOP"),
            ]))
            story.append(KeepTogether([vt, Spacer(1, 0.8*cm)]))

    # ── RECOMMENDATIONS ────────────────────────────────────────
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("4. Strategic Recommendations", h1))
    story.append(Paragraph("To improve the overall security posture, we recommend implementing the following strategic controls:", body))
    
    recs = [
        "<b>Input Validation:</b> Implement strict server-side validation and parameterization for all user-supplied data.",
        "<b>Security Headers:</b> Enforce strict HTTP security headers (HSTS, CSP, X-Frame-Options) across all application responses.",
        "<b>Access Controls:</b> Regularly review and enforce Principle of Least Privilege (PoLP) on all internal and external endpoints.",
        "<b>Continuous Monitoring:</b> Establish a regular penetration testing schedule (minimum yearly) and integrate SAST/DAST tools into the CI/CD pipeline.",
        "<b>Patch Management:</b> Ensure all underlying frameworks, libraries, and server daemons are updated to their latest secure versions.",
    ]
    for r in recs:
        story.append(Paragraph(f"• {r}", body))

    doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_header_footer)
    print(f"[+] Report saved: {output_path}")
    return output_path

if __name__ == "__main__":
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
    recon  = {"ports": [{"port":22,"service":"ssh","state":"open","version":"OpenSSH 8.9"},
                         {"port":80,"service":"http","state":"open","version":"Apache 2.4"}]}
    vulns  = {"vulnerabilities": [
        {"type":"SQL Injection","severity":"CRITICAL","cvss":9.8,"param":"id",
         "description":"SQLi in 'id' parameter","remediation":"Use prepared statements.","payload":"' OR 1=1--"},
        {"type":"Cross-Site Scripting","severity":"HIGH","cvss":7.2,"param":"q",
         "description":"Reflected XSS in 'q'","remediation":"Encode output + CSP.","payload":"<script>alert(1)</script>"},
    ], "missing_headers": [
        {"type":"Missing Security Header","header":"X-Frame-Options","severity":"MEDIUM","cvss":5.3,
         "description":"Clickjacking possible","remediation":"Add X-Frame-Options: DENY"},
    ]}
    generate_report(target, recon, vulns)