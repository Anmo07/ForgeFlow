import pytest
import os
from cryptography.fernet import Fernet
from backend.app.common.encryption import encrypt_field, decrypt_field
from backend.app.common.email_service import EmailService, ConsoleBackend, FileBackend
from backend.app.common.tenant_filtering import set_tenant_context, get_tenant_context
from backend.app.common.unverified_restriction import require_verified

class TestFieldEncryption:

    @pytest.fixture(autouse=True)
    def setup_encryption_key(self):
        key = Fernet.generate_key().decode()
        os.environ['FIELD_ENCRYPTION_KEY'] = key
        yield
        if 'FIELD_ENCRYPTION_KEY' in os.environ:
            del os.environ['FIELD_ENCRYPTION_KEY']

    def test_encrypt_decrypt_field(self):
        plaintext = 'my-secret-value-12345'
        ciphertext = encrypt_field(plaintext)
        assert ciphertext != plaintext
        assert len(ciphertext) > len(plaintext)
        decrypted = decrypt_field(ciphertext)
        assert decrypted == plaintext

    def test_encrypt_empty_field(self):
        assert encrypt_field(None) is None
        assert encrypt_field('') == ''

    def test_decrypt_empty_field(self):
        assert decrypt_field(None) is None
        assert decrypt_field('') == ''

    def test_encryption_produces_different_ciphertext(self):
        plaintext = 'test-value'
        ciphertext1 = encrypt_field(plaintext)
        ciphertext2 = encrypt_field(plaintext)
        assert ciphertext1 != ciphertext2
        assert decrypt_field(ciphertext1) == plaintext
        assert decrypt_field(ciphertext2) == plaintext

    def test_invalid_encryption_key(self):
        os.environ['FIELD_ENCRYPTION_KEY'] = 'not-a-valid-fernet-key'
        with pytest.raises(ValueError, match='Invalid FIELD_ENCRYPTION_KEY'):
            encrypt_field('test')

    def test_missing_encryption_key(self):
        if 'FIELD_ENCRYPTION_KEY' in os.environ:
            del os.environ['FIELD_ENCRYPTION_KEY']
        with pytest.raises(ValueError, match='FIELD_ENCRYPTION_KEY'):
            encrypt_field('test')

class TestTenantContext:

    def test_set_and_get_tenant_context(self):
        assert get_tenant_context() is None
        set_tenant_context(1)
        assert get_tenant_context() == 1
        set_tenant_context(2)
        assert get_tenant_context() == 2
        set_tenant_context(None)
        assert get_tenant_context() is None

    def test_tenant_context_isolation(self):
        import asyncio

        async def task1():
            set_tenant_context(1)
            await asyncio.sleep(0.01)
            return get_tenant_context()

        async def task2():
            set_tenant_context(2)
            await asyncio.sleep(0.01)
            return get_tenant_context()

        async def run_tasks():
            results = await asyncio.gather(task1(), task2())
            return results
        results = asyncio.run(run_tasks())
        assert 1 in results
        assert 2 in results

class TestEmailService:

    def test_console_backend_send(self):
        backend = ConsoleBackend()
        result = backend.send(to='test@example.com', subject='Test', html_body='<p>Test</p>')
        assert result is True

    def test_file_backend_send(self, tmp_path):
        os.environ['EMAIL_LOG_DIR'] = str(tmp_path)
        backend = FileBackend()
        result = backend.send(to='test@example.com', subject='Test', html_body='<p>Test</p>', text_body='Test')
        assert result is True
        files = list(tmp_path.glob('*.json'))
        assert len(files) >= 1

    def test_invite_email_template(self):
        service = EmailService()
        emails = []

        class MockBackend:

            def send(self, to, subject, html_body, text_body=None):
                emails.append({'to': to, 'subject': subject, 'html_body': html_body, 'text_body': text_body})
                return True
        service.backend = MockBackend()
        result = service.send_invite_email(to_email='invitee@example.com', invite_token='test-token-123', org_name='Test Org', inviter_name='Alice')
        assert result is True
        assert len(emails) == 1
        email = emails[0]
        assert email['to'] == 'invitee@example.com'
        assert 'Test Org' in email['subject']
        assert 'Alice' in email['html_body']
        assert 'Accept Invitation' in email['html_body']

    def test_password_reset_email_template(self):
        service = EmailService()
        emails = []

        class MockBackend:

            def send(self, to, subject, html_body, text_body=None):
                emails.append({'to': to, 'subject': subject, 'html_body': html_body})
                return True
        service.backend = MockBackend()
        result = service.send_password_reset_email(to_email='user@example.com', reset_token='reset-token-456')
        assert result is True
        assert len(emails) == 1
        email = emails[0]
        assert email['to'] == 'user@example.com'
        assert 'password' in email['subject'].lower()
        assert 'Reset Password' in email['html_body']

    def test_email_verification_template(self):
        service = EmailService()
        emails = []

        class MockBackend:

            def send(self, to, subject, html_body, text_body=None):
                emails.append({'to': to, 'subject': subject, 'html_body': html_body})
                return True
        service.backend = MockBackend()
        result = service.send_email_verification(to_email='verify@example.com', verification_token='verify-token-789')
        assert result is True
        assert len(emails) == 1
        email = emails[0]
        assert email['to'] == 'verify@example.com'
        assert 'verify' in email['subject'].lower()
        assert 'Verify Email' in email['html_body']

class TestUnverifiedRestrictions:

    def test_require_verified_decorator_allows_verified(self):
        from backend.app.auth.models import User
        from backend.app.common.security import get_password_hash
        mock_user = User(email='verified@example.com', hashed_password=get_password_hash('test'), is_verified=True)

        @require_verified
        async def protected_endpoint(current_user):
            return {'message': 'Success'}
        import asyncio
        result = asyncio.run(protected_endpoint(current_user=mock_user))
        assert result['message'] == 'Success'

    def test_require_verified_decorator_rejects_unverified(self):
        from backend.app.auth.models import User
        from backend.app.common.security import get_password_hash
        from fastapi import HTTPException
        mock_user = User(email='unverified@example.com', hashed_password=get_password_hash('test'), is_verified=False)

        @require_verified
        async def protected_endpoint(current_user):
            return {'message': 'Success'}
        import asyncio
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(protected_endpoint(current_user=mock_user))
        assert exc_info.value.status_code == 403
        assert 'verification required' in exc_info.value.detail.lower()