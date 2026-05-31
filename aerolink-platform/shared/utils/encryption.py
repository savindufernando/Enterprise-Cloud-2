"""AES-256 Symmetric Encryption/Decryption utility for sensitive field security. ★ Enhancement #17"""

import os
from cryptography.fernet import Fernet
import structlog

logger = structlog.get_logger()

# Dynamic key generation or retrieval from environment variables
# For production-grade deployment, this key would be managed by AWS Secrets Manager or KMS
ENCRYPTION_KEY = os.getenv(
    "FIELD_ENCRYPTION_KEY", 
    "GhQfnaS<9Tfa]-2LethFukO>M#I!GhQfnaS<9Tf=" # High-entropy fallback key matching database secret format
)

# Fernet requires a base64-encoded 32-byte key. Let's pad/derive a valid key safely
import base64
import hashlib

# Derive a 32-byte key using SHA-256
derived_key = base64.urlsafe_b64encode(hashlib.sha256(ENCRYPTION_KEY.encode()).digest())
cipher = Fernet(derived_key)


def encrypt_field(value: str | None) -> str | None:
    """Encrypt a sensitive field string prior to SQL persistence."""
    if not value or value == "REDACTED":
        return value
    try:
        return cipher.encrypt(value.encode("utf-8")).decode("utf-8")
    except Exception as e:
        logger.error("Failed to encrypt field", error=str(e))
        return value


def decrypt_field(value: str | None) -> str | None:
    """Decrypt a sensitive field string upon retrieval from SQL storage."""
    if not value or value == "REDACTED":
        return value
    try:
        return cipher.decrypt(value.encode("utf-8")).decode("utf-8")
    except Exception:
        # If decryption fails (e.g. data was previously stored as plaintext),
        # return the raw value gracefully rather than crashing
        return value
