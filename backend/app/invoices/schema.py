from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class LineItemCreate(BaseModel):
    description: str = Field(..., min_length=1)
    quantity: float = Field(default=1.0, ge=0)
    unit_price: float = Field(default=0.0, ge=0)

class LineItemResponse(BaseModel):
    id: int
    invoice_id: int
    description: str
    quantity: float
    unit_price: float
    amount: float

    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    client_id: Optional[int] = None
    issue_date: date
    due_date: date
    tax_rate: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None
    line_items: List[LineItemCreate] = Field(default_factory=list, min_length=1)

class InvoiceUpdate(BaseModel):
    client_id: Optional[int] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    tax_rate: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    line_items: Optional[List[LineItemCreate]] = None

class InvoiceResponse(BaseModel):
    id: int
    organization_id: int
    client_id: Optional[int] = None
    invoice_number: str
    issue_date: date
    due_date: date
    status: str
    subtotal: float
    tax_rate: float
    tax_amount: float
    total: float
    notes: Optional[str] = None
    pdf_url: Optional[str] = None
    pdf_status: str
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    line_items: List[LineItemResponse] = []
    client_name: Optional[str] = None

    class Config:
        from_attributes = True

class InvoiceListResponse(BaseModel):
    id: int
    organization_id: int
    client_id: Optional[int] = None
    invoice_number: str
    issue_date: date
    due_date: date
    status: str
    subtotal: float
    tax_rate: float
    tax_amount: float
    total: float
    pdf_url: Optional[str] = None
    pdf_status: str
    created_at: Optional[datetime] = None
    client_name: Optional[str] = None

    class Config:
        from_attributes = True

class InvoiceMetrics(BaseModel):
    total_billed: float = 0.0
    total_collected: float = 0.0
    total_outstanding: float = 0.0
    total_overdue: float = 0.0
    invoice_count: int = 0