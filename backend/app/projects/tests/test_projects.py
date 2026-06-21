import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.common.database import Base
from app.common.dependencies import get_db, get_current_user
from app.auth.models import User
from app.organizations.models import Organization
from app.memberships.models import Membership
from app.roles.models import Role
from app.permissions.models import Permission
from app.projects.models import Project, Task
from app.main import app
SQLALCHEMY_DATABASE_URL = 'sqlite:///./test_projects_module.db'
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope='function')
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    user = User(id=1, email='projectuser@example.com', hashed_password='dummy_hash', full_name='Project Manager', is_active=True)
    db.add(user)
    org = Organization(id=1, name='Test Org', slug='test-org')
    db.add(org)
    p_create = Permission(id=1, name='project:create', description='Create projects')
    p_update = Permission(id=2, name='project:update', description='Update projects')
    p_delete = Permission(id=3, name='project:delete', description='Delete projects')
    db.add(p_create)
    db.add(p_update)
    db.add(p_delete)
    role = Role(id=1, name='Project Lead', is_system=True)
    role.permissions.extend([p_create, p_update, p_delete])
    db.add(role)
    mem = Membership(id=1, user_id=1, organization_id=1, role_id=1, status='active')
    db.add(mem)
    db.commit()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope='function')
def client(db_session):

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        return User(id=1, email='projectuser@example.com', hashed_password='dummy_hash', full_name='Project Manager', is_active=True)

    def override_get_current_tenant():
        from app.common.tenant import TenantContext
        return TenantContext(organization_id=1, user_id=1, role_id=1, permissions=['project:create', 'project:update', 'project:delete'])

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    from app.common.tenant import get_current_tenant
    app.dependency_overrides[get_current_tenant] = override_get_current_tenant
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_create_project(client):
    response = client.post('/api/projects', json={'name': 'Alpha Project', 'description': 'Important project alpha', 'status': 'planning', 'priority': 'high', 'due_date': '2026-12-31'}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 201
    data = response.json()
    assert data['name'] == 'Alpha Project'
    assert data['description'] == 'Important project alpha'
    assert data['status'] == 'planning'
    assert data['priority'] == 'high'
    assert data['due_date'] == '2026-12-31'
    assert 'id' in data
    assert data['total_tasks'] == 0

def test_list_projects(client, db_session):
    proj = Project(organization_id=1, name='Existing Project', description='An existing project', status='in_progress')
    db_session.add(proj)
    db_session.commit()
    response = client.get('/api/projects', headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]['name'] == 'Existing Project'

def test_get_project(client, db_session):
    proj = Project(organization_id=1, name='Project Alpha', description='Alpha details')
    db_session.add(proj)
    db_session.commit()
    response = client.get(f'/api/projects/{proj.id}', headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    data = response.json()
    assert data['name'] == 'Project Alpha'

def test_update_project(client, db_session):
    proj = Project(organization_id=1, name='Old Name', description='Old description')
    db_session.add(proj)
    db_session.commit()
    response = client.put(f'/api/projects/{proj.id}', json={'name': 'New Name', 'status': 'completed'}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    data = response.json()
    assert data['name'] == 'New Name'
    assert data['status'] == 'completed'

def test_delete_project(client, db_session):
    proj = Project(organization_id=1, name='To Delete')
    db_session.add(proj)
    db_session.commit()
    response = client.delete(f'/api/projects/{proj.id}', headers={'X-Organization-ID': '1'})
    assert response.status_code == 204
    assert db_session.query(Project).filter(Project.id == proj.id).first() is None

def test_create_task(client, db_session):
    proj = Project(organization_id=1, name='Task Project')
    db_session.add(proj)
    db_session.commit()
    response = client.post(f'/api/projects/{proj.id}/tasks', json={'title': 'New Task', 'description': 'Task description', 'status': 'todo', 'priority': 'low'}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 201
    data = response.json()
    assert data['title'] == 'New Task'
    assert data['status'] == 'todo'
    assert data['priority'] == 'low'
    assert data['project_id'] == proj.id

def test_update_task(client, db_session):
    proj = Project(organization_id=1, name='Task Project')
    db_session.add(proj)
    db_session.commit()
    task = Task(project_id=proj.id, title='Original Task Title', status='todo')
    db_session.add(task)
    db_session.commit()
    response = client.put(f'/api/projects/{proj.id}/tasks/{task.id}', json={'title': 'Updated Task Title', 'status': 'in_progress'}, headers={'X-Organization-ID': '1'})
    assert response.status_code == 200
    data = response.json()
    assert data['title'] == 'Updated Task Title'
    assert data['status'] == 'in_progress'

def test_delete_task(client, db_session):
    proj = Project(organization_id=1, name='Task Project')
    db_session.add(proj)
    db_session.commit()
    task = Task(project_id=proj.id, title='To Delete')
    db_session.add(task)
    db_session.commit()
    response = client.delete(f'/api/projects/{proj.id}/tasks/{task.id}', headers={'X-Organization-ID': '1'})
    assert response.status_code == 204
    assert db_session.query(Task).filter(Task.id == task.id).first() is None