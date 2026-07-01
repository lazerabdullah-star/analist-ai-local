import hashlib
import hmac
import os

ITERATIONS = 100_000

def hash_password(password: str, salt_hex: str = None) -> tuple[str, str]:
    """Şifreyi salt ile hashler. Döner: (salt_hex, hash_hex)"""
    salt = bytes.fromhex(salt_hex) if salt_hex else os.urandom(16)
    pw_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, ITERATIONS)
    return salt.hex(), pw_hash.hex()

def verify_password(password: str, salt_hex: str, hash_hex: str) -> bool:
    _, computed = hash_password(password, salt_hex)
    return hmac.compare_digest(computed, hash_hex)
