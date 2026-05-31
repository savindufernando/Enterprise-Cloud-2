"""Unit tests for AES-256 Symmetric Field Encryption/Decryption. ★ Enhancement #17"""

from shared.utils.encryption import encrypt_field, decrypt_field

def test_encryption_and_decryption_success():
    """Verify that sensitive values can be successfully encrypted and decrypted back to matching plaintext."""
    plaintext = "N8938171"
    
    # 1. Encrypt the plaintext
    ciphertext = encrypt_field(plaintext)
    assert ciphertext is not None
    assert ciphertext != plaintext
    
    # 2. Decrypt the ciphertext back to plaintext
    decrypted = decrypt_field(ciphertext)
    assert decrypted == plaintext


def test_encryption_preserves_none_and_redacted():
    """Verify that encrypt_field gracefully leaves None and 'REDACTED' values untouched."""
    assert encrypt_field(None) is None
    assert encrypt_field("REDACTED") == "REDACTED"


def test_decryption_handles_plaintext_and_none_gracefully():
    """Verify that decrypt_field handles standard plaintext, None, and 'REDACTED' values without raising errors."""
    assert decrypt_field(None) is None
    assert decrypt_field("REDACTED") == "REDACTED"
    assert decrypt_field("unencrypted_plaintext") == "unencrypted_plaintext"
