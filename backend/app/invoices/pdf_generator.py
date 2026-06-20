import io
import html
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_RIGHT, TA_CENTER

def generate_invoice_pdf(invoice_number: str, issue_date: str, due_date: str, client_name: str, org_name: str, line_items: list, subtotal: float, tax_rate: float, tax_amount: float, total: float, notes: str=None, status: str='draft') -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20 * mm, leftMargin=20 * mm, topMargin=20 * mm, bottomMargin=20 * mm)
    styles = getSampleStyleSheet()
    elements = []
    title_style = ParagraphStyle('InvoiceTitle', parent=styles['Title'], fontSize=28, textColor=colors.HexColor('#1a1a1a'), spaceAfter=4 * mm, fontName='Helvetica-Bold')
    heading_style = ParagraphStyle('SectionHeading', parent=styles['Heading2'], fontSize=11, textColor=colors.HexColor('#555555'), spaceAfter=2 * mm, fontName='Helvetica')
    body_style = ParagraphStyle('BodyText', parent=styles['BodyText'], fontSize=10, textColor=colors.HexColor('#333333'), fontName='Helvetica')
    right_style = ParagraphStyle('RightText', parent=body_style, alignment=TA_RIGHT)
    small_style = ParagraphStyle('SmallText', parent=body_style, fontSize=8, textColor=colors.HexColor('#888888'))
    escaped_org_name = html.escape(org_name)
    header_data = [[Paragraph(f'<b>{escaped_org_name}</b>', ParagraphStyle('OrgName', parent=body_style, fontSize=14, fontName='Helvetica-Bold')), Paragraph('<b>INVOICE</b>', ParagraphStyle('InvLabel', parent=body_style, fontSize=24, alignment=TA_RIGHT, textColor=colors.HexColor('#d4af37'), fontName='Helvetica-Bold'))]]
    header_table = Table(header_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
    header_table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0)]))
    elements.append(header_table)
    elements.append(Spacer(1, 8 * mm))
    status_label = status.upper()
    status_color = {'DRAFT': '#6b7280', 'SENT': '#3b82f6', 'PAID': '#10b981', 'OVERDUE': '#ef4444', 'CANCELLED': '#9ca3af'}.get(status_label, '#6b7280')
    escaped_client_name = html.escape(client_name) if client_name else '—'
    escaped_invoice_number = html.escape(invoice_number)
    meta_data = [[Paragraph('<b>Bill To:</b>', heading_style), Paragraph('<b>Invoice Details:</b>', heading_style)], [Paragraph(escaped_client_name, body_style), Paragraph(f'Invoice #: <b>{escaped_invoice_number}</b>', body_style)], [Paragraph('', body_style), Paragraph(f'Issue Date: {html.escape(issue_date)}', body_style)], [Paragraph('', body_style), Paragraph(f'Due Date: <b>{html.escape(due_date)}</b>', body_style)], [Paragraph('', body_style), Paragraph(f'Status: <font color="{status_color}"><b>{html.escape(status_label)}</b></font>', body_style)]]
    meta_table = Table(meta_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
    meta_table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 1), ('BOTTOMPADDING', (0, 0), (-1, -1), 1)]))
    elements.append(meta_table)
    elements.append(Spacer(1, 10 * mm))
    table_header = ['#', 'Description', 'Qty', 'Unit Price', 'Amount']
    table_data = [table_header]
    for idx, item in enumerate(line_items, 1):
        table_data.append([str(idx), item.get('description', ''), f"{item.get('quantity', 1):.1f}", f"${item.get('unit_price', 0):,.2f}", f"${item.get('amount', 0):,.2f}"])
    col_widths = [doc.width * 0.06, doc.width * 0.48, doc.width * 0.1, doc.width * 0.18, doc.width * 0.18]
    items_table = Table(table_data, colWidths=col_widths)
    items_table.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a1a')), ('TEXTCOLOR', (0, 0), (-1, 0), colors.white), ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('FONTSIZE', (0, 0), (-1, 0), 9), ('BOTTOMPADDING', (0, 0), (-1, 0), 8), ('TOPPADDING', (0, 0), (-1, 0), 8), ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'), ('FONTSIZE', (0, 1), (-1, -1), 9), ('BOTTOMPADDING', (0, 1), (-1, -1), 6), ('TOPPADDING', (0, 1), (-1, -1), 6), *[('BACKGROUND', (0, i), (-1, i), colors.HexColor('#f9fafb')) for i in range(2, len(table_data), 2)], ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#d4af37')), ('LINEBELOW', (0, -1), (-1, -1), 0.5, colors.HexColor('#e5e7eb')), ('ALIGN', (2, 0), (-1, -1), 'RIGHT'), ('ALIGN', (0, 0), (0, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
    elements.append(items_table)
    elements.append(Spacer(1, 6 * mm))
    totals_data = [['', '', 'Subtotal:', f'${subtotal:,.2f}'], ['', '', f'Tax ({tax_rate}%):', f'${tax_amount:,.2f}'], ['', '', 'Total:', f'${total:,.2f}']]
    totals_table = Table(totals_data, colWidths=[doc.width * 0.3, doc.width * 0.3, doc.width * 0.2, doc.width * 0.2])
    totals_table.setStyle(TableStyle([('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'), ('FONTNAME', (3, 0), (3, -1), 'Helvetica'), ('FONTSIZE', (0, 0), (-1, -1), 10), ('ALIGN', (2, 0), (-1, -1), 'RIGHT'), ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3), ('BACKGROUND', (2, 2), (-1, 2), colors.HexColor('#1a1a1a')), ('TEXTCOLOR', (2, 2), (-1, 2), colors.HexColor('#d4af37')), ('FONTNAME', (2, 2), (-1, 2), 'Helvetica-Bold'), ('FONTSIZE', (2, 2), (-1, 2), 12), ('TOPPADDING', (2, 2), (-1, 2), 6), ('BOTTOMPADDING', (2, 2), (-1, 2), 6)]))
    elements.append(totals_table)
    elements.append(Spacer(1, 10 * mm))
    if notes:
        elements.append(Paragraph('<b>Notes:</b>', heading_style))
        escaped_notes = html.escape(notes).replace('\n', '<br/>')
        elements.append(Paragraph(escaped_notes, body_style))
        elements.append(Spacer(1, 6 * mm))
    elements.append(Spacer(1, 10 * mm))
    elements.append(Paragraph(f'Generated by ForgeFlow · {invoice_number}', ParagraphStyle('Footer', parent=small_style, alignment=TA_CENTER)))
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes