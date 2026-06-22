from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..common.database import Base, SoftDeleteMixin

# Association table for task self-referential dependencies
task_dependencies = Table(
    'task_dependencies',
    Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id', ondelete='CASCADE'), primary_key=True, index=True),
    Column('depends_on_id', Integer, ForeignKey('tasks.id', ondelete='CASCADE'), primary_key=True, index=True)
)

class Project(Base, SoftDeleteMixin):
    __tablename__ = 'projects'
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True)
    client_organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    project_type = Column(String, default='Retainer_SLA', nullable=False)  # e.g., Onboarding, Migration, Retainer_SLA
    status = Column(String, default='planning')
    priority = Column(String, default='medium')
    due_date = Column(Date, nullable=True)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    tasks = relationship('Task', back_populates='project', cascade='all, delete-orphan')

class Task(Base, SoftDeleteMixin):
    __tablename__ = 'tasks'
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    client_organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default='todo')  # Backlog, Todo, In Progress, Review, Done, Archived
    priority = Column(String, default='medium')  # Low, Medium, High, Critical
    assigned_to = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    due_date = Column(Date, nullable=True)
    version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    project = relationship('Project', back_populates='tasks')
    
    # Self-referential relationship for task dependencies
    dependencies = relationship(
        'Task',
        secondary=task_dependencies,
        primaryjoin='Task.id==task_dependencies.c.task_id',
        secondaryjoin='Task.id==task_dependencies.c.depends_on_id',
        backref='dependent_tasks'
    )