import io
import os
import html
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, HRFlowable
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT

def generate_invoice_pdf(
    invoice_number: str,
    issue_date: str,
    due_date: str,
    client_name: str,
    org_name: str,
    line_items: list,
    subtotal: float,
    tax_rate: float,
    tax_amount: float,
    total: float,
    notes: str = None,
    status: str = "draft"
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm
    )

    styles = getSampleStyleSheet()
    elements = []

    # Color Palette
    PRIMARY = colors.HexColor("#0f172a")     # Slate 900
    ACCENT = colors.HexColor("#0284c7")      # Cyan 600
    ACCENT_LIGHT = colors.HexColor("#f0f9ff")# Cyan 50
    TEXT_DARK = colors.HexColor("#1e293b")   # Slate 800
    TEXT_MUTED = colors.HexColor("#64748b")  # Slate 500
    BORDER_COLOR = colors.HexColor("#e2e8f0")# Slate 200
    GOLD = colors.HexColor("#d97706")        # Amber 600

    # Typography Styles
    style_org_title = ParagraphStyle('OrgTitle', fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=PRIMARY)
    style_org_sub = ParagraphStyle('OrgSub', fontName='Helvetica', fontSize=9, leading=12, textColor=TEXT_MUTED)
    style_inv_header = ParagraphStyle('InvHeader', fontName='Helvetica-Bold', fontSize=22, leading=26, alignment=TA_RIGHT, textColor=ACCENT)
    style_meta_label = ParagraphStyle('MetaLabel', fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=TEXT_MUTED)
    style_meta_val = ParagraphStyle('MetaVal', fontName='Helvetica', fontSize=9, leading=12, textColor=TEXT_DARK)
    style_section_title = ParagraphStyle('SecTitle', fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=PRIMARY)
    style_body = ParagraphStyle('BodyTextCustom', fontName='Helvetica', fontSize=9, leading=12, textColor=TEXT_DARK)
    style_small = ParagraphStyle('SmallCustom', fontName='Helvetica', fontSize=8, leading=10, textColor=TEXT_MUTED)
    style_right = ParagraphStyle('RightCustom', parent=style_body, alignment=TA_RIGHT)

    # Assets Path
    assets_dir = Path(__file__).parent / "assets"
    logo_path = assets_dir / "forgeflow_logo.png"
    stamp_path = assets_dir / "approval_stamp.png"
    sig_path = assets_dir / "executive_signature.png"

    # --- 1. HEADER SECTION (Logo/Org on Left, Invoice Details on Right) ---
    escaped_org = html.escape(org_name or "ForgeFlow Enterprise Technologies")
    escaped_inv_num = html.escape(invoice_number)
    
    org_cell_contents = []
    if logo_path.exists():
        try:
            logo_img = Image(str(logo_path), width=45 * mm, height=18 * mm)
            logo_img.hAlign = 'LEFT'
            org_cell_contents.append(logo_img)
            org_cell_contents.append(Spacer(1, 2 * mm))
        except Exception:
            pass

    org_cell_contents.extend([
        Paragraph(f"<b>{escaped_org}</b>", style_org_title),
        Paragraph("Enterprise IT & Managed Services Division", style_org_sub),
        Paragraph("100 Innovation Parkway, Suite 400 • San Francisco, CA 94105", style_org_sub),
        Paragraph("Tax ID / EIN: 94-3829104 • billing@forgeflow.com", style_org_sub)
    ])

    status_str = status.upper()
    status_colors_map = {
        'DRAFT': '#64748b',
        'SENT': '#0284c7',
        'PAID': '#16a34a',
        'OVERDUE': '#dc2626',
        'CANCELLED': '#94a3b8'
    }
    status_hex = status_colors_map.get(status_str, '#64748b')

    meta_cell_contents = [
        Paragraph("TAX INVOICE", style_inv_header),
        Spacer(1, 2 * mm),
        Paragraph(f"Invoice No: <b>{escaped_inv_num}</b>", ParagraphStyle('R1', parent=style_right, fontSize=10)),
        Paragraph(f"Issue Date: <b>{html.escape(issue_date)}</b>", style_right),
        Paragraph(f"Due Date: <b>{html.escape(due_date)}</b>", style_right),
        Spacer(1, 1 * mm),
        Paragraph(f"Status: <font color=\"{status_hex}\"><b>{status_str}</b></font>", style_right)
    ]

    header_table = Table([[org_cell_contents, meta_cell_contents]], colWidths=[doc.width * 0.55, doc.width * 0.45])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 4 * mm))

    # Gradient Accented Divider Line
    elements.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceBefore=2*mm, spaceAfter=5*mm))

    # --- 2. BILLING PARTY INFORMATION (Vendor vs Client) ---
    escaped_client = html.escape(client_name or "Direct Client")
    
    bill_by_cell = [
        Paragraph("<b>ISSUED BY:</b>", style_section_title),
        Spacer(1, 1 * mm),
        Paragraph(f"<b>{escaped_org}</b>", style_body),
        Paragraph("Global Accounts Department", style_small),
        Paragraph("contact@forgeflow.com | +1 (800) 555-FORGE", style_small)
    ]

    bill_to_cell = [
        Paragraph("<b>BILLED TO (CLIENT):</b>", style_section_title),
        Spacer(1, 1 * mm),
        Paragraph(f"<b>{escaped_client}</b>", style_body),
        Paragraph("Corporate Client Account", style_small),
        Paragraph("Payment Terms: Net 30 Days", style_small)
    ]

    party_table = Table([[bill_by_cell, bill_to_cell]], colWidths=[doc.width * 0.5, doc.width * 0.5])
    party_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), ACCENT_LIGHT),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (0, 0), 0.5, BORDER_COLOR),
        ('BOX', (1, 0), (1, 0), 0.5, BORDER_COLOR),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(party_table)
    elements.append(Spacer(1, 6 * mm))

    # --- 3. LINE ITEMS TABLE ---
    table_header = [
        Paragraph("<b>#</b>", ParagraphStyle('THC', parent=style_body, textColor=colors.white, alignment=TA_CENTER)),
        Paragraph("<b>Description & Services</b>", ParagraphStyle('THL', parent=style_body, textColor=colors.white)),
        Paragraph("<b>Qty</b>", ParagraphStyle('THC2', parent=style_body, textColor=colors.white, alignment=TA_CENTER)),
        Paragraph("<b>Unit Price</b>", ParagraphStyle('THR', parent=style_body, textColor=colors.white, alignment=TA_RIGHT)),
        Paragraph("<b>Amount</b>", ParagraphStyle('THR2', parent=style_body, textColor=colors.white, alignment=TA_RIGHT))
    ]

    items_data = [table_header]
    for idx, item in enumerate(line_items, 1):
        desc = html.escape(str(item.get('description', 'Service Item')))
        qty = item.get('quantity', 1)
        price = item.get('unit_price', 0)
        amt = item.get('amount', qty * price)
        items_data.append([
            Paragraph(str(idx), ParagraphStyle('TDC', parent=style_body, alignment=TA_CENTER)),
            Paragraph(desc, style_body),
            Paragraph(f"{qty:.1f}", ParagraphStyle('TDC2', parent=style_body, alignment=TA_CENTER)),
            Paragraph(f"${price:,.2f}", style_right),
            Paragraph(f"<b>${amt:,.2f}</b>", style_right)
        ])

    col_widths = [doc.width * 0.06, doc.width * 0.50, doc.width * 0.10, doc.width * 0.17, doc.width * 0.17]
    items_table = Table(items_data, colWidths=col_widths)
    
    t_style = [
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
    ]

    # Zebra striping for alternating rows
    for i in range(1, len(items_data)):
        if i % 2 == 0:
            t_style.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor("#f8fafc")))

    items_table.setStyle(TableStyle(t_style))
    elements.append(items_table)
    elements.append(Spacer(1, 4 * mm))

    # --- 4. TOTALS & SUMMARY BLOCK ---
    totals_data = [
        ["", Paragraph("Subtotal:", style_right), Paragraph(f"${subtotal:,.2f}", style_right)],
        ["", Paragraph(f"Tax ({tax_rate}%):", style_right), Paragraph(f"${tax_amount:,.2f}", style_right)],
        ["", Paragraph("<b>Total Amount Due:</b>", ParagraphStyle('TotLbl', parent=style_right, fontSize=11, textColor=PRIMARY)), Paragraph(f"<b>${total:,.2f}</b>", ParagraphStyle('TotVal', parent=style_right, fontSize=12, textColor=ACCENT))]
    ]
    
    totals_table = Table(totals_data, colWidths=[doc.width * 0.5, doc.width * 0.25, doc.width * 0.25])
    totals_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (1, 2), (2, 2), ACCENT_LIGHT),
        ('BOX', (1, 2), (2, 2), 1, ACCENT),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 6 * mm))

    # --- 5. DIGITAL SIGNATURE & OFFICIAL APPROVAL STAMP (NEW) ---
    left_stamp_cell = []
    if stamp_path.exists():
        try:
            stamp_img = Image(str(stamp_path), width=32 * mm, height=32 * mm)
            stamp_img.hAlign = 'CENTER'
            left_stamp_cell.append(stamp_img)
            left_stamp_cell.append(Spacer(1, 1 * mm))
        except Exception:
            pass
    left_stamp_cell.append(Paragraph("<b>OFFICIAL CORPORATE SEAL</b>", ParagraphStyle('SLabel', parent=style_small, alignment=TA_CENTER)))
    left_stamp_cell.append(Paragraph("Digitally Verified & Approved", ParagraphStyle('SSub', parent=style_small, alignment=TA_CENTER, textColor=ACCENT)))

    right_sig_cell = []
    if sig_path.exists():
        try:
            sig_img = Image(str(sig_path), width=45 * mm, height=18 * mm)
            sig_img.hAlign = 'CENTER'
            right_sig_cell.append(sig_img)
            right_sig_cell.append(Spacer(1, 1 * mm))
        except Exception:
            pass
    
    right_sig_cell.extend([
        HRFlowable(width="80%", thickness=1, color=PRIMARY, spaceBefore=1*mm, spaceAfter=1*mm),
        Paragraph("<b>Eleanor S. Montgomery</b>", ParagraphStyle('SigName', parent=style_body, alignment=TA_CENTER)),
        Paragraph("Chief Financial Officer & Head of Billing", ParagraphStyle('SigTitle', parent=style_small, alignment=TA_CENTER)),
        Paragraph("Cryptographic Signature Hash: <code>0x8f3c...e912</code>", ParagraphStyle('SigHash', parent=style_small, alignment=TA_CENTER, fontSize=7))
    ])

    approval_table = Table([[left_stamp_cell, right_sig_cell]], colWidths=[doc.width * 0.45, doc.width * 0.55])
    approval_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fafafa")),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(approval_table)
    elements.append(Spacer(1, 6 * mm))

    # --- 6. NOTES & TERMS SECTION ---
    if notes:
        elements.append(Paragraph("<b>Payment Notes & Instructions:</b>", style_section_title))
        escaped_notes = html.escape(notes).replace('\n', '<br/>')
        elements.append(Paragraph(escaped_notes, style_body))
        elements.append(Spacer(1, 4 * mm))

    elements.append(Paragraph("<b>Standard Terms:</b> Payment is due within 30 days of issuance. Late payments are subject to a 1.5% monthly service charge.", style_small))
    elements.append(Spacer(1, 4 * mm))

    # --- 7. FOOTER WATERMARK ---
    elements.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=2*mm, spaceAfter=2*mm))
    elements.append(Paragraph(f"Generated by ForgeFlow Enterprise Billing System • Reference: {escaped_inv_num} • Page 1 of 1", ParagraphStyle('Footer', parent=style_small, alignment=TA_CENTER)))

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes