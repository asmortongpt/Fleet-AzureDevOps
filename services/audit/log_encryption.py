"""
Log Encryption - AES-256 encryption for sensitive audit log data

This module provides secure encryption and decryption of sensitive data
in audit logs using AES-256-GCM for authenticated encryption.

Security Features:
- AES-256-GCM authenticated encryption
- Unique IV (initialization vector) per encryption
- Key rotation support
- Secure key derivation from password
- Protection against tampering (authentication tag)
"""

import base64
import hashlib
import os
import secrets
from typing import Optional, Dict, Any
import json

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.exceptions import InvalidTag


class EncryptionError(Exception):
    """Raised when encryption/decryption fails"""
    pass


class LogEncryption:
    """
    AES-256-GCM encryption for sensitive audit log data

    Provides authenticated encryption to ensure:
    1. Confidentiality - Data cannot be read without the key
    2. Integrity - Data cannot be modified without detection
    3. Authenticity - Encrypted data came from holder of the key

    Key Management:
    - Keys should be 32 bytes (256 bits) for AES-256
    - Keys should be stored in Azure Key Vault in production
    - Support for key rotation with versioning
    """

    # AES-256 requires 32-byte keys
    KEY_SIZE = 32  # 256 bits
    IV_SIZE = 12   # 96 bits (recommended for GCM)
    TAG_SIZE = 16  # 128 bits (authentication tag)

    def __init__(self, encryption_key: Optional[str] = None):
        """
        Initialize encryption with a key

        Args:
            encryption_key: Base64-encoded 32-byte key, or None to generate new key

        Raises:
            EncryptionError: If key is invalid
        """
        if encryption_key:
            try:
                self.key = base64.b64decode(encryption_key)
                if len(self.key) != self.KEY_SIZE:
                    raise EncryptionError(
                        f"Invalid key size: expected {self.KEY_SIZE} bytes, got {len(self.key)}"
                    )
            except Exception as e:
                raise EncryptionError(f"Invalid encryption key: {e}")
        else:
            # Generate a new random key
            self.key = secrets.token_bytes(self.KEY_SIZE)

        self.aesgcm = AESGCM(self.key)

    @classmethod
    def generate_key(cls) -> str:
        """
        Generate a new random encryption key

        Returns:
            Base64-encoded 32-byte key suitable for AES-256
        """
        key = secrets.token_bytes(cls.KEY_SIZE)
        return base64.b64encode(key).decode('utf-8')

    @classmethod
    def derive_key_from_password(cls, password: str, salt: Optional[bytes] = None) -> tuple[str, str]:
        """
        Derive encryption key from password using PBKDF2

        Args:
            password: Password to derive key from
            salt: Optional salt (generated if not provided)

        Returns:
            Tuple of (base64_key, base64_salt)

        Note: In production, use a proper key management system (Azure Key Vault)
              This method is for development/testing only
        """
        if salt is None:
            salt = secrets.token_bytes(16)

        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=cls.KEY_SIZE,
            salt=salt,
            iterations=100000,  # NIST recommends 10,000+ iterations
        )

        key = kdf.derive(password.encode('utf-8'))

        return (
            base64.b64encode(key).decode('utf-8'),
            base64.b64encode(salt).decode('utf-8')
        )

    def encrypt(self, plaintext: str, associated_data: Optional[str] = None) -> str:
        """
        Encrypt plaintext using AES-256-GCM

        Args:
            plaintext: String to encrypt
            associated_data: Optional additional authenticated data (not encrypted but authenticated)

        Returns:
            Base64-encoded encrypted data (format: iv||ciphertext||tag)

        Raises:
            EncryptionError: If encryption fails
        """
        try:
            # Generate random IV (nonce)
            iv = secrets.token_bytes(self.IV_SIZE)

            # Convert to bytes
            plaintext_bytes = plaintext.encode('utf-8')
            aad = associated_data.encode('utf-8') if associated_data else None

            # Encrypt (GCM automatically handles authentication tag)
            ciphertext = self.aesgcm.encrypt(iv, plaintext_bytes, aad)

            # Combine IV + ciphertext (ciphertext includes auth tag)
            encrypted_data = iv + ciphertext

            # Base64 encode for storage
            return base64.b64encode(encrypted_data).decode('utf-8')

        except Exception as e:
            raise EncryptionError(f"Encryption failed: {e}")

    def decrypt(self, encrypted_data: str, associated_data: Optional[str] = None) -> str:
        """
        Decrypt data encrypted with encrypt()

        Args:
            encrypted_data: Base64-encoded encrypted data
            associated_data: Optional additional authenticated data (must match encryption)

        Returns:
            Decrypted plaintext string

        Raises:
            EncryptionError: If decryption fails or authentication fails
        """
        try:
            # Decode from base64
            data = base64.b64decode(encrypted_data)

            # Extract IV and ciphertext
            iv = data[:self.IV_SIZE]
            ciphertext = data[self.IV_SIZE:]

            # Convert associated data
            aad = associated_data.encode('utf-8') if associated_data else None

            # Decrypt and verify authentication tag
            plaintext_bytes = self.aesgcm.decrypt(iv, ciphertext, aad)

            return plaintext_bytes.decode('utf-8')

        except InvalidTag:
            raise EncryptionError("Authentication failed: data has been tampered with")
        except Exception as e:
            raise EncryptionError(f"Decryption failed: {e}")

    def encrypt_dict(self, data: Dict[str, Any], associated_data: Optional[str] = None) -> str:
        """
        Encrypt a dictionary as JSON

        Args:
            data: Dictionary to encrypt
            associated_data: Optional additional authenticated data

        Returns:
            Base64-encoded encrypted JSON
        """
        json_str = json.dumps(data, sort_keys=True)
        return self.encrypt(json_str, associated_data)

    def decrypt_dict(self, encrypted_data: str, associated_data: Optional[str] = None) -> Dict[str, Any]:
        """
        Decrypt data encrypted with encrypt_dict()

        Args:
            encrypted_data: Base64-encoded encrypted JSON
            associated_data: Optional additional authenticated data

        Returns:
            Decrypted dictionary
        """
        json_str = self.decrypt(encrypted_data, associated_data)
        return json.loads(json_str)

    def rotate_key(self, new_key: str) -> 'LogEncryption':
        """
        Rotate to a new encryption key

        Args:
            new_key: Base64-encoded new key

        Returns:
            New LogEncryption instance with new key

        Note: After key rotation, you must re-encrypt all existing encrypted data
              Use the old instance to decrypt, new instance to re-encrypt
        """
        return LogEncryption(new_key)

    def get_key_hash(self) -> str:
        """
        Get SHA-256 hash of the current key (for identification)

        Returns:
            Hex-encoded SHA-256 hash of key

        Note: Useful for tracking which key version was used to encrypt data
        """
        return hashlib.sha256(self.key).hexdigest()

    @staticmethod
    def constant_time_compare(a: str, b: str) -> bool:
        """
        Compare two strings in constant time to prevent timing attacks

        Args:
            a: First string
            b: Second string

        Returns:
            True if strings are equal, False otherwise
        """
        return secrets.compare_digest(a.encode('utf-8'), b.encode('utf-8'))


class KeyRotationManager:
    """
    Manage encryption key rotation for audit logs

    In production, this should integrate with Azure Key Vault for key management
    """

    def __init__(self):
        """Initialize key rotation manager"""
        self.keys: Dict[str, LogEncryption] = {}
        self.current_key_id: Optional[str] = None

    def add_key(self, key_id: str, encryption_key: str, make_current: bool = False):
        """
        Add a new encryption key

        Args:
            key_id: Unique identifier for this key version
            encryption_key: Base64-encoded encryption key
            make_current: Set as current key for new encryptions
        """
        self.keys[key_id] = LogEncryption(encryption_key)
        if make_current or self.current_key_id is None:
            self.current_key_id = key_id

    def encrypt(self, plaintext: str, associated_data: Optional[str] = None) -> tuple[str, str]:
        """
        Encrypt using current key

        Returns:
            Tuple of (encrypted_data, key_id)
        """
        if not self.current_key_id:
            raise EncryptionError("No encryption key configured")

        encrypted = self.keys[self.current_key_id].encrypt(plaintext, associated_data)
        return encrypted, self.current_key_id

    def decrypt(self, encrypted_data: str, key_id: str, associated_data: Optional[str] = None) -> str:
        """
        Decrypt using specified key version

        Args:
            encrypted_data: Encrypted data
            key_id: Key version used for encryption
            associated_data: Optional additional authenticated data

        Returns:
            Decrypted plaintext
        """
        if key_id not in self.keys:
            raise EncryptionError(f"Unknown key ID: {key_id}")

        return self.keys[key_id].decrypt(encrypted_data, associated_data)

    def rotate_key(self, new_key_id: str, new_encryption_key: str):
        """
        Rotate to a new key version

        Args:
            new_key_id: ID for new key version
            new_encryption_key: Base64-encoded new key
        """
        self.add_key(new_key_id, new_encryption_key, make_current=True)

    def re_encrypt_data(
        self,
        encrypted_data: str,
        old_key_id: str,
        new_key_id: Optional[str] = None,
        associated_data: Optional[str] = None
    ) -> tuple[str, str]:
        """
        Re-encrypt data with a different key (for key rotation)

        Args:
            encrypted_data: Data encrypted with old key
            old_key_id: Old key version ID
            new_key_id: New key version ID (uses current if None)
            associated_data: Optional additional authenticated data

        Returns:
            Tuple of (re_encrypted_data, new_key_id)
        """
        # Decrypt with old key
        plaintext = self.decrypt(encrypted_data, old_key_id, associated_data)

        # Encrypt with new key
        if new_key_id:
            old_current = self.current_key_id
            self.current_key_id = new_key_id
            result = self.encrypt(plaintext, associated_data)
            self.current_key_id = old_current
            return result
        else:
            return self.encrypt(plaintext, associated_data)
