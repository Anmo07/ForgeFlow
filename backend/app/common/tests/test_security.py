from app.common.security import verify_password, get_password_hash, password_needs_rehash

def test_argon2_hash_and_verify():
    hashed = get_password_hash('my-secure-password')
    assert verify_password('my-secure-password', hashed)
    assert not verify_password('wrong-password', hashed)
    assert hashed.startswith('$argon2')

def test_legacy_bcrypt_verify_and_needs_rehash():
    import bcrypt
    bcrypt_hash = bcrypt.hashpw(b'legacy-password', bcrypt.gensalt()).decode()
    assert verify_password('legacy-password', bcrypt_hash)
    assert password_needs_rehash(bcrypt_hash)

def test_argon2_does_not_need_rehash_immediately():
    hashed = get_password_hash('fresh-password')
    assert not password_needs_rehash(hashed)