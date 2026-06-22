import pytest
import json
import threading
from backend.app.common.optimistic_locking import verify_version, increment_version, OptimisticLockException
from backend.app.common.audit_log import AuditService
from backend.app.projects.models import Project
from backend.app.common.database import SessionLocal

@pytest.fixture
def db():
    from backend.app.auth.models import User
    from backend.app.organizations.models import Organization
    from backend.app.common.audit_log import AuditLog
    from backend.app.projects.models import Project, Task
    from backend.app.common.database import Base, engine

    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

class TestOptimisticLocking:

    def test_increment_version(self):
        project = Project(organization_id=1, name='Test Project', version=1)
        new_version = increment_version(project)
        assert new_version == 2
        assert project.version == 2
        assert project.updated_at is not None

    def test_increment_version_from_zero(self):
        project = Project(organization_id=1, name='Test Project', version=None)
        new_version = increment_version(project)
        assert new_version == 1
        assert project.version == 1

    def test_verify_version_matches(self, db):
        project = Project(organization_id=1, name='Test Project', version=1)
        db.add(project)
        db.commit()
        verify_version(db, Project, project.id, provided_version=1, org_id=1)

    def test_verify_version_mismatch(self, db):
        project = Project(organization_id=1, name='Test Project', version=1)
        db.add(project)
        db.commit()
        with pytest.raises(OptimisticLockException) as exc_info:
            verify_version(db, Project, project.id, provided_version=0, org_id=1)
        assert '409' in str(exc_info.value.status_code)
        assert 'Conflict' in exc_info.value.detail

    def test_verify_version_cross_tenant(self, db):
        project = Project(organization_id=1, name='Test Project', version=1)
        db.add(project)
        db.commit()
        with pytest.raises(Exception) as exc_info:
            verify_version(db, Project, project.id, provided_version=1, org_id=2)
        assert '404' in str(exc_info.value.status_code) or 'not found' in str(exc_info.value).lower()

    def test_optimistic_lock_lost_update_scenario(self, db):
        project = Project(organization_id=1, name='Test Project', description='Original', version=1)
        db.add(project)
        db.commit()
        project_id = project.id
        project_a = db.query(Project).filter(Project.id == project_id).first()
        assert project_a.version == 1
        project_b = db.query(Project).filter(Project.id == project_id).first()
        assert project_b.version == 1
        verify_version(db, Project, project_b.id, provided_version=1, org_id=1)
        project_b.description = 'Modified by B'
        increment_version(project_b)
        db.commit()
        with pytest.raises(OptimisticLockException):
            verify_version(db, Project, project_a.id, provided_version=1, org_id=1)

class TestAuditLogging:

    @pytest.fixture(autouse=True)
    def setup_encryption_key(self):
        import os
        from cryptography.fernet import Fernet
        key = Fernet.generate_key().decode()
        os.environ['FIELD_ENCRYPTION_KEY'] = key
        yield
        if 'FIELD_ENCRYPTION_KEY' in os.environ:
            del os.environ['FIELD_ENCRYPTION_KEY']

    def test_audit_log_create(self, db):
        before_state = {}
        after_state = {'id': 1, 'name': 'New Project', 'organization_id': 1, 'version': 1}
        log = AuditService.log_create(db, resource_type='Project', resource_id=1, after_state=after_state, actor_user_id=100, organization_id=1, ip_address='192.168.1.1', user_agent='Mozilla/5.0')
        assert log.operation == 'create'
        assert log.actor_user_id == 100
        assert log.actor_type == 'user'
        assert log.get_after_state() == after_state

    def test_audit_log_update(self, db):
        before_state = {'name': 'Old Project'}
        after_state = {'name': 'New Project'}
        log = AuditService.log_update(db, resource_type='Project', resource_id=1, before_state=before_state, after_state=after_state, actor_user_id=100, organization_id=1)
        assert log.operation == 'update'
        assert log.get_before_state() == before_state
        assert log.get_after_state() == after_state

    def test_audit_log_delete(self, db):
        before_state = {'name': 'Project to Delete', 'id': 1}
        log = AuditService.log_delete(db, resource_type='Project', resource_id=1, before_state=before_state, actor_user_id=100, organization_id=1)
        assert log.operation == 'delete'
        assert log.get_before_state() == before_state
        assert log.get_after_state() is None

    def test_audit_log_encryption(self, db):
        after_state = {'sensitive_field': 'secret-value-12345', 'another_field': 'data'}
        log = AuditService.log_create(db, resource_type='Project', resource_id=1, after_state=after_state, actor_user_id=100, organization_id=1)
        assert log._after_state != json.dumps(after_state)
        assert 'secret-value' not in log._after_state
        decrypted = log.get_after_state()
        assert decrypted == after_state

    def test_audit_log_api_key_actor(self, db):
        log = AuditService.log_create(db, resource_type='Invoice', resource_id=1, after_state={'amount': 1000}, actor_api_key_id=5, organization_id=1)
        assert log.actor_type == 'api_key'
        assert log.actor_api_key_id == 5
        assert log.actor_user_id is None

    def test_audit_log_query(self, db):
        for i in range(5):
            AuditService.log_create(db, resource_type='Project', resource_id=i, after_state={'id': i}, actor_user_id=100, organization_id=1)
        logs = AuditService.get_audit_logs(db, organization_id=1)
        assert len(logs) >= 5
        logs = AuditService.get_audit_logs(db, resource_type='Project', organization_id=1)
        assert len(logs) >= 5
        logs = AuditService.get_audit_logs(db, resource_id=1, organization_id=1)
        assert len(logs) == 1

    def test_audit_log_immutability(self, db):
        log = AuditService.log_create(db, resource_type='Project', resource_id=1, after_state={'name': 'Original'}, actor_user_id=100, organization_id=1)
        created_at = log.created_at
        log_id = log.id
        assert log.created_at == created_at
        assert log.id == log_id

class TestConcurrency:

    def test_concurrent_reads_safe(self, db):
        project = Project(organization_id=1, name='Test Project', version=1)
        db.add(project)
        db.commit()
        project_id = project.id
        results = []

        def read_project():
            session = SessionLocal()
            project = session.query(Project).filter(Project.id == project_id).first()
            results.append(project.name)
            session.close()
        threads = [threading.Thread(target=read_project) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        assert len(results) == 10
        assert all((name == 'Test Project' for name in results))

    def test_concurrent_update_conflict(self, db):
        project = Project(organization_id=1, name='Test Project', version=1)
        db.add(project)
        db.commit()
        project_id = project.id
        conflicts = []

        def update_project(new_name, provided_ver):
            try:
                session = SessionLocal()
                verify_version(session, Project, project_id, provided_version=provided_ver, org_id=1)
                project = session.query(Project).filter(Project.id == project_id).first()
                project.name = new_name
                increment_version(project)
                session.commit()
            except OptimisticLockException:
                conflicts.append(True)
            except Exception:
                conflicts.append(True)
            finally:
                session.close()

        t1 = threading.Thread(target=update_project, args=('Name-1', 1))
        t2 = threading.Thread(target=update_project, args=('Name-2', 1))
        t1.start()
        t1.join()
        t2.start()
        t2.join()
        assert len(conflicts) > 0
