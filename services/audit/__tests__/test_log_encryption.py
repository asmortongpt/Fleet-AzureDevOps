"""
Tests for Log Encryption

Test coverage:
- Key generation
- Encryption/decryption
- Dictionary encryption
- Authentication tag verification
- Key rotation
- Edge cases and error handling
"""

import pytest
import base64
import json
from cryptography.exceptions import InvalidTag

from ..log_encryption import (
    LogEncryption,
    EncryptionError,
    KeyRotationManager,
)


class TestLogEncryption:
    """Test LogEncryption class"""

    def test_generate_key(self):
        """Test generating encryption key"""
        key = LogEncryption.generate_key()

        # Should be base64-encoded 32-byte key
        decoded = base64.b64decode(key)
        assert len(decoded) == 32

    def test_derive_key_from_password(self):
        """Test deriving key from password"""
        password = "my-secure-password"
        key, salt = LogEncryption.derive_key_from_password(password)

        # Verify key and salt are base64
        decoded_key = base64.b64decode(key)
        decoded_salt = base64.b64decode(salt)

        assert len(decoded_key) == 32
        assert len(decoded_salt) == 16

        # Same password + salt should produce same key
        key2, _ = LogEncryption.derive_key_from_password(password, decoded_salt)
        assert key == key2

    def test_initialization_with_generated_key(self):
        """Test initializing with generated key"""
        key = LogEncryption.generate_key()
        encryption = LogEncryption(key)

        assert encryption.key is not None
        assert len(encryption.key) == 32

    def test_initialization_without_key(self):
        """Test initializing without key generates new one"""
        encryption = LogEncryption()

        assert encryption.key is not None
        assert len(encryption.key) == 32

    def test_initialization_with_invalid_key(self):
        """Test initialization fails with invalid key"""
        with pytest.raises(EncryptionError):
            LogEncryption("not-a-valid-key")

    def test_initialization_with_wrong_size_key(self):
        """Test initialization fails with wrong key size"""
        wrong_key = base64.b64encode(b"short").decode()
        with pytest.raises(EncryptionError):
            LogEncryption(wrong_key)

    def test_encrypt_decrypt(self):
        """Test basic encryption and decryption"""
        encryption = LogEncryption()
        plaintext = "This is sensitive data"

        # Encrypt
        ciphertext = encryption.encrypt(plaintext)

        # Should be base64-encoded
        assert isinstance(ciphertext, str)
        decoded = base64.b64decode(ciphertext)
        assert len(decoded) > len(plaintext)  # Includes IV and tag

        # Decrypt
        decrypted = encryption.decrypt(ciphertext)
        assert decrypted == plaintext

    def test_encrypt_with_associated_data(self):
        """Test encryption with additional authenticated data"""
        encryption = LogEncryption()
        plaintext = "Sensitive data"
        aad = "user_id:123"

        # Encrypt with AAD
        ciphertext = encryption.encrypt(plaintext, aad)

        # Decrypt with correct AAD
        decrypted = encryption.decrypt(ciphertext, aad)
        assert decrypted == plaintext

        # Decrypt with wrong AAD should fail
        with pytest.raises(EncryptionError):
            encryption.decrypt(ciphertext, "wrong_aad")

    def test_decrypt_tampered_data(self):
        """Test decryption fails with tampered data"""
        encryption = LogEncryption()
        plaintext = "Sensitive data"

        ciphertext = encryption.encrypt(plaintext)

        # Tamper with ciphertext
        decoded = base64.b64decode(ciphertext)
        tampered = decoded[:-1] + b'\x00'  # Change last byte
        tampered_ciphertext = base64.b64encode(tampered).decode()

        # Should fail authentication
        with pytest.raises(EncryptionError):
            encryption.decrypt(tampered_ciphertext)

    def test_encrypt_decrypt_unicode(self):
        """Test encryption of Unicode text"""
        encryption = LogEncryption()
        plaintext = "Sensitive data with émojis 🔒🔑"

        ciphertext = encryption.encrypt(plaintext)
        decrypted = encryption.decrypt(ciphertext)

        assert decrypted == plaintext

    def test_encrypt_decrypt_dict(self):
        """Test dictionary encryption"""
        encryption = LogEncryption()
        data = {
            "api_key": "secret123",
            "password": "pass456",
            "nested": {"key": "value"},
        }

        # Encrypt
        ciphertext = encryption.encrypt_dict(data)

        # Decrypt
        decrypted = encryption.decrypt_dict(ciphertext)

        assert decrypted == data

    def test_encrypt_dict_with_aad(self):
        """Test dictionary encryption with AAD"""
        encryption = LogEncryption()
        data = {"secret": "value"}
        aad = "log_id:abc123"

        ciphertext = encryption.encrypt_dict(data, aad)
        decrypted = encryption.decrypt_dict(ciphertext, aad)

        assert decrypted == data

    def test_unique_ciphertexts(self):
        """Test that encrypting same plaintext produces different ciphertexts"""
        encryption = LogEncryption()
        plaintext = "Same text"

        ciphertext1 = encryption.encrypt(plaintext)
        ciphertext2 = encryption.encrypt(plaintext)

        # Should be different due to random IV
        assert ciphertext1 != ciphertext2

        # But both should decrypt to same plaintext
        assert encryption.decrypt(ciphertext1) == plaintext
        assert encryption.decrypt(ciphertext2) == plaintext

    def test_different_keys_produce_different_ciphertexts(self):
        """Test that different keys produce different ciphertexts"""
        key1 = LogEncryption.generate_key()
        key2 = LogEncryption.generate_key()

        enc1 = LogEncryption(key1)
        enc2 = LogEncryption(key2)

        plaintext = "Same text"

        ciphertext1 = enc1.encrypt(plaintext)
        ciphertext2 = enc2.encrypt(plaintext)

        assert ciphertext1 != ciphertext2

        # Can't decrypt with wrong key
        with pytest.raises(EncryptionError):
            enc1.decrypt(ciphertext2)

    def test_rotate_key(self):
        """Test key rotation"""
        old_encryption = LogEncryption()
        plaintext = "Data encrypted with old key"

        # Encrypt with old key
        old_ciphertext = old_encryption.encrypt(plaintext)

        # Rotate to new key
        new_key = LogEncryption.generate_key()
        new_encryption = old_encryption.rotate_key(new_key)

        # Old encryption can still decrypt old data
        assert old_encryption.decrypt(old_ciphertext) == plaintext

        # New encryption uses new key
        new_ciphertext = new_encryption.encrypt(plaintext)
        assert new_encryption.decrypt(new_ciphertext) == plaintext

        # But can't decrypt old data with new key
        with pytest.raises(EncryptionError):
            new_encryption.decrypt(old_ciphertext)

    def test_get_key_hash(self):
        """Test getting key hash for identification"""
        encryption = LogEncryption()
        key_hash = encryption.get_key_hash()

        # Should be hex-encoded SHA-256 hash
        assert isinstance(key_hash, str)
        assert len(key_hash) == 64  # SHA-256 hex length

        # Same key should produce same hash
        hash2 = encryption.get_key_hash()
        assert key_hash == hash2

    def test_constant_time_compare(self):
        """Test constant time string comparison"""
        assert LogEncryption.constant_time_compare("test", "test") is True
        assert LogEncryption.constant_time_compare("test", "fail") is False
        assert LogEncryption.constant_time_compare("", "") is True


