from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from ..common.dependencies import get_db, get_current_user
from ..common.tenant import TenantContext, get_current_tenant
from ..memberships.models import Membership
from ..roles.models import Role
from ..common.celery_tasks import notify_breach_task
from ..auth.models import User

router = APIRouter()

class BreachReportRequest(BaseModel):
    incident_description: str
    affected_organizations: List[int]

@router.get('/export/user')
def export_user_data(current_user: User = Depends(get_current_user), db: Session=Depends(get_db)):
    
    user_data = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "memberships": []
    }
    
    # Query memberships
    memberships = db.query(Membership).filter(Membership.user_id == current_user.id).all()
    for m in memberships:
        role = db.query(Role).filter(Role.id == m.role_id).first()
        user_data["memberships"].append({
            "organization_id": m.organization_id,
            "role": role.name if role else "Unknown",
            "status": m.status,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None
        })
    return user_data

@router.get('/export/organization')
def export_org_data(tenant: TenantContext=Depends(get_current_tenant), db: Session=Depends(get_db)):
    role = db.query(Role).filter(Role.id == tenant.role_id).first()
    if not role or role.name not in ('Admin', 'Owner'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organization Admins or Owners can export data.")
        
    from ..organizations.models import Organization
    org = db.query(Organization).filter(Organization.id == tenant.organization_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
        
    org_data = {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "memberships": [],
        "projects": [],
        "clients": [],
        "invoices": []
    }
    
    # Memberships
    memberships = db.query(Membership).filter(Membership.organization_id == tenant.organization_id).all()
    for m in memberships:
        org_data["memberships"].append({
            "user_id": m.user_id,
            "role_id": m.role_id,
            "status": m.status,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None
        })
        
    # Projects
    from ..projects.models import Project, Task
    projects = db.query(Project).filter(Project.organization_id == tenant.organization_id).all()
    for p in projects:
        p_data = {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "tasks": []
        }
        tasks = db.query(Task).filter(Task.project_id == p.id).all()
        for t in tasks:
            p_data["tasks"].append({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "status": t.status
            })
        org_data["projects"].append(p_data)
        
    # Clients
    from ..crm.models import Client
    clients = db.query(Client).filter(Client.organization_id == tenant.organization_id).all()
    for c in clients:
        org_data["clients"].append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone
        })
        
    # Invoices
    from ..invoices.models import Invoice
    invoices = db.query(Invoice).filter(Invoice.organization_id == tenant.organization_id).all()
    for inv in invoices:
        org_data["invoices"].append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "total": inv.total,
            "status": inv.status
        })
        
    return org_data

@router.post('/user/anonymize')
def anonymize_user_account(current_user: User = Depends(get_current_user), db: Session=Depends(get_db)):
    
    current_user.email = f"anonymized_{current_user.id}@forgeflow.internal"
    current_user.full_name = "Anonymized User"
    current_user.hashed_password = "ANONYMIZED_PASSWORD_HASH"
    current_user.mfa_secret = None
    current_user.mfa_backup_codes = None
    current_user.is_active = False
    current_user.is_verified = False
    
    from ..sessions.service import SessionService
    SessionService().invalidate_user_sessions(db, current_user.id)
    
    db.query(Membership).filter(Membership.user_id == current_user.id).update({"status": "inactive"})
    db.commit()
    return {"message": "Account has been successfully closed and anonymized."}

@router.post('/breach-report')
def report_breach(data: BreachReportRequest, tenant: TenantContext=Depends(get_current_tenant), db: Session=Depends(get_db)):
    role = db.query(Role).filter(Role.id == tenant.role_id).first()
    if not role or role.name not in ('Admin', 'Owner'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organization Admins or Owners can submit breach reports.")
        
    if tenant.organization_id not in data.affected_organizations:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can only report breaches for organizations you belong to.")
         
    # Trigger Async Celery Worker task
    notify_breach_task.delay(data.affected_organizations, data.incident_description)
    return {"message": "Breach report submitted. Notifications are being dispatched."}
