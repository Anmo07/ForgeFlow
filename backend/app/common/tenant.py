from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.event import listens_for
from sqlalchemy.orm import Query
from .dependencies import get_db, get_current_user, HTTPAuthorizationCredentials
from ..memberships.models import Membership
from ..roles.models import Role
from ..api_keys.service import APIKeyService
from .tenant_filtering import current_org_id, current_is_external, show_deleted
from .logging_context import org_id_ctx

class TenantContext(BaseModel):
    organization_id: int
    user_id: Optional[int] = None
    api_key_id: Optional[int] = None
    role_id: Optional[int] = None
    permissions: List[str] = []
    is_external: bool = False

def get_current_tenant(request: Request, db: Session=Depends(get_db)) -> TenantContext:
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer ff_'):
        plain_key = auth_header.replace('Bearer ', '')
        try:
            api_key = APIKeyService().authenticate_key(db, plain_key)
            current_org_id.set(api_key.organization_id)
            org_id_ctx.set(str(api_key.organization_id))
            current_is_external.set(False)
            return TenantContext(
                organization_id=api_key.organization_id,
                api_key_id=api_key.id,
                permissions=api_key.permissions,
                is_external=False
            )
        except HTTPException as e:
            raise e
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid API Key authentication')
            
    token = None
    if auth_header and auth_header.startswith('Bearer '):
        token = HTTPAuthorizationCredentials(scheme='Bearer', credentials=auth_header.replace('Bearer ', ''))
        
    current_user = get_current_user(request, db, token)
    org_id_str = request.headers.get('X-Organization-ID') or request.query_params.get('org_id')
    org_id = None
    if org_id_str:
        try:
            org_id = int(org_id_str)
        except ValueError:
            org_id = None

    if org_id is None:
        first_mem = db.query(Membership).filter(
            Membership.user_id == current_user.id,
            Membership.status == 'active'
        ).first()
        if first_mem:
            org_id = first_mem.organization_id
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Missing organization context (X-Organization-ID header or org_id parameter)')
            
    membership = db.query(Membership).filter(Membership.user_id == current_user.id, Membership.organization_id == org_id, Membership.status == 'active').first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='User does not have an active membership in this organization')

    # Resolve role permissions — prefer Redis cache, fall back to DB
    permissions = []
    if membership.role_id:
        import json as _json
        from .redis import redis_client as _redis
        cache_key = f"cache:role_permissions:{membership.role_id}"
        cached = _redis.get(cache_key)
        if cached:
            try:
                permissions = _json.loads(cached)
            except Exception:
                permissions = []

        if not permissions:
            role = db.query(Role).filter(Role.id == membership.role_id).first()
            if role:
                permissions = [p.name for p in role.permissions]
                try:
                    _redis.set(cache_key, _json.dumps(permissions), expire=300)
                except Exception:
                    pass  # fail-open: skip cache write if Redis is down

    is_ext = bool(membership.is_external or current_user.is_external)
    current_org_id.set(org_id)
    org_id_ctx.set(str(org_id))
    current_is_external.set(is_ext)

    return TenantContext(
        organization_id=org_id,
        user_id=current_user.id,
        role_id=membership.role_id,
        permissions=permissions,
        is_external=is_ext
    )

def require_permission(permission_name: str):
    def dependency(tenant_ctx: TenantContext=Depends(get_current_tenant)):
        if permission_name not in tenant_ctx.permissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing required permission: '{permission_name}'")
        return tenant_ctx
    return dependency

@listens_for(Query, 'before_compile', retval=True)
def before_compile_tenant_isolation(query):
    # 1. Apply soft-delete filter
    if not show_deleted.get():
        for desc in query.column_descriptions:
            entity = desc.get('entity')
            if entity and hasattr(entity, 'deleted_at'):
                query = query.enable_assertions(False).filter(entity.deleted_at == None)

    # 2. Apply tenant isolation filter
    org_id = current_org_id.get()
    if org_id is None:
        return query
        
    is_ext = current_is_external.get()
    for desc in query.column_descriptions:
        entity = desc.get('entity')
        if entity:
            if is_ext and hasattr(entity, 'client_organization_id'):
                query = query.enable_assertions(False).filter(entity.client_organization_id == org_id)
            elif hasattr(entity, 'organization_id'):
                query = query.enable_assertions(False).filter(entity.organization_id == org_id)
    return query

def get_tenant_context(db, user, org_id: int) -> int:
    from .dependencies import verify_org_membership
    return verify_org_membership(org_id, user, db)