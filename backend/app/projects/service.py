from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from .repository import ProjectRepository, TaskRepository
from .schema import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse, TaskCreate, TaskUpdate, TaskResponse
from typing import List

class ProjectService:

    def __init__(self):
        self.repo = ProjectRepository()
        self.task_repo = TaskRepository()

    def _enrich_project(self, project) -> dict:
        tasks = project.tasks or []
        total = len(tasks)
        completed = sum((1 for t in tasks if t.status == 'done'))
        data = {c.name: getattr(project, c.name) for c in project.__table__.columns}
        data['tasks'] = [TaskResponse.model_validate(t) for t in tasks]
        data['total_tasks'] = total
        data['tasks_completed'] = completed
        return data

    def _enrich_project_list(self, project) -> dict:
        tasks = project.tasks or []
        total = len(tasks)
        completed = sum((1 for t in tasks if t.status == 'done'))
        data = {c.name: getattr(project, c.name) for c in project.__table__.columns}
        data['total_tasks'] = total
        data['tasks_completed'] = completed
        return data

    def list_projects(self, db: Session, org_id: int, limit: int=100, offset: int=0) -> List[ProjectListResponse]:
        projects = self.repo.list_by_org(db, org_id, limit=limit, offset=offset)
        return [ProjectListResponse(**self._enrich_project_list(p)) for p in projects]

    def get_project(self, db: Session, project_id: int, org_id: int) -> ProjectResponse:
        project = self.repo.get_by_id(db, project_id, org_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        return ProjectResponse(**self._enrich_project(project))

    def create_project(self, db: Session, org_id: int, data: ProjectCreate) -> ProjectResponse:
        project = self.repo.create(db, org_id=org_id, name=data.name, description=data.description, status=data.status, priority=data.priority, due_date=data.due_date)
        return ProjectResponse(**self._enrich_project(project))

    def update_project(self, db: Session, project_id: int, org_id: int, data: ProjectUpdate) -> ProjectResponse:
        project = self.repo.get_by_id(db, project_id, org_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        updates = data.model_dump(exclude_unset=True)
        project = self.repo.update(db, project, **updates)
        return ProjectResponse(**self._enrich_project(project))

    def delete_project(self, db: Session, project_id: int, org_id: int) -> None:
        project = self.repo.get_by_id(db, project_id, org_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        self.repo.delete(db, project)

    def create_task(self, db: Session, project_id: int, org_id: int, data: TaskCreate) -> TaskResponse:
        project = self.repo.get_by_id(db, project_id, org_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        task = self.task_repo.create(db, project_id=project_id, title=data.title, description=data.description, status=data.status, priority=data.priority, assigned_to=data.assigned_to, due_date=data.due_date)
        return TaskResponse.model_validate(task)

    def update_task(self, db: Session, project_id: int, task_id: int, org_id: int, data: TaskUpdate) -> TaskResponse:
        project = self.repo.get_by_id(db, project_id, org_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        task = self.task_repo.get_by_id(db, task_id, project_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Task not found')
        updates = data.model_dump(exclude_unset=True)
        task = self.task_repo.update(db, task, **updates)
        return TaskResponse.model_validate(task)

    def delete_task(self, db: Session, project_id: int, task_id: int, org_id: int) -> None:
        project = self.repo.get_by_id(db, project_id, org_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        task = self.task_repo.get_by_id(db, task_id, project_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Task not found')
        self.task_repo.delete(db, task)