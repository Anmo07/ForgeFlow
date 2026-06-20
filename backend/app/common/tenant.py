from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from contextvars import ContextVar
from sqlalchemy.event import listens_for
from sqlalchemy.orm import Query
from .dependencies import get_db, get_current_user, HTTPAuthorizationCredentials
from ..memberships.models import Membership
from ..roles.models import Role
from ..api_keys.service import APIKeyService
current_org_id: ContextVar[Optional[int]] = ContextVar('current_org_id', default=None)

class TenantContext(BaseModel):
    organization_id: int
    user_id: Optional[int] = None
    api_key_id: Optional[int] = None
    role_id: Optional[int] = None
    permissions: List[str] = []

def get_current_tenant(request: Request, db: Session=Depends(get_db)) -> TenantContext:
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer ff_'):
        plain_key = auth_header.replace('Bearer ', '')
        try:
            api_key = APIKeyService().authenticate_key(db, plain_key)
            current_org_id.set(api_key.organization_id)
            return TenantContext(organization_id=api_key.organization_id, api_key_id=api_key.id, permissions=api_key.permissions)
        except HTTPException as e:
            raise e
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid API Key authentication')
    token = None
    if auth_header and auth_header.startswith('Bearer '):
        token = HTTPAuthorizationCredentials(scheme='Bearer', credentials=auth_header.replace('Bearer ', ''))
    current_user = get_current_user(request, db, token)
    org_id_str = request.headers.get('X-Organization-ID') or request.query_params.get('org_id')
    if not org_id_str:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Missing organization context (X-Organization-ID header or org_id parameter)')
    try:
        org_id = int(org_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid organization ID format')
    membership = db.query(Membership).filter(Membership.user_id == current_user.id, Membership.organization_id == org_id, Membership.status == 'active').first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='User does not have an active membership in this organization')
    role = db.query(Role).filter(Role.id == membership.role_id).first()
    permissions = []
    if role:
        permissions = [p.name for p in role.permissions]
    current_org_id.set(org_id)
    return TenantContext(organization_id=org_id, user_id=current_user.id, role_id=membership.role_id, permissions=permissions)

def require_permission(permission_name: str):

    def dependency(tenant_ctx: TenantContext=Depends(get_current_tenant)):
        if permission_name not in tenant_ctx.permissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing required permission: '{permission_name}'")
        return tenant_ctx
    return dependency

@listens_for(Query, 'before_compile', retval=True)
def before_compile_tenant_isolation(query):
    org_id = current_org_id.get()
    if org_id is None:
        return query
    for desc in query.column_descriptions:
        entity = desc.get('entity')
        if entity and hasattr(entity, 'organization_id'):
            query = query.filter(entity.organization_id == org_id)
    return query