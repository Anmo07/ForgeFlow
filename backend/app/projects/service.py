from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from .repository import ProjectRepository, TaskRepository
from .schema import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse, TaskCreate, TaskUpdate, TaskResponse
from typing import List
from app.events.event_bus import publish_event
from app.auth.models import User

class ProjectService:

    def __init__(self):
        self.repo = ProjectRepository()
        self.task_repo = TaskRepository()

    def _get_actor_name(self, db: Session, user_id: int) -> str:
        if not user_id:
            return "System"
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            return user.full_name or user.email
        return "System"

    def _task_to_response(self, task) -> TaskResponse:
        data = {c.name: getattr(task, c.name) for c in task.__table__.columns}
        data['dependencies'] = [d.id for d in task.dependencies] if hasattr(task, 'dependencies') else []
        return TaskResponse(**data)

    def _enrich_project(self, project) -> dict:
        tasks = project.tasks or []
        total = len(tasks)
        completed = sum((1 for t in tasks if t.status == 'done'))
        data = {c.name: getattr(project, c.name) for c in project.__table__.columns}
        data['tasks'] = [self._task_to_response(t) for t in tasks]
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

    def create_project(self, db: Session, org_id: int, data: ProjectCreate, user_id: int = None) -> ProjectResponse:
        project = self.repo.create(db, org_id=org_id, name=data.name, description=data.description, status=data.status, priority=data.priority, due_date=data.due_date)
        project.project_type = data.project_type
        db.commit()
        db.refresh(project)
        
        from app.common.metrics import PROJECTS_CREATED
        PROJECTS_CREATED.inc()
        
        actor_name = self._get_actor_name(db, user_id)
        publish_event(
            db,
            event_type="project:created",
            organization_id=org_id,
            user_id=user_id,
            entity_type="Project",
            entity_id=project.id,
            payload={"target_name": project.name, "actor_name": actor_name}
        )
        db.commit()
        db.refresh(project)
        return ProjectResponse(**self._enrich_project(project))

    def update_project(self, db: Session, project_id: int, org_id: int, data: ProjectUpdate, user_id: int = None) -> ProjectResponse:
        project = self.repo.get_by_id(db, project_id, org_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        updates = data.model_dump(exclude_unset=True)
        project = self.repo.update(db, project, **updates)
        
        actor_name = self._get_actor_name(db, user_id)
        publish_event(
            db,
            event_type="project:updated",
            organization_id=org_id,
            user_id=user_id,
            entity_type="Project",
            entity_id=project.id,
            payload={"target_name": project.name, "actor_name": actor_name}
        )
        db.commit()
        db.refresh(project)
        return ProjectResponse(**self._enrich_project(project))

    def delete_project(self, db: Session, project_id: int, org_id: int, user_id: int = None) -> None:
        project = self.repo.get_by_id(db, project_id, org_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        project_name = project.name
        self.repo.delete(db, project)
        
        actor_name = self._get_actor_name(db, user_id)
        publish_event(
            db,
            event_type="project:deleted",
            organization_id=org_id,
            user_id=user_id,
            entity_type="Project",
            entity_id=project_id,
            payload={"target_name": project_name, "actor_name": actor_name}
        )
        db.commit()

    def create_task(self, db: Session, project_id: int, org_id: int, data: TaskCreate, user_id: int = None) -> TaskResponse:
        project = self.repo.get_by_id(db, project_id, org_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        task = self.task_repo.create(db, project_id=project_id, title=data.title, description=data.description, status=data.status, priority=data.priority, assigned_to=data.assigned_to, due_date=data.due_date)
        
        from app.common.metrics import TASKS_CREATED
        TASKS_CREATED.inc()
        
        actor_name = self._get_actor_name(db, user_id)
        publish_event(
            db,
            event_type="task:created",
            organization_id=org_id,
            user_id=user_id,
            entity_type="Task",
            entity_id=task.id,
            payload={"target_name": task.title, "actor_name": actor_name}
        )
        if task.assigned_to:
            publish_event(
                db,
                event_type="task:assigned",
                organization_id=org_id,
                user_id=user_id,
                entity_type="Task",
                entity_id=task.id,
                payload={"target_name": task.title, "actor_name": actor_name, "assigned_to": task.assigned_to, "task_title": task.title}
            )
        db.commit()
        db.refresh(task)
        return self._task_to_response(task)

    def update_task(self, db: Session, project_id: int, task_id: int, org_id: int, data: TaskUpdate, user_id: int = None) -> TaskResponse:
        project = self.repo.get_by_id(db, project_id, org_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        task = self.task_repo.get_by_id(db, task_id, project_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Task not found')
        
        old_assigned_to = task.assigned_to
        updates = data.model_dump(exclude_unset=True)
        task = self.task_repo.update(db, task, **updates)
        
        actor_name = self._get_actor_name(db, user_id)
        publish_event(
            db,
            event_type="task:updated",
            organization_id=org_id,
            user_id=user_id,
            entity_type="Task",
            entity_id=task.id,
            payload={"target_name": task.title, "actor_name": actor_name}
        )
        if task.assigned_to and task.assigned_to != old_assigned_to:
            publish_event(
                db,
                event_type="task:assigned",
                organization_id=org_id,
                user_id=user_id,
                entity_type="Task",
                entity_id=task.id,
                payload={"target_name": task.title, "actor_name": actor_name, "assigned_to": task.assigned_to, "task_title": task.title}
            )
        db.commit()
        db.refresh(task)
        return self._task_to_response(task)

    def delete_task(self, db: Session, project_id: int, task_id: int, org_id: int, user_id: int = None) -> None:
        project = self.repo.get_by_id(db, project_id, org_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        task = self.task_repo.get_by_id(db, task_id, project_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Task not found')
        task_title = task.title
        self.task_repo.delete(db, task)
        
        actor_name = self._get_actor_name(db, user_id)
        publish_event(
            db,
            event_type="task:deleted",
            organization_id=org_id,
            user_id=user_id,
            entity_type="Task",
            entity_id=task_id,
            payload={"target_name": task_title, "actor_name": actor_name}
        )
        db.commit()

    def _check_cycle(self, db: Session, task_id: int, depends_on_id: int) -> bool:
        if task_id == depends_on_id:
            return True
        from .models import task_dependencies
        visited = set()
        stack = [depends_on_id]
        while stack:
            curr = stack.pop()
            if curr == task_id:
                return True
            if curr not in visited:
                visited.add(curr)
                deps = db.query(task_dependencies.c.depends_on_id).filter(task_dependencies.c.task_id == curr).all()
                for dep_tuple in deps:
                    dep_id = dep_tuple[0]
                    if dep_id not in visited:
                        stack.append(dep_id)
        return False

    def add_task_dependency(self, db: Session, project_id: int, task_id: int, depends_on_id: int, org_id: int, user_id: int = None) -> TaskResponse:
        project = self.repo.get_by_id(db, project_id, org_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
        task = self.task_repo.get_by_id(db, task_id, project_id)
        dep_task = self.task_repo.get_by_id(db, depends_on_id, project_id)
        if not task or not dep_task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Task not found')
            
        if task_id == depends_on_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='A task cannot depend on itself')
            
        if self._check_cycle(db, task_id, depends_on_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cyclic task dependency detected')
            
        if dep_task not in task.dependencies:
            task.dependencies.append(dep_task)
            
        actor_name = self._get_actor_name(db, user_id)
        publish_event(
            db,
            event_type="task:dependency_added",
            organization_id=org_id,
            user_id=user_id,
            entity_type="Task",
            entity_id=task.id,
            payload={"target_name": f"{task.title} -> {dep_task.title}", "actor_name": actor_name}
        )
        db.commit()
        db.refresh(task)
        return self._task_to_response(task)