class TestKeyRotationManager:
    """Test KeyRotationManager class"""

    def test_manager_initialization(self):
        """Test creating key rotation manager"""
        manager = KeyRotationManager()

        assert manager.keys == {}
        assert manager.current_key_id is None

    def test_add_key(self):
        """Test adding encryption key"""
        manager = KeyRotationManager()
        key = LogEncryption.generate_key()

        manager.add_key("v1", key, make_current=True)

        assert "v1" in manager.keys
        assert manager.current_key_id == "v1"

    def test_encrypt_with_manager(self):
        """Test encrypting with manager"""
        manager = KeyRotationManager()
        key = LogEncryption.generate_key()
        manager.add_key("v1", key, make_current=True)

        plaintext = "Test data"
        encrypted, key_id = manager.encrypt(plaintext)

        assert key_id == "v1"
        assert isinstance(encrypted, str)

    def test_decrypt_with_manager(self):
        """Test decrypting with manager"""
        manager = KeyRotationManager()
        key = LogEncryption.generate_key()
        manager.add_key("v1", key, make_current=True)

        plaintext = "Test data"
        encrypted, key_id = manager.encrypt(plaintext)

        decrypted = manager.decrypt(encrypted, key_id)
        assert decrypted == plaintext

    def test_encrypt_without_key_fails(self):
        """Test encryption fails without key"""
        manager = KeyRotationManager()

        with pytest.raises(EncryptionError):
            manager.encrypt("test")

    def test_decrypt_with_unknown_key_fails(self):
        """Test decryption fails with unknown key ID"""
        manager = KeyRotationManager()

        with pytest.raises(EncryptionError):
            manager.decrypt("encrypted", "unknown_key")

    def test_key_rotation_flow(self):
        """Test complete key rotation flow"""
        manager = KeyRotationManager()

        # Add initial key
        key1 = LogEncryption.generate_key()
        manager.add_key("v1", key1, make_current=True)

        # Encrypt some data
        plaintext = "Important data"
        encrypted_v1, key_id_v1 = manager.encrypt(plaintext)
        assert key_id_v1 == "v1"

        # Rotate to new key
        key2 = LogEncryption.generate_key()
        manager.rotate_key("v2", key2)

        # New encryptions use new key
        encrypted_v2, key_id_v2 = manager.encrypt(plaintext)
        assert key_id_v2 == "v2"

        # Can still decrypt old data with old key
        decrypted_v1 = manager.decrypt(encrypted_v1, "v1")
        assert decrypted_v1 == plaintext

        # Can decrypt new data with new key
        decrypted_v2 = manager.decrypt(encrypted_v2, "v2")
        assert decrypted_v2 == plaintext

    def test_re_encrypt_data(self):
        """Test re-encrypting data with new key"""
        manager = KeyRotationManager()

        # Encrypt with v1
        key1 = LogEncryption.generate_key()
        manager.add_key("v1", key1, make_current=True)

        plaintext = "Data to re-encrypt"
        encrypted_v1, _ = manager.encrypt(plaintext)

        # Add v2 key
        key2 = LogEncryption.generate_key()
        manager.add_key("v2", key2)

        # Re-encrypt from v1 to v2
        encrypted_v2, key_id_v2 = manager.re_encrypt_data(
            encrypted_v1,
            "v1",
            "v2"
        )

        assert key_id_v2 == "v2"

        # Can decrypt with new key
        decrypted = manager.decrypt(encrypted_v2, "v2")
        assert decrypted == plaintext

    def test_re_encrypt_to_current_key(self):
        """Test re-encrypting to current key"""
        manager = KeyRotationManager()

        key1 = LogEncryption.generate_key()
        key2 = LogEncryption.generate_key()

        manager.add_key("v1", key1)
        manager.add_key("v2", key2, make_current=True)

        plaintext = "Data"
        encrypted_v1, _ = manager.encrypt(plaintext)
        manager.current_key_id = "v1"
        encrypted_v1_current, _ = manager.encrypt(plaintext)
        manager.current_key_id = "v2"

        # Re-encrypt to current (v2)
        encrypted_v2, key_id = manager.re_encrypt_data(
            encrypted_v1_current,
            "v1"
        )

        assert key_id == "v2"
        decrypted = manager.decrypt(encrypted_v2, "v2")
        assert decrypted == plaintext

    def test_multiple_key_versions(self):
        """Test managing multiple key versions"""
        manager = KeyRotationManager()

        # Add 3 key versions
        for i in range(1, 4):
            key = LogEncryption.generate_key()
            manager.add_key(f"v{i}", key)

        manager.current_key_id = "v3"

        # Encrypt data with each version
        plaintext = "Test"
        encrypted_data = {}

        for version in ["v1", "v2", "v3"]:
            manager.current_key_id = version
            encrypted, key_id = manager.encrypt(plaintext)
            encrypted_data[version] = encrypted

        # Can decrypt all versions
        for version, encrypted in encrypted_data.items():
            decrypted = manager.decrypt(encrypted, version)
            assert decrypted == plaintext
