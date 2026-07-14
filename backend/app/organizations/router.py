from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..common.dependencies import get_db, get_current_user_optional
from ..auth.models import User
from ..common.tenant import TenantContext, get_current_tenant
from ..roles.models import Role
from .schema import OrganizationCreate, OrganizationUpdate, OrganizationResponse, OrganizationSSOUpdate, OrganizationSSOResponse
from .service import OrganizationService
router = APIRouter()
org_service = OrganizationService()

@router.post('/', response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_org(req: OrganizationCreate, current_user: Optional[User]=Depends(get_current_user_optional), db: Session=Depends(get_db)):
    creator_id = current_user.id if current_user else None
    return org_service.create_organization(db, req, creator_id=creator_id)

@router.get('/', response_model=List[OrganizationResponse])
def list_orgs(skip: int=0, limit: int=100, current_user: Optional[User]=Depends(get_current_user_optional), db: Session=Depends(get_db)):
    if limit > 100:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Maximum page size is 100')
    if current_user:
        return org_service.list_organizations_for_user(db, current_user.id, skip, limit)
    return org_service.list_organizations(db, skip, limit)

@router.get('/{org_id}', response_model=OrganizationResponse)
def get_org(org_id: int, db: Session=Depends(get_db)):
    return org_service.get_organization_by_id(db, org_id)

@router.put('/{org_id}', response_model=OrganizationResponse)
def update_org(org_id: int, req: OrganizationUpdate, db: Session=Depends(get_db)):
    return org_service.update_organization(db, org_id, req)

@router.delete('/{org_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_org(org_id: int, db: Session=Depends(get_db)):
    org_service.delete_organization(db, org_id)
    return None

@router.get('/{org_id}/sso', response_model=OrganizationSSOResponse)
def get_org_sso(
    org_id: int,
    db: Session = Depends(get_db),
    tenant_ctx: TenantContext = Depends(get_current_tenant)
):
    if tenant_ctx.organization_id != org_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this organization")
    
    role = db.query(Role).filter(Role.id == tenant_ctx.role_id).first()
    if not role or role.name != 'Owner':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the organization Owner can view SSO settings")
        
    org = org_service.get_organization_by_id(db, org_id)
    return OrganizationSSOResponse(
        sso_enabled=org.sso_enabled,
        sso_provider=org.sso_provider,
        sso_client_id=org.sso_client_id,
        sso_client_secret_configured=bool(org.sso_client_secret),
        sso_issuer_url=org.sso_issuer_url
    )

@router.put('/{org_id}/sso', response_model=OrganizationSSOResponse)
def update_org_sso(
    org_id: int,
    req: OrganizationSSOUpdate,
    db: Session = Depends(get_db),
    tenant_ctx: TenantContext = Depends(get_current_tenant)
):
    if tenant_ctx.organization_id != org_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this organization")
        
    role = db.query(Role).filter(Role.id == tenant_ctx.role_id).first()
    if not role or role.name != 'Owner':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the organization Owner can edit SSO settings")
        
    org = org_service.get_organization_by_id(db, org_id)
    
    secret_val = org.sso_client_secret
    if req.sso_client_secret is not None:
        if req.sso_client_secret == "********":
            pass
        elif req.sso_client_secret == "":
            secret_val = None
        else:
            from ..common.encryption import encrypt_field
            secret_val = encrypt_field(req.sso_client_secret)
            
    org.sso_enabled = req.sso_enabled
    org.sso_provider = req.sso_provider
    org.sso_client_id = req.sso_client_id
    org.sso_client_secret = secret_val
    org.sso_issuer_url = req.sso_issuer_url
    
    db.commit()
    db.refresh(org)
    
    return OrganizationSSOResponse(
        sso_enabled=org.sso_enabled,
        sso_provider=org.sso_provider,
        sso_client_id=org.sso_client_id,
        sso_client_secret_configured=bool(org.sso_client_secret),
        sso_issuer_url=org.sso_issuer_url
    )

# Custom Roles Management Endpoints
from ..roles.schema import RoleResponse, RoleCreate, RoleUpdate, CustomRoleCreate, CustomRoleUpdate
from ..roles.service import RoleService
from ..memberships.models import Membership

custom_role_service = RoleService()

@router.post('/{org_id}/roles', response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_custom_role(
    org_id: int,
    req: CustomRoleCreate,
    db: Session = Depends(get_db),
    tenant_ctx: TenantContext = Depends(get_current_tenant)
):
    if tenant_ctx.organization_id != org_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this organization")
        
    role = db.query(Role).filter(Role.id == tenant_ctx.role_id).first()
    if not role or role.name != 'Owner':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the organization Owner can manage roles")
        
    role_in = RoleCreate(
        name=req.name,
        description=req.description,
        organization_id=org_id,
        permission_ids=req.permission_ids
    )
    return custom_role_service.create_role(db, role_in, is_system=False)

@router.put('/{org_id}/roles/{role_id}', response_model=RoleResponse)
def update_custom_role(
    org_id: int,
    role_id: int,
    req: CustomRoleUpdate,
    db: Session = Depends(get_db),
    tenant_ctx: TenantContext = Depends(get_current_tenant)
):
    if tenant_ctx.organization_id != org_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this organization")
        
    role = db.query(Role).filter(Role.id == tenant_ctx.role_id).first()
    if not role or role.name != 'Owner':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the organization Owner can manage roles")
        
    db_role = custom_role_service.get_role_by_id(db, role_id)
    if db_role.organization_id != org_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role does not belong to this organization")
        
    if db_role.is_system:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot modify system roles")
        
    role_update = RoleUpdate(
        name=req.name,
        description=req.description,
        permission_ids=req.permission_ids
    )
    return custom_role_service.update_role(db, role_id, role_update)

@router.delete('/{org_id}/roles/{role_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_role(
    org_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    tenant_ctx: TenantContext = Depends(get_current_tenant)
):
    if tenant_ctx.organization_id != org_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this organization")
        
    role = db.query(Role).filter(Role.id == tenant_ctx.role_id).first()
    if not role or role.name != 'Owner':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the organization Owner can manage roles")
        
    db_role = custom_role_service.get_role_by_id(db, role_id)
    if db_role.organization_id != org_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role does not belong to this organization")
        
    if db_role.is_system:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete system roles")
        
    # Check if role is assigned to active memberships
    active_mems = db.query(Membership).filter(
        Membership.role_id == role_id,
        Membership.organization_id == org_id,
        Membership.status == 'active'
    ).all()
    
    if active_mems:
        affected = [
            {"email": m.user.email, "full_name": m.user.full_name}
            for m in active_mems
        ]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Cannot delete role because it is currently assigned to active members",
                "affected_members": affected
            }
        )
        
    custom_role_service.delete_role(db, role_id)
    return None