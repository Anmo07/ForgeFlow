import os
from cryptography.fernet import Fernet

def derive_encryption_key() -> bytes:
    key_str = os.getenv('FIELD_ENCRYPTION_KEY')
    if not key_str:
        raise ValueError("FIELD_ENCRYPTION_KEY not set. Generate with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())' and set env var.")
    try:
        return key_str.encode() if isinstance(key_str, str) else key_str
    except Exception as e:
        raise ValueError(f'Invalid FIELD_ENCRYPTION_KEY format: {e}')

def encrypt_field(plaintext: str) -> str:
    if not plaintext:
        return None
    try:
        key = derive_encryption_key()
        f = Fernet(key)
        encrypted = f.encrypt(plaintext.encode())
        return encrypted.decode()
    except Exception as e:
        raise ValueError(f'Encryption failed: {e}')

def decrypt_field(ciphertext: str) -> str:
    if not ciphertext:
        return None
    try:
        key = derive_encryption_key()
        f = Fernet(key)
        decrypted = f.decrypt(ciphertext.encode())
        return decrypted.decode()
    except Exception as e:
        raise ValueError(f'Decryption failed: {e}')

class EncryptedString:

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