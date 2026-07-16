"""
Field-level encryption with cryptographic key versioning.

Encrypted strings are stored as ``v<N>:<ciphertext_base64>``.
Decryption parses the version prefix and selects the corresponding key.
Legacy data without a prefix is transparently decrypted with the v1 key.

Key sources (checked in order):
1. ``FIELD_ENCRYPTION_KEYS_JSON`` — JSON object mapping version tags to
   Fernet keys, e.g. ``{"v1": "<key1>", "v2": "<key2>"}``.
2. ``FIELD_ENCRYPTION_KEY`` — single Fernet key treated as ``v1``.
"""

import json
import os
import re
from typing import Dict, Optional

from cryptography.fernet import Fernet


class KeyManager:
    """Manages versioned Fernet encryption keys."""

    def __init__(self) -> None:
        self._keys: Dict[str, bytes] = {}
        self._active_version: Optional[str] = None
        self._load_keys()

    def _load_keys(self) -> None:
        keys_json = os.getenv('FIELD_ENCRYPTION_KEYS_JSON')
        single_key = os.getenv('FIELD_ENCRYPTION_KEY')

        if keys_json:
            try:
                raw: Dict[str, str] = json.loads(keys_json)
            except (json.JSONDecodeError, TypeError) as e:
                raise ValueError(f'Invalid FIELD_ENCRYPTION_KEYS_JSON: {e}')
            for version, key_str in raw.items():
                if not re.match(r'^v\d+$', version):
                    raise ValueError(
                        f"Key version tag '{version}' is invalid. "
                        "Must match pattern 'v<N>' (e.g. v1, v2)."
                    )
                try:
                    Fernet(key_str.encode() if isinstance(key_str, str) else key_str)
                except Exception as e:
                    raise ValueError(f"Invalid FIELD_ENCRYPTION_KEYS_JSON: {e}")
                self._keys[version] = key_str.encode() if isinstance(key_str, str) else key_str
        elif single_key:
            try:
                Fernet(single_key.encode() if isinstance(single_key, str) else single_key)
            except Exception as e:
                raise ValueError(f"Invalid FIELD_ENCRYPTION_KEY: {e}")
            self._keys['v1'] = single_key.encode() if isinstance(single_key, str) else single_key
        else:
            raise ValueError(
                "No encryption keys configured. Set FIELD_ENCRYPTION_KEYS_JSON "
                "or FIELD_ENCRYPTION_KEY. Generate a key with: "
                "python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
            )

        # Determine active version
        explicit_version = os.getenv('FIELD_ENCRYPTION_ACTIVE_VERSION')
        if explicit_version:
            if explicit_version not in self._keys:
                raise ValueError(
                    f"FIELD_ENCRYPTION_ACTIVE_VERSION='{explicit_version}' "
                    f"but that version is not present in the key map. "
                    f"Available: {sorted(self._keys.keys())}"
                )
            self._active_version = explicit_version
        else:
            # Default to the highest version number
            self._active_version = max(
                self._keys.keys(),
                key=lambda v: int(v[1:])  # sort by numeric suffix
            )

    @property
    def active_version(self) -> str:
        """The version tag used for new encryptions."""
        return self._active_version

    @property
    def active_key(self) -> bytes:
        """The Fernet key bytes used for new encryptions."""
        return self._keys[self._active_version]

    def get_key(self, version: str) -> bytes:
        """Return the Fernet key for a given version tag.

        Raises ``KeyError`` if the version is unknown.
        """
        if version not in self._keys:
            raise KeyError(
                f"Encryption key version '{version}' not found. "
                f"Available versions: {sorted(self._keys.keys())}"
            )
        return self._keys[version]

    @property
    def versions(self) -> list:
        """List of all available key version tags."""
        return sorted(self._keys.keys(), key=lambda v: int(v[1:]))


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
_key_manager: Optional[KeyManager] = None


def _get_key_manager() -> KeyManager:
    global _key_manager
    if _key_manager is None:
        _key_manager = KeyManager()
    return _key_manager


def reset_key_manager() -> None:
    """Reset the cached key manager (useful for testing)."""
    global _key_manager
    _key_manager = None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_VERSION_PREFIX_RE = re.compile(r'^(v\d+):(.+)$', re.DOTALL)

def encrypt_field(plaintext: Optional[str]) -> Optional[str]:
    """Encrypt a plaintext string using the active key version.

    Returns a string in the format ``v<N>:<ciphertext_base64>``.
    """
    if plaintext is None:
        return None
    if plaintext == '':
        return ''
    try:
        km = _get_key_manager()
        f = Fernet(km.active_key)
        encrypted = f.encrypt(plaintext.encode())
        return f'{km.active_version}:{encrypted.decode()}'
    except Exception as e:
        raise ValueError(f'Encryption failed: {e}')


def decrypt_field(ciphertext: Optional[str]) -> Optional[str]:
    """Decrypt a ciphertext string.

    Supports both versioned (``v<N>:...``) and legacy (unversioned) formats.
    """
    if ciphertext is None:
        return None
    if ciphertext == '':
        return ''
    try:
        km = _get_key_manager()
        match = _VERSION_PREFIX_RE.match(ciphertext)
        if match:
            version = match.group(1)
            raw_ciphertext = match.group(2)
            key = km.get_key(version)
        else:
            # Legacy format — no version prefix, treat as v1
            raw_ciphertext = ciphertext
            key = km.get_key('v1')
        f = Fernet(key)
        decrypted = f.decrypt(raw_ciphertext.encode())
        return decrypted.decode()
    except KeyError:
        raise
    except Exception as e:
        raise ValueError(f'Decryption failed: {e}')


class EncryptedString:
    """ORM descriptor for transparent field-level encryption.

    Usage on a SQLAlchemy model::

        class MyModel(Base):
            _secret_encrypted = Column(String, nullable=True)
            secret = EncryptedString('_secret_encrypted')
    """

    def __init__(self, db_column_name: str):
        self.db_column_name = db_column_name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        encrypted_value = getattr(obj, self.db_column_name, None)
        if encrypted_value is None:
            return None
        try:
            return decrypt_field(encrypted_value)
        except Exception:
            return None

    def __set__(self, obj, value):
        if value is None:
            setattr(obj, self.db_column_name, None)
        else:
            encrypted_value = encrypt_field(value)
            setattr(obj, self.db_column_name, encrypted_value)