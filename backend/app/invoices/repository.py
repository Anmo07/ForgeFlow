from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
from typing import List, Optional
from .models import Invoice, InvoiceLineItem

class InvoiceRepository:

    def list_by_org(self, db: Session, org_id: int, limit: int=100, offset: int=0) -> List[Invoice]:
        return db.query(Invoice).filter(Invoice.organization_id == org_id).order_by(Invoice.created_at.desc()).offset(offset).limit(limit).all()

    def get_by_id(self, db: Session, invoice_id: int, org_id: int) -> Optional[Invoice]:
        return db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.organization_id == org_id).first()

    def get_next_invoice_number(self, db: Session, org_id: int) -> str:
        from datetime import date
        year = date.today().year
        prefix = f'INV-{year}-'
        count = db.query(sa_func.count(Invoice.id)).filter(Invoice.organization_id == org_id, Invoice.invoice_number.like(f'{prefix}%')).scalar() or 0
        return f'{prefix}{count + 1:03d}'

    def create(self, db: Session, org_id: int, invoice_number: str, issue_date=None, due_date=None, status='draft', subtotal=0.0, tax_rate=0.0, tax_amount=0.0, total=0.0, notes=None, client_id=None, created_by=None, pdf_object_key=None, pdf_status='completed') -> Invoice:
        invoice = Invoice(organization_id=org_id, invoice_number=invoice_number, issue_date=issue_date, due_date=due_date, status=status, subtotal=subtotal, tax_rate=tax_rate, tax_amount=tax_amount, total=total, notes=notes, client_id=client_id, created_by=created_by, pdf_object_key=pdf_object_key, pdf_status=pdf_status)
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        return invoice

    def update(self, db: Session, invoice: Invoice, **kwargs) -> Invoice:
        for key, value in kwargs.items():
            if value is not None:
                setattr(invoice, key, value)
        db.commit()
        db.refresh(invoice)
        return invoice

    def delete(self, db: Session, invoice: Invoice) -> None:
        db.delete(invoice)
        db.commit()

    def add_line_item(self, db: Session, invoice_id: int, description: str, quantity: float, unit_price: float) -> InvoiceLineItem:
        amount = round(quantity * unit_price, 2)
        item = InvoiceLineItem(invoice_id=invoice_id, description=description, quantity=quantity, unit_price=unit_price, amount=amount)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def clear_line_items(self, db: Session, invoice_id: int) -> None:
        db.query(InvoiceLineItem).filter(InvoiceLineItem.invoice_id == invoice_id).delete()
        db.commit()