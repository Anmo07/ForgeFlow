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

    # Color Palette matching ForgeFlow Daylight Theme
    PRIMARY_DARK = colors.HexColor("#0f172a")    # Dark text / headers
    TEXT_MUTED = colors.HexColor("#475569")      # Muted text
    BORDER_COLOR = colors.HexColor("#cbd5e1")    # Border slate-300
    BG_LIGHT_CARD = colors.HexColor("#ffffff")   # Card background
    BG_TABLE_HDR = colors.HexColor("#f1f5f9")    # Table header gray background
    HIGHLIGHT_BG = colors.HexColor("#dbe2fe")    # Soft indigo highlight box for Total Amount Due
    HIGHLIGHT_TEXT = colors.HexColor("#1e1b4b")  # Dark indigo text
    LOGO_BLUE = colors.HexColor("#4f46e5")       # Brand purple/blue accent

    # Typography Styles
    style_logo_text = ParagraphStyle('LogoText', fontName='Helvetica-Bold', fontSize=20, leading=24, textColor=LOGO_BLUE)
    style_org_name = ParagraphStyle('OrgName', fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=PRIMARY_DARK)
    style_org_info = ParagraphStyle('OrgInfo', fontName='Helvetica', fontSize=8.5, leading=12, textColor=PRIMARY_DARK)

    style_tax_inv = ParagraphStyle('TaxInvoiceTitle', fontName='Helvetica-Bold', fontSize=18, leading=22, alignment=TA_RIGHT, textColor=PRIMARY_DARK)
    style_meta_right = ParagraphStyle('MetaRight', fontName='Helvetica', fontSize=8.5, leading=13, alignment=TA_RIGHT, textColor=PRIMARY_DARK)
    style_meta_bold = ParagraphStyle('MetaRightBold', fontName='Helvetica-Bold', fontSize=8.5, leading=13, alignment=TA_RIGHT, textColor=PRIMARY_DARK)

    style_card_hdr = ParagraphStyle('CardHdr', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=PRIMARY_DARK)
    style_card_body = ParagraphStyle('CardBody', fontName='Helvetica', fontSize=8.5, leading=12, textColor=PRIMARY_DARK)

    style_th_left = ParagraphStyle('THL', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=PRIMARY_DARK)
    style_th_center = ParagraphStyle('THC', fontName='Helvetica-Bold', fontSize=8.5, leading=11, alignment=TA_CENTER, textColor=PRIMARY_DARK)
    style_th_right = ParagraphStyle('THR', fontName='Helvetica-Bold', fontSize=8.5, leading=11, alignment=TA_RIGHT, textColor=PRIMARY_DARK)

    style_td_left = ParagraphStyle('TDL', fontName='Helvetica', fontSize=8.5, leading=12, textColor=PRIMARY_DARK)
    style_td_center = ParagraphStyle('TDC', fontName='Helvetica', fontSize=8.5, leading=12, alignment=TA_CENTER, textColor=PRIMARY_DARK)
    style_td_right = ParagraphStyle('TDR', fontName='Helvetica', fontSize=8.5, leading=12, alignment=TA_RIGHT, textColor=PRIMARY_DARK)

    style_notes_hdr = ParagraphStyle('NotesHdr', fontName='Helvetica-Bold', fontSize=9, leading=13, textColor=PRIMARY_DARK)
    style_notes_body = ParagraphStyle('NotesBody', fontName='Helvetica', fontSize=8, leading=11, textColor=PRIMARY_DARK)
    style_footer = ParagraphStyle('FooterText', fontName='Helvetica', fontSize=7.5, leading=10, alignment=TA_CENTER, textColor=TEXT_MUTED)

    # Assets Path
    assets_dir = Path(__file__).parent / "assets"
    logo_path = assets_dir / "forgeflow_logo.png"
    stamp_path = assets_dir / "approval_stamp.png"
    sig_path = assets_dir / "executive_signature.png"

    # --- 1. HEADER SECTION ---
    escaped_org = html.escape(org_name or "Acme Digital Agency")
    escaped_inv_num = html.escape(invoice_number)

    left_header = []
    if logo_path.exists():
        try:
            logo_img = Image(str(logo_path), width=38 * mm, height=12 * mm)
            logo_img.hAlign = 'LEFT'
            left_header.append(logo_img)
            left_header.append(Spacer(1, 1.5 * mm))
        except Exception:
            left_header.append(Paragraph("<b>FORGEFLOW</b>", style_logo_text))
    else:
        left_header.append(Paragraph("<b>FORGEFLOW</b>", style_logo_text))

    left_header.extend([
        Paragraph(f"<b>{escaped_org}</b>", style_org_name),
        Paragraph("ForgeFlow.com", style_org_info),
        Paragraph("kenw.digitalagency.com", style_org_info),
        Paragraph("info@resflow.com", style_org_info)
    ])

    status_upper = (status or "DRAFT").upper()
    right_header = [
        Paragraph("TAX INVOICE", style_tax_inv),
        Spacer(1, 1.5 * mm),
        Paragraph(f"Invoice No: <b>{escaped_inv_num}</b>", style_meta_right),
        Paragraph(f"Issue Date: <b>{html.escape(issue_date)}</b>", style_meta_right),
        Paragraph(f"Due Date: <b>{html.escape(due_date)}</b>", style_meta_right),
        Paragraph(f"Status: <b>{status_upper}</b>", style_meta_right)
    ]

    header_table = Table([[left_header, right_header]], colWidths=[doc.width * 0.55, doc.width * 0.45])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 5 * mm))

    # --- 2. ISSUED BY / BILLED TO CARDS ---
    escaped_client = html.escape(client_name or "Acme Digital")

    issued_by_content = [
        Paragraph("<b>ISSUED BY</b>", style_card_hdr),
        Spacer(1, 1 * mm),
        Paragraph("<b>ForgeFlow</b>", style_card_body),
        Paragraph(f"{escaped_org}", style_card_body),
        Paragraph("Forgeflow.com", style_card_body)
    ]

    billed_to_content = [
        Paragraph("<b>BILLED TO (CLIENT)</b>", style_card_hdr),
        Spacer(1, 1 * mm),
        Paragraph(f"<b>{escaped_client}</b>", style_card_body),
        Paragraph("Acme Digital Agency", style_card_body),
        Paragraph("Etrent incontined", style_card_body)
    ]

    party_table = Table([[issued_by_content, billed_to_content]], colWidths=[doc.width * 0.48, doc.width * 0.48])
    party_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ffffff")),
        ('BOX', (0, 0), (0, 0), 0.5, BORDER_COLOR),
        ('BOX', (1, 0), (1, 0), 0.5, BORDER_COLOR),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(party_table)
    elements.append(Spacer(1, 6 * mm))

    # --- 3. LINE ITEMS TABLE ---
    headers = [
        Paragraph("<b>Line Item</b>", style_th_left),
        Paragraph("<b>Qty</b>", style_th_center),
        Paragraph("<b>Price</b>", style_th_right),
        Paragraph("<b>Amount</b>", style_th_right)
    ]
    items_data = [headers]

    for item in line_items:
        desc = html.escape(str(item.get('description', 'Service Item')))
        qty = item.get('quantity', 1)
        price = item.get('unit_price', 0)
        amt = item.get('amount', qty * price)
        items_data.append([
            Paragraph(desc, style_td_left),
            Paragraph(f"{qty:.1f}", style_td_center),
            Paragraph(f"${price:,.2f}", style_td_right),
            Paragraph(f"${amt:,.2f}", style_td_right)
        ])

    col_widths = [doc.width * 0.52, doc.width * 0.14, doc.width * 0.17, doc.width * 0.17]
    items_table = Table(items_data, colWidths=col_widths)
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_TABLE_HDR),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 4 * mm))

    # --- 4. TOTALS SECTION ---
    totals_data = [
        ["", Paragraph("Subtotal", style_td_right), Paragraph(f"${subtotal:,.2f}", style_td_right)],
        ["", Paragraph(f"Tax ({tax_rate}%)", style_td_right), Paragraph(f"${tax_amount:,.2f}", style_td_right)],
        [
            "",
            Paragraph("<b>Total Amount Due</b>", ParagraphStyle('TotLbl', parent=style_td_right, fontSize=9.5, textColor=HIGHLIGHT_TEXT)),
            Paragraph(f"<b>${total:,.2f}</b>", ParagraphStyle('TotVal', parent=style_td_right, fontSize=10.5, textColor=HIGHLIGHT_TEXT))
        ]
    ]

    totals_table = Table(totals_data, colWidths=[doc.width * 0.45, doc.width * 0.30, doc.width * 0.25])
    totals_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('BACKGROUND', (1, 2), (2, 2), HIGHLIGHT_BG),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 8 * mm))

    # --- 5. SEAL & SIGNATURE BLOCK ---
    left_seal = []
    if stamp_path.exists():
        try:
            seal_img = Image(str(stamp_path), width=28 * mm, height=28 * mm)
            seal_img.hAlign = 'CENTER'
            left_seal.append(seal_img)
            left_seal.append(Spacer(1, 1 * mm))
        except Exception:
            pass
    left_seal.append(Paragraph("<b>Seal</b>", ParagraphStyle('SealLbl', parent=style_td_center, fontSize=8)))

    right_sig = []
    if sig_path.exists():
        try:
            sig_img = Image(str(sig_path), width=40 * mm, height=14 * mm)
            sig_img.hAlign = 'CENTER'
            right_sig.append(sig_img)
            right_sig.append(Spacer(1, 1 * mm))
        except Exception:
            right_sig.append(Paragraph("<i>Eleanor S. Montgomery</i>", ParagraphStyle('SigScript', fontName='Helvetica-Oblique', fontSize=14, alignment=TA_CENTER)))
    else:
        right_sig.append(Paragraph("<i>Eleanor S. Montgomery</i>", ParagraphStyle('SigScript', fontName='Helvetica-Oblique', fontSize=14, alignment=TA_CENTER)))

    right_sig.append(Paragraph("Eleanor S. Montgomery", ParagraphStyle('SigName', fontName='Helvetica-Bold', fontSize=8.5, alignment=TA_CENTER)))
    right_sig.append(Paragraph("Signature", ParagraphStyle('SigLbl', parent=style_td_center, fontSize=8, textColor=TEXT_MUTED)))

    seal_sig_table = Table([[left_seal, right_sig]], colWidths=[doc.width * 0.45, doc.width * 0.55])
    seal_sig_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(seal_sig_table)
    elements.append(Spacer(1, 6 * mm))

    # --- 6. PAYMENT NOTES & INSTRUCTIONS ---
    notes_text = notes or "This invoice is ceans comneted with te received and througns the ofmariroctor.\nPayment Notes & Instructions: Died the sead,"
    elements.append(Paragraph("<b>Payment Notes & Instructions:</b>", style_notes_hdr))
    escaped_notes = html.escape(notes_text).replace('\n', '<br/>')
    elements.append(Paragraph(escaped_notes, style_notes_body))
    elements.append(Spacer(1, 3 * mm))

    elements.append(Paragraph("Standard terms are clearly set out. Slean roms is continued in instruction approaching payments tunaked suminating pay sunt the seconds.", style_notes_body))
    elements.append(Spacer(1, 5 * mm))

    # --- 7. FOOTER BAR ---
    elements.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=1*mm, spaceAfter=3*mm))
    elements.append(Paragraph(f"Generated by ForgeFlow Enterprise Billing System • Reference: {escaped_inv_num} • Page 1 of 1", style_footer))

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes