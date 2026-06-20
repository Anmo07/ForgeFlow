from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from ..common.dependencies import get_db
from ..common.tenant import TenantContext, get_current_tenant, require_permission
from .schema import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse, TaskCreate, TaskUpdate, TaskResponse
from .service import ProjectService
router = APIRouter()
service = ProjectService()

@router.get('', response_model=List[ProjectListResponse])
def list_projects(limit: int=100, offset: int=0, tenant: TenantContext=Depends(get_current_tenant), db: Session=Depends(get_db)):
    if limit > 1000:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Maximum page size is 1000')
    return service.list_projects(db, tenant.organization_id, limit=limit, offset=offset)

@router.post('', response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectCreate, tenant: TenantContext=Depends(require_permission('project:create')), db: Session=Depends(get_db)):
    return service.create_project(db, tenant.organization_id, data)

@router.get('/{project_id}', response_model=ProjectResponse)
def get_project(project_id: int, tenant: TenantContext=Depends(get_current_tenant), db: Session=Depends(get_db)):
    return service.get_project(db, project_id, tenant.organization_id)

@router.put('/{project_id}', response_model=ProjectResponse)
def update_project(project_id: int, data: ProjectUpdate, tenant: TenantContext=Depends(require_permission('project:update')), db: Session=Depends(get_db)):
    return service.update_project(db, project_id, tenant.organization_id, data)

@router.delete('/{project_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, tenant: TenantContext=Depends(require_permission('project:delete')), db: Session=Depends(get_db)):
    service.delete_project(db, project_id, tenant.organization_id)

@router.post('/{project_id}/tasks', response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(project_id: int, data: TaskCreate, tenant: TenantContext=Depends(require_permission('project:create')), db: Session=Depends(get_db)):
    return service.create_task(db, project_id, tenant.organization_id, data)

@router.put('/{project_id}/tasks/{task_id}', response_model=TaskResponse)
def update_task(project_id: int, task_id: int, data: TaskUpdate, tenant: TenantContext=Depends(require_permission('project:update')), db: Session=Depends(get_db)):
    return service.update_task(db, project_id, task_id, tenant.organization_id, data)

@router.delete('/{project_id}/tasks/{task_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_task(project_id: int, task_id: int, tenant: TenantContext=Depends(require_permission('project:delete')), db: Session=Depends(get_db)):
    service.delete_task(db, project_id, task_id, tenant.organization_id)