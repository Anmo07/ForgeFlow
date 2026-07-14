from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Date, Text, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..common.database import Base, SoftDeleteMixin

class Invoice(Base, SoftDeleteMixin):
    __tablename__ = 'invoices'
    __table_args__ = (UniqueConstraint('organization_id', 'invoice_number', name='uq_invoice_org_number'),)
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    client_organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True, index=True)
    client_id = Column(Integer, ForeignKey('clients.id', ondelete='SET NULL'), nullable=True, index=True)
    invoice_number = Column(String, index=True, nullable=False)
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(String, default='draft')
    subtotal = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    pdf_object_key = Column(String, nullable=True)
    pdf_status = Column(String, default='completed', nullable=False)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    line_items = relationship('InvoiceLineItem', back_populates='invoice', cascade='all, delete-orphan')

class InvoiceLineItem(Base):
    __tablename__ = 'invoice_line_items'
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False, index=True)
    description = Column(String, nullable=False)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    invoice = relationship('Invoice', back_populates='line_items')