"""Tests for Phase 5 — Cryptographic Key Versioning (encryption.py)."""

import os
import pytest
from cryptography.fernet import Fernet

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _generate_key() -> str:
    return Fernet.generate_key().decode()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    """Ensure a clean encryption environment for every test."""
    monkeypatch.delenv('FIELD_ENCRYPTION_KEY', raising=False)
    monkeypatch.delenv('FIELD_ENCRYPTION_KEYS_JSON', raising=False)
    monkeypatch.delenv('FIELD_ENCRYPTION_ACTIVE_VERSION', raising=False)
    # Reset the cached KeyManager singleton before each test
    from app.common.encryption import reset_key_manager
    reset_key_manager()
    yield
    reset_key_manager()


# ---------------------------------------------------------------------------
# Task 1 Tests
# ---------------------------------------------------------------------------

class TestEncryptWithVersionPrefix:

    def test_encrypted_output_has_version_prefix(self, monkeypatch):
        key = _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEY', key)
        from app.common.encryption import encrypt_field
        result = encrypt_field('hello world')
        assert result.startswith('v1:')

    def test_version_prefix_with_multi_key(self, monkeypatch):
        import json
        k1, k2 = _generate_key(), _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEYS_JSON', json.dumps({'v1': k1, 'v2': k2}))
        monkeypatch.setenv('FIELD_ENCRYPTION_ACTIVE_VERSION', 'v2')
        from app.common.encryption import encrypt_field
        result = encrypt_field('secret data')
        assert result.startswith('v2:')


class TestDecryptVersionedCiphertext:

    def test_roundtrip(self, monkeypatch):
        key = _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEY', key)
        from app.common.encryption import encrypt_field, decrypt_field
        ciphertext = encrypt_field('roundtrip test')
        assert decrypt_field(ciphertext) == 'roundtrip test'

    def test_roundtrip_multi_key(self, monkeypatch):
        import json
        k1, k2 = _generate_key(), _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEYS_JSON', json.dumps({'v1': k1, 'v2': k2}))
        from app.common.encryption import encrypt_field, decrypt_field
        ciphertext = encrypt_field('multi-key test')
        assert decrypt_field(ciphertext) == 'multi-key test'


class TestDecryptLegacyUnversioned:

    def test_legacy_ciphertext_decrypts(self, monkeypatch):
        """Ciphertext produced without a version prefix (legacy format) should decrypt via v1."""
        key = _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEY', key)
        # Produce a raw Fernet ciphertext without version prefix (simulating legacy data)
        f = Fernet(key.encode())
        legacy_ciphertext = f.encrypt(b'legacy secret').decode()
        assert not legacy_ciphertext.startswith('v')  # sanity check: no version prefix
        from app.common.encryption import decrypt_field
        assert decrypt_field(legacy_ciphertext) == 'legacy secret'


class TestKeyRotationOldDataStillDecrypts:

    def test_v1_data_decrypts_after_rotation_to_v2(self, monkeypatch):
        import json
        k1 = _generate_key()
        # Step 1: encrypt with v1 only
        monkeypatch.setenv('FIELD_ENCRYPTION_KEY', k1)
        from app.common.encryption import encrypt_field, decrypt_field, reset_key_manager
        ciphertext_v1 = encrypt_field('old data')
        assert ciphertext_v1.startswith('v1:')
        # Step 2: rotate — add v2, set active to v2
        k2 = _generate_key()
        monkeypatch.delenv('FIELD_ENCRYPTION_KEY', raising=False)
        monkeypatch.setenv('FIELD_ENCRYPTION_KEYS_JSON', json.dumps({'v1': k1, 'v2': k2}))
        monkeypatch.setenv('FIELD_ENCRYPTION_ACTIVE_VERSION', 'v2')
        reset_key_manager()
        # v1 data should still decrypt
        assert decrypt_field(ciphertext_v1) == 'old data'
        # New data should use v2
        ciphertext_v2 = encrypt_field('new data')
        assert ciphertext_v2.startswith('v2:')
        assert decrypt_field(ciphertext_v2) == 'new data'


class TestEncryptUsesActiveVersion:

    def test_default_active_is_highest(self, monkeypatch):
        import json
        k1, k2, k3 = _generate_key(), _generate_key(), _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEYS_JSON', json.dumps({'v1': k1, 'v3': k3, 'v2': k2}))
        from app.common.encryption import encrypt_field
        result = encrypt_field('auto-highest')
        assert result.startswith('v3:')

    def test_explicit_active_version(self, monkeypatch):
        import json
        k1, k2 = _generate_key(), _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEYS_JSON', json.dumps({'v1': k1, 'v2': k2}))
        monkeypatch.setenv('FIELD_ENCRYPTION_ACTIVE_VERSION', 'v1')
        from app.common.encryption import encrypt_field
        result = encrypt_field('explicit-v1')
        assert result.startswith('v1:')


class TestMissingKeyRaisesError:

    def test_unknown_version_prefix_raises(self, monkeypatch):
        key = _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEY', key)
        from app.common.encryption import decrypt_field
        # Fabricate a ciphertext with unknown version
        f = Fernet(key.encode())
        raw = f.encrypt(b'data').decode()
        bad_ciphertext = f'v99:{raw}'
        with pytest.raises(KeyError, match='v99'):
            decrypt_field(bad_ciphertext)

    def test_no_keys_configured_raises(self):
        # No env vars set at all
        from app.common.encryption import reset_key_manager
        reset_key_manager()
        with pytest.raises(ValueError, match='No encryption keys configured'):
            from app.common import encryption
            # Force re-initialization
            encryption._key_manager = None
            encryption._get_key_manager()


class TestEncryptedStringDescriptor:

    def test_descriptor_roundtrip(self, monkeypatch):
        key = _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEY', key)
        from app.common.encryption import EncryptedString

        class FakeModel:
            _secret_encrypted = None
            secret = EncryptedString('_secret_encrypted')

        obj = FakeModel()
        obj.secret = 'descriptor test'
        # Verify the raw column has the version prefix
        assert obj._secret_encrypted.startswith('v1:')
        # Verify reading back decrypts
        assert obj.secret == 'descriptor test'

    def test_descriptor_none_handling(self, monkeypatch):
        key = _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEY', key)
        from app.common.encryption import EncryptedString

        class FakeModel:
            _secret_encrypted = None
            secret = EncryptedString('_secret_encrypted')

        obj = FakeModel()
        assert obj.secret is None
        obj.secret = None
        assert obj._secret_encrypted is None


class TestEncryptDecryptNoneAndEmpty:

    def test_encrypt_none(self, monkeypatch):
        key = _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEY', key)
        from app.common.encryption import encrypt_field
        assert encrypt_field(None) is None

    def test_decrypt_none(self, monkeypatch):
        key = _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEY', key)
        from app.common.encryption import decrypt_field
        assert decrypt_field(None) is None

    def test_encrypt_empty_string(self, monkeypatch):
        key = _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEY', key)
        from app.common.encryption import encrypt_field
        assert encrypt_field('') == ''

    def test_decrypt_empty_string(self, monkeypatch):
        key = _generate_key()
        monkeypatch.setenv('FIELD_ENCRYPTION_KEY', key)
        from app.common.encryption import decrypt_field
        assert decrypt_field('') == ''
