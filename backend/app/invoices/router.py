from fastapi import APIRouter, Depends, status, Header
from fastapi.responses import Response, JSONResponse
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from ..common.dependencies import get_db
from ..common.tenant import TenantContext, get_current_tenant, require_permission
from .schema import InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceListResponse, InvoiceMetrics
from .service import InvoiceService
router = APIRouter()
service = InvoiceService()

class StatusUpdate(BaseModel):
    status: str

@router.get('', response_model=List[InvoiceListResponse])
def list_invoices(limit: int=100, offset: int=0, tenant: TenantContext=Depends(get_current_tenant), db: Session=Depends(get_db)):
    if limit > 100:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Maximum page size is 100')
    return service.list_invoices(db, tenant.organization_id, limit=limit, offset=offset)

@router.post('', response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    data: InvoiceCreate, 
    tenant: TenantContext=Depends(require_permission('invoice:create')), 
    db: Session=Depends(get_db),
    idempotency_key: str = Header(None, alias="Idempotency-Key")
):
    import json
    from ..common.redis import redis_client
    from fastapi.encoders import jsonable_encoder

    redis_key = None
    if idempotency_key:
        redis_key = f"idempotency:invoice:{tenant.organization_id}:{idempotency_key}"
        cached = redis_client.get(redis_key)
        if cached:
            try:
                cached_data = json.loads(cached)
                return JSONResponse(content=cached_data, status_code=status.HTTP_201_CREATED)
            except Exception:
                pass

    invoice = service.create_invoice(db, tenant.organization_id, data, user_id=tenant.user_id)

    if redis_key:
        serialized = jsonable_encoder(InvoiceResponse.model_validate(invoice))
        redis_client.set(redis_key, json.dumps(serialized), expire=86400)

    return invoice

@router.get('/metrics', response_model=InvoiceMetrics)
def get_invoice_metrics(tenant: TenantContext=Depends(get_current_tenant), db: Session=Depends(get_db)):
    return service.get_metrics(db, tenant.organization_id)

@router.get('/{invoice_id}', response_model=InvoiceResponse)
def get_invoice(invoice_id: int, tenant: TenantContext=Depends(get_current_tenant), db: Session=Depends(get_db)):
    return service.get_invoice(db, invoice_id, tenant.organization_id)

@router.put('/{invoice_id}', response_model=InvoiceResponse)
def update_invoice(invoice_id: int, data: InvoiceUpdate, tenant: TenantContext=Depends(require_permission('invoice:update')), db: Session=Depends(get_db)):
    return service.update_invoice(db, invoice_id, tenant.organization_id, data)

@router.delete('/{invoice_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(invoice_id: int, tenant: TenantContext=Depends(require_permission('invoice:delete')), db: Session=Depends(get_db)):
    service.delete_invoice(db, invoice_id, tenant.organization_id)

@router.put('/{invoice_id}/status', response_model=InvoiceResponse)
def update_invoice_status(invoice_id: int, body: StatusUpdate, tenant: TenantContext=Depends(require_permission('invoice:update')), db: Session=Depends(get_db)):
    return service.update_status(db, invoice_id, tenant.organization_id, body.status)

@router.get('/{invoice_id}/pdf')
def download_invoice_pdf(invoice_id: int, tenant: TenantContext=Depends(get_current_tenant), db: Session=Depends(get_db)):
    pdf_bytes, filename = service.get_pdf_bytes(db, invoice_id, tenant.organization_id)
    return Response(content=pdf_bytes, media_type='application/pdf', headers={'Content-Disposition': f'attachment; filename="{filename}"'})