from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import date, datetime

ProjectType = Literal['Onboarding', 'Migration', 'Retainer_SLA', 'onboarding', 'migration', 'retainer_sla']
TaskStatus = Literal['Backlog', 'Todo', 'In Progress', 'Review', 'Done', 'Archived', 'backlog', 'todo', 'in_progress', 'review', 'done', 'archived']
TaskPriority = Literal['Low', 'Medium', 'High', 'Critical', 'low', 'medium', 'high', 'critical']

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: TaskStatus = Field(default='todo')
    priority: TaskPriority = Field(default='medium')
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None
    version: Optional[int] = None

class TaskResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None
    dependencies: List[int] = []
    version: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    project_type: ProjectType = Field(default='Retainer_SLA')
    status: str = Field(default='planning')
    priority: str = Field(default='medium')
    due_date: Optional[date] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    project_type: Optional[ProjectType] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None

class ProjectResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    description: Optional[str] = None
    project_type: str
    status: str
    priority: str
    due_date: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    tasks: List[TaskResponse] = []
    tasks_completed: int = 0
    total_tasks: int = 0

    class Config:
        from_attributes = True

class ProjectListResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    description: Optional[str] = None
    project_type: str
    status: str
    priority: str
    due_date: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    tasks_completed: int = 0
    total_tasks: int = 0

    class Config:
        from_attributes = True