from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from .repository import InvoiceRepository
from .schema import InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceListResponse, LineItemCreate, LineItemResponse, InvoiceMetrics
from .pdf_generator import generate_invoice_pdf

class InvoiceService:

    def __init__(self):
        self.repo = InvoiceRepository()

    def _enrich_invoice(self, invoice, db: Session) -> dict:
        data = {c.name: getattr(invoice, c.name) for c in invoice.__table__.columns}
        data['line_items'] = [LineItemResponse.model_validate(item) for item in invoice.line_items or []]
        if invoice.client_id:
            from ..crm.models import Client
            client = db.query(Client).filter(Client.id == invoice.client_id).first()
            data['client_name'] = client.name if client else None
        else:
            data['client_name'] = None
        data['pdf_url'] = f'/api/invoices/{invoice.id}/pdf'
        return data

    def _enrich_invoice_list(self, invoice, db: Session) -> dict:
        data = {c.name: getattr(invoice, c.name) for c in invoice.__table__.columns}
        if invoice.client_id:
            from ..crm.models import Client
            client = db.query(Client).filter(Client.id == invoice.client_id).first()
            data['client_name'] = client.name if client else None
        else:
            data['client_name'] = None
        data['pdf_url'] = f'/api/invoices/{invoice.id}/pdf'
        return data

    def _compute_totals(self, line_items: List[LineItemCreate], tax_rate: float):
        subtotal = sum((round(item.quantity * item.unit_price, 2) for item in line_items))
        tax_amount = round(subtotal * (tax_rate / 100), 2)
        total = round(subtotal + tax_amount, 2)
        return (subtotal, tax_amount, total)

    def list_invoices(self, db: Session, org_id: int, limit: int=100, offset: int=0) -> List[InvoiceListResponse]:
        invoices = self.repo.list_by_org(db, org_id, limit=limit, offset=offset)
        return [InvoiceListResponse(**self._enrich_invoice_list(inv, db)) for inv in invoices]

    def get_invoice(self, db: Session, invoice_id: int, org_id: int) -> InvoiceResponse:
        invoice = self.repo.get_by_id(db, invoice_id, org_id)
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Invoice not found')
        return InvoiceResponse(**self._enrich_invoice(invoice, db))

    def create_invoice(self, db: Session, org_id: int, data: InvoiceCreate, user_id: int=None) -> InvoiceResponse:
        subtotal, tax_amount, total = self._compute_totals(data.line_items, data.tax_rate)
        if db.bind.dialect.name == 'postgresql':
            from ..organizations.models import Organization
            db.query(Organization).filter(Organization.id == org_id).with_for_update().first()
        invoice_number = self.repo.get_next_invoice_number(db, org_id)
        invoice = self.repo.create(db, org_id, invoice_number=invoice_number, issue_date=data.issue_date, due_date=data.due_date, status='draft', subtotal=subtotal, tax_rate=data.tax_rate, tax_amount=tax_amount, total=total, notes=data.notes, client_id=data.client_id, created_by=user_id)
        for item in data.line_items:
            self.repo.add_line_item(db, invoice.id, description=item.description, quantity=item.quantity, unit_price=item.unit_price)
        import os
        is_testing = os.getenv('TESTING') == 'True' or 'test' in os.getenv('DATABASE_URL', 'sqlite')
        if not is_testing:
            from ..common.celery_tasks import generate_invoice_pdf_task
            generate_invoice_pdf_task.delay(invoice.id, org_id)
        db.refresh(invoice)
        return InvoiceResponse(**self._enrich_invoice(invoice, db))

    def update_invoice(self, db: Session, invoice_id: int, org_id: int, data: InvoiceUpdate) -> InvoiceResponse:
        invoice = self.repo.get_by_id(db, invoice_id, org_id)
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Invoice not found')
        updates = data.model_dump(exclude_unset=True)
        line_items_data = updates.pop('line_items', None)
        if line_items_data is not None:
            self.repo.clear_line_items(db, invoice.id)
            for item_data in line_items_data:
                self.repo.add_line_item(db, invoice.id, description=item_data['description'], quantity=item_data.get('quantity', 1.0), unit_price=item_data.get('unit_price', 0.0))
            tax_rate = updates.get('tax_rate', invoice.tax_rate)
            line_item_objects = [LineItemCreate(**d) for d in line_items_data]
            subtotal, tax_amount, total = self._compute_totals(line_item_objects, tax_rate)
            updates['subtotal'] = subtotal
            updates['tax_amount'] = tax_amount
            updates['total'] = total
        invoice = self.repo.update(db, invoice, **updates)
        if line_items_data is not None:
            import os
            is_testing = os.getenv('TESTING') == 'True' or 'test' in os.getenv('DATABASE_URL', 'sqlite')
            if not is_testing:
                from ..common.celery_tasks import generate_invoice_pdf_task
                generate_invoice_pdf_task.delay(invoice.id, org_id)
        db.refresh(invoice)
        return InvoiceResponse(**self._enrich_invoice(invoice, db))

    def delete_invoice(self, db: Session, invoice_id: int, org_id: int) -> None:
        invoice = self.repo.get_by_id(db, invoice_id, org_id)
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Invoice not found')
        self.repo.delete(db, invoice)

    def update_status(self, db: Session, invoice_id: int, org_id: int, new_status: str) -> InvoiceResponse:
        invoice = self.repo.get_by_id(db, invoice_id, org_id)
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Invoice not found')
        valid_statuses = {'draft', 'sent', 'paid', 'overdue', 'cancelled'}
        if new_status not in valid_statuses:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f'Invalid status: {new_status}')
        invoice = self.repo.update(db, invoice, status=new_status)
        return InvoiceResponse(**self._enrich_invoice(invoice, db))

    def get_pdf_bytes(self, db: Session, invoice_id: int, org_id: int) -> tuple:
        invoice = self.repo.get_by_id(db, invoice_id, org_id)
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Invoice not found')
        filename = f'{invoice.invoice_number}.pdf'
        if invoice.pdf_object_key:
            from ..common.minio import minio_client
            pdf_bytes = minio_client.download_file('forgeflow-invoices', invoice.pdf_object_key)
            if pdf_bytes:
                return (pdf_bytes, filename)
        client_name = 'Client'
        if invoice.client_id:
            from ..crm.models import Client
            client = db.query(Client).filter(Client.id == invoice.client_id).first()
            if client:
                client_name = client.name
        from ..organizations.models import Organization
        org = db.query(Organization).filter(Organization.id == org_id).first()
        org_name = org.name if org else 'ForgeFlow'
        line_items = [{'description': item.description, 'quantity': item.quantity, 'unit_price': item.unit_price, 'amount': item.amount} for item in invoice.line_items]
        pdf_bytes = generate_invoice_pdf(invoice_number=invoice.invoice_number, issue_date=str(invoice.issue_date), due_date=str(invoice.due_date), client_name=client_name, org_name=org_name, line_items=line_items, subtotal=invoice.subtotal, tax_rate=invoice.tax_rate, tax_amount=invoice.tax_amount, total=invoice.total, notes=invoice.notes, status=invoice.status)
        return (pdf_bytes, filename)

    def get_metrics(self, db: Session, org_id: int) -> InvoiceMetrics:
        invoices = self.repo.list_by_org(db, org_id)
        total_billed = sum((inv.total for inv in invoices))
        total_collected = sum((inv.total for inv in invoices if inv.status == 'paid'))
        total_outstanding = sum((inv.total for inv in invoices if inv.status in ('sent', 'draft')))
        total_overdue = sum((inv.total for inv in invoices if inv.status == 'overdue'))
        return InvoiceMetrics(total_billed=total_billed, total_collected=total_collected, total_outstanding=total_outstanding, total_overdue=total_overdue, invoice_count=len(invoices))

    def generate_and_store_pdf_sync(self, db: Session, invoice_id: int, org_id: int) -> None:
        invoice = self.repo.get_by_id(db, invoice_id, org_id)
        if not invoice:
            return
        client_name = 'Client'
        if invoice.client_id:
            from ..crm.models import Client
            client = db.query(Client).filter(Client.id == invoice.client_id).first()
            if client:
                client_name = client.name
        from ..organizations.models import Organization
        org = db.query(Organization).filter(Organization.id == org_id).first()
        org_name = org.name if org else 'ForgeFlow'
        line_items = [{'description': item.description, 'quantity': item.quantity, 'unit_price': item.unit_price, 'amount': item.amount} for item in invoice.line_items]
        pdf_bytes = generate_invoice_pdf(invoice_number=invoice.invoice_number, issue_date=str(invoice.issue_date), due_date=str(invoice.due_date), client_name=client_name, org_name=org_name, line_items=line_items, subtotal=invoice.subtotal, tax_rate=invoice.tax_rate, tax_amount=invoice.tax_amount, total=invoice.total, notes=invoice.notes, status=invoice.status)
        from ..common.minio import minio_client
        pdf_path = f'invoices/{org_id}/{invoice.invoice_number}.pdf'
        uploaded = minio_client.upload_bytes(bucket_name='forgeflow-invoices', object_name=pdf_path, data=pdf_bytes, content_type='application/pdf')
        if uploaded:
            self.repo.update(db, invoice, pdf_object_key=pdf_path)