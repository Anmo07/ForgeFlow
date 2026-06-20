from sqlalchemy.orm import Session
from typing import List, Optional
from .models import Project, Task

class ProjectRepository:

    def list_by_org(self, db: Session, org_id: int, limit: int=100, offset: int=0) -> List[Project]:
        return db.query(Project).filter(Project.organization_id == org_id).order_by(Project.created_at.desc()).offset(offset).limit(limit).all()

    def get_by_id(self, db: Session, project_id: int, org_id: int) -> Optional[Project]:
        return db.query(Project).filter(Project.id == project_id, Project.organization_id == org_id).first()

    def create(self, db: Session, org_id: int, name: str, description: str=None, status: str='planning', priority: str='medium', due_date=None) -> Project:
        project = Project(organization_id=org_id, name=name, description=description, status=status, priority=priority, due_date=due_date)
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    def update(self, db: Session, project: Project, **kwargs) -> Project:
        for key, value in kwargs.items():
            if value is not None:
                setattr(project, key, value)
        db.commit()
        db.refresh(project)
        return project

    def delete(self, db: Session, project: Project) -> None:
        db.delete(project)
        db.commit()

class TaskRepository:

    def list_by_project(self, db: Session, project_id: int) -> List[Task]:
        return db.query(Task).filter(Task.project_id == project_id).order_by(Task.created_at.desc()).all()

    def get_by_id(self, db: Session, task_id: int, project_id: int) -> Optional[Task]:
        return db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()

    def create(self, db: Session, project_id: int, title: str, description: str=None, status: str='todo', priority: str='medium', assigned_to: int=None, due_date=None) -> Task:
        task = Task(project_id=project_id, title=title, description=description, status=status, priority=priority, assigned_to=assigned_to, due_date=due_date)
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    def update(self, db: Session, task: Task, **kwargs) -> Task:
        for key, value in kwargs.items():
            if value is not None:
                setattr(task, key, value)
        db.commit()
        db.refresh(task)
        return task

    def delete(self, db: Session, task: Task) -> None:
        db.delete(task)
        db.commit()