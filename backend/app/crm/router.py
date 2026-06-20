from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from ..common.dependencies import get_db
from ..common.tenant import TenantContext, get_current_tenant, require_permission
from .schema import ClientCreate, ClientUpdate, ClientResponse, LeadCreate, LeadUpdate, LeadResponse, DealCreate, DealUpdate, DealResponse, CRMMetrics
from .service import CRMService
router = APIRouter()
service = CRMService()

@router.get('/clients', response_model=List[ClientResponse])
def list_clients(limit: int=100, offset: int=0, tenant: TenantContext=Depends(get_current_tenant), db: Session=Depends(get_db)):
    if limit > 1000:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Maximum page size is 1000')
    return service.list_clients(db, tenant.organization_id, limit=limit, offset=offset)

@router.post('/clients', response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(data: ClientCreate, tenant: TenantContext=Depends(require_permission('client:create')), db: Session=Depends(get_db)):
    return service.create_client(db, tenant.organization_id, data)

@router.get('/clients/{client_id}', response_model=ClientResponse)
def get_client(client_id: int, tenant: TenantContext=Depends(get_current_tenant), db: Session=Depends(get_db)):
    return service.get_client(db, client_id, tenant.organization_id)

@router.put('/clients/{client_id}', response_model=ClientResponse)
def update_client(client_id: int, data: ClientUpdate, tenant: TenantContext=Depends(require_permission('client:update')), db: Session=Depends(get_db)):
    return service.update_client(db, client_id, tenant.organization_id, data)

@router.delete('/clients/{client_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: int, tenant: TenantContext=Depends(require_permission('client:delete')), db: Session=Depends(get_db)):
    service.delete_client(db, client_id, tenant.organization_id)

@router.get('/leads', response_model=List[LeadResponse])
def list_leads(limit: int=100, offset: int=0, tenant: TenantContext=Depends(get_current_tenant), db: Session=Depends(get_db)):
    if limit > 1000:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Maximum page size is 1000')
    return service.list_leads(db, tenant.organization_id, limit=limit, offset=offset)

@router.post('/leads', response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(data: LeadCreate, tenant: TenantContext=Depends(require_permission('client:create')), db: Session=Depends(get_db)):
    return service.create_lead(db, tenant.organization_id, data)

@router.put('/leads/{lead_id}', response_model=LeadResponse)
def update_lead(lead_id: int, data: LeadUpdate, tenant: TenantContext=Depends(require_permission('client:update')), db: Session=Depends(get_db)):
    return service.update_lead(db, lead_id, tenant.organization_id, data)

@router.get('/deals', response_model=List[DealResponse])
def list_deals(limit: int=100, offset: int=0, tenant: TenantContext=Depends(get_current_tenant), db: Session=Depends(get_db)):
    if limit > 1000:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Maximum page size is 1000')
    return service.list_deals(db, tenant.organization_id, limit=limit, offset=offset)

@router.post('/deals', response_model=DealResponse, status_code=status.HTTP_201_CREATED)
def create_deal(data: DealCreate, tenant: TenantContext=Depends(require_permission('client:create')), db: Session=Depends(get_db)):
    return service.create_deal(db, tenant.organization_id, data)

@router.put('/deals/{deal_id}', response_model=DealResponse)
def update_deal(deal_id: int, data: DealUpdate, tenant: TenantContext=Depends(require_permission('client:update')), db: Session=Depends(get_db)):
    return service.update_deal(db, deal_id, tenant.organization_id, data)

@router.get('/metrics', response_model=CRMMetrics)
def get_crm_metrics(tenant: TenantContext=Depends(get_current_tenant), db: Session=Depends(get_db)):
    return service.get_metrics(db, tenant.organization_id)