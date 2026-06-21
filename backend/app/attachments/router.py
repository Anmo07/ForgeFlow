from fastapi import APIRouter, Depends, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.common.dependencies import get_db
from app.common.tenant import TenantContext, get_current_tenant, require_permission
from .service import AttachmentService

router = APIRouter()
service = AttachmentService()

@router.post('/upload', status_code=status.HTTP_201_CREATED)
def upload_attachment(
    file: UploadFile = File(...),
    project_id: Optional[int] = Form(None),
    task_id: Optional[int] = Form(None),
    tenant: TenantContext = Depends(require_permission('project:update')),
    db: Session = Depends(get_db)
):
    attachment = service.upload_file(
        db=db,
        org_id=tenant.organization_id,
        upload_file=file,
        user_id=tenant.user_id,
        project_id=project_id,
        task_id=task_id
    )
    return {
        "id": attachment.id,
        "filename": attachment.filename,
        "file_size": attachment.file_size,
        "content_type": attachment.content_type,
        "status": attachment.status,
        "storage_path": attachment.storage_path,
        "created_at": attachment.created_at
    }

@router.get('/{id}/download')
def get_attachment_download_url(
    id: int,
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    url = service.get_download_url(db, id, tenant.organization_id, user_id=tenant.user_id)
    return {"url": url}

@router.delete('/{id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    id: int,
    tenant: TenantContext = Depends(require_permission('project:update')),
    db: Session = Depends(get_db)
):
    service.delete_attachment(db, id, tenant.organization_id, user_id=tenant.user_id)
