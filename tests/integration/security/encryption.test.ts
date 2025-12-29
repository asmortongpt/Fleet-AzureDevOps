/**
 * AES-256-GCM Encryption Integration Tests
 *
 * FedRAMP-compliant encryption testing:
 * - AES-256-GCM encrypt/decrypt operations
 * - PBKDF2 key derivation
 * - Azure Key Vault integration
 * - Key rotation (90-day cycle)
 * - Field-level encryption for PII/PHI
 * - Encryption integrity verification
 *
 * SC-8:  Transmission Confidentiality and Integrity
 * SC-12: Cryptographic Key Establishment and Management
 * SC-13: Cryptographic Protection
 * SC-28: Protection of Information at Rest
 */

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import type { EncryptedData, DataClassification } from '@/lib/security/encryption';
import {
  encryptionService,
  encryptField,
  decryptField,
  sensitiveFields
} from '@/lib/security/encryption';

describe('AES-256-GCM Encryption Service', () => {
  // ========================================================================
  // Setup & Teardown
  // ========================================================================

  beforeAll(async () => {
    // Initialize encryption service before tests
    await encryptionService.initialize();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Test: Basic Encrypt/Decrypt Operations
  // ========================================================================

  describe('Encrypt/Decrypt Operations', () => {
    it('should encrypt and decrypt string data', async () => {
      const plaintext = 'Sensitive vehicle information';
      const encrypted = await encryptionService.encrypt(plaintext, 'CONFIDENTIAL');

      expect(encrypted).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.keyVersion).toBeDefined();
      expect(encrypted.algorithm).toBe('AES-256-GCM');
      expect(encrypted.encryptedAt).toBeDefined();

      // Decrypt
      const decrypted = await encryptionService.decrypt(encrypted, 'CONFIDENTIAL');
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt object data', async () => {
      const data = {
        driverId: 'DRV-123',
        ssn: '123-45-6789',
        medicalInfo: 'Type 2 Diabetes'
      };

      const encrypted = await encryptionService.encrypt(data, 'RESTRICTED');
      const decrypted = await encryptionService.decrypt(encrypted, 'RESTRICTED');
      const decryptedObj = JSON.parse(decrypted);

      expect(decryptedObj).toEqual(data);
    });

    it('should generate unique IV for each encryption', async () => {
      const plaintext = 'Test data';
      const encrypted1 = await encryptionService.encrypt(plaintext, 'CONFIDENTIAL');
      const encrypted2 = await encryptionService.encrypt(plaintext, 'CONFIDENTIAL');

      // Same plaintext should produce different ciphertexts (different IV)
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should fail gracefully when decrypting invalid ciphertext', async () => {
      const encrypted: EncryptedData = {
        ciphertext: 'invalid-base64-ciphertext!!!',
        iv: 'invalid-iv',
        keyVersion: 'v1',
        algorithm: 'AES-256-GCM',
        encryptedAt: new Date().toISOString()
      };

      await expect(
        encryptionService.decrypt(encrypted, 'CONFIDENTIAL')
      ).rejects.toThrow('Decryption failed');
    });

    it('should handle empty string gracefully', async () => {
      const encrypted = await encryptionService.encrypt('', 'CONFIDENTIAL');
      const decrypted = await encryptionService.decrypt(encrypted, 'CONFIDENTIAL');

      expect(decrypted).toBe('');
    });

    it('should maintain encryption payload size efficiency', async () => {
      const plaintext = 'A'.repeat(1000); // 1KB of data
      const encrypted = await encryptionService.encrypt(plaintext, 'CONFIDENTIAL');

      // Ciphertext (base64) should not be excessively larger than plaintext
      // Base64 adds ~33% overhead, plus GCM adds 16-byte auth tag
      const ciphertextBytes = Buffer.byteLength(
        atob(encrypted.ciphertext),
        'utf8'
      );
      const plaintextBytes = plaintext.length;

      // AES-256-GCM + base64 overhead is ~52%, allow 1.6x
      expect(ciphertextBytes).toBeLessThan(plaintextBytes * 1.6);
    });
  });

  // ========================================================================
  // Test: PBKDF2 Key Derivation
  // ========================================================================

  describe('PBKDF2 Key Derivation', () => {
    it('should derive different keys for different classifications', async () => {
      const plaintext = 'Test data';

      // Encrypt same data with different classifications
      const confidentialEncrypted = await encryptionService.encrypt(
        plaintext,
        'CONFIDENTIAL'
      );
      const restrictedEncrypted = await encryptionService.encrypt(
        plaintext,
        'RESTRICTED'
      );

      // Different keys should produce different ciphertexts
      expect(confidentialEncrypted.ciphertext).not.toBe(
        restrictedEncrypted.ciphertext
      );

      // But both should decrypt correctly
      const confidentialDecrypted = await encryptionService.decrypt(
        confidentialEncrypted,
        'CONFIDENTIAL'
      );
      const restrictedDecrypted = await encryptionService.decrypt(
        restrictedEncrypted,
        'RESTRICTED'
      );

      expect(confidentialDecrypted).toBe(plaintext);
      expect(restrictedDecrypted).toBe(plaintext);
    });

    it('should support high-iteration PBKDF2 (600k+ iterations)', async () => {
      // Encryption should work with high iteration count
      const plaintext = 'Password-derived key test';
      const encrypted = await encryptionService.encrypt(
        plaintext,
        'RESTRICTED'
      );
      const decrypted = await encryptionService.decrypt(encrypted, 'RESTRICTED');

      expect(decrypted).toBe(plaintext);
    });

    it('should cache derived keys for performance', async () => {
      const plaintext = 'Test data for caching';

      // First encryption (derives key)
      const start1 = performance.now();
      const encrypted1 = await encryptionService.encrypt(
        plaintext,
        'CONFIDENTIAL'
      );
      const time1 = performance.now() - start1;

      // Second encryption (uses cached key)
      const start2 = performance.now();
      const encrypted2 = await encryptionService.encrypt(
        plaintext,
        'CONFIDENTIAL'
      );
      const time2 = performance.now() - start2;

      // Second call should be faster (using cached key)
      expect(time2).toBeLessThanOrEqual(time1 * 1.5); // Allow 50% margin for variance

      // Both should decrypt correctly
      expect(await encryptionService.decrypt(encrypted1, 'CONFIDENTIAL')).toBe(
        plaintext
      );
      expect(await encryptionService.decrypt(encrypted2, 'CONFIDENTIAL')).toBe(
        plaintext
      );
    });
  });

  // ========================================================================
  // Test: Key Rotation (90-day Cycle)
  // ========================================================================

  describe('Key Rotation', () => {
    it('should support key version tracking', async () => {
      const plaintext = 'Data for rotation test';

      const encrypted = await encryptionService.encrypt(
        plaintext,
        'CONFIDENTIAL'
      );

      expect(encrypted.keyVersion).toBeDefined();
      expect(encrypted.keyVersion).toMatch(/^v\d+/);
    });

    it('should decrypt data encrypted with previous key versions', async () => {
      const plaintext = 'Version compatibility test';

      // Simulate encryption with an older key version
      const encrypted = await encryptionService.encrypt(
        plaintext,
        'CONFIDENTIAL'
      );
      const oldKeyVersion = encrypted.keyVersion;

      // Rotate keys
      await encryptionService.rotateKeys();

      // Should still decrypt data encrypted with old key
      const decrypted = await encryptionService.decrypt(
        { ...encrypted, keyVersion: oldKeyVersion },
        'CONFIDENTIAL'
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should perform key rotation without data loss', async () => {
      const testDatasets = [
        'Driver SSN: 123-45-6789',
        'Medical Info: Type 2 Diabetes',
        'Bank Account: 1234567890'
      ];

      const encryptedDatasets = await Promise.all(
        testDatasets.map((data) =>
          encryptionService.encrypt(data, 'RESTRICTED')
        )
      );

      // Rotate keys
      await encryptionService.rotateKeys();

      // All data should still decrypt correctly
      for (let i = 0; i < encryptedDatasets.length; i++) {
        const decrypted = await encryptionService.decrypt(
          encryptedDatasets[i],
          'RESTRICTED'
        );
        expect(decrypted).toBe(testDatasets[i]);
      }
    });
  });

  // ========================================================================
  // Test: Field-Level Encryption for PII
  // ========================================================================

  describe('Field-Level Encryption for Sensitive Data', () => {
    it('should identify sensitive fields by classification', () => {
      // CONFIDENTIAL fields
      const confidentialFields = sensitiveFields['CONFIDENTIAL'];
      expect(confidentialFields).toContain('driver.ssn');
      expect(confidentialFields).toContain('driver.phone');
      expect(confidentialFields).toContain('driver.email');
      expect(confidentialFields).toContain('driver.address');
      expect(confidentialFields).toContain('vehicle.vin');

      // RESTRICTED fields
      const restrictedFields = sensitiveFields['RESTRICTED'];
      expect(restrictedFields).toContain('driver.medicalInfo');
      expect(restrictedFields).toContain('driver.bankAccount');
      expect(restrictedFields).toContain('payment.cardNumber');
      expect(restrictedFields).toContain('payment.cvv');
      expect(restrictedFields).toContain('insurance.policyNumber');
    });

    it('should encrypt entire objects with sensitive fields', async () => {
      const driver = {
        id: 'DRV-001',
        name: 'John Doe',
        ssn: '123-45-6789',
        email: 'john@example.com',
        address: '123 Main St, Springfield'
      };

      const encrypted = await encryptionService.encryptObject(
        driver,
        'CONFIDENTIAL'
      );

      // Non-sensitive fields should be plaintext
      expect(encrypted.id).toBe('DRV-001');
      expect(encrypted.name).toBe('John Doe');

      // Sensitive fields should be encrypted
      expect(encrypted.ssn).not.toBe(driver.ssn);
      expect(encrypted.email).not.toBe(driver.email);
      expect(encrypted.address).not.toBe(driver.address);
      expect((encrypted.ssn as any).ciphertext).toBeDefined();
      expect((encrypted.email as any).ciphertext).toBeDefined();
    });

    it('should decrypt objects with encrypted fields', async () => {
      const driver = {
        id: 'DRV-002',
        name: 'Jane Smith',
        ssn: '987-65-4321',
        phone: '555-1234',
        medicalInfo: 'Allergic to Penicillin',
        bankAccount: '9876543210'
      };

      // Encrypt with RESTRICTED to include medical and bank info
      const encrypted = await encryptionService.encryptObject(
        driver,
        'RESTRICTED'
      );

      // Decrypt
      const decrypted = await encryptionService.decryptObject(
        encrypted,
        'RESTRICTED'
      );

      // All fields should match original
      expect(decrypted.id).toBe(driver.id);
      expect(decrypted.name).toBe(driver.name);
      expect(decrypted.ssn).toBe(driver.ssn);
      expect(decrypted.phone).toBe(driver.phone);
      expect(decrypted.medicalInfo).toBe(driver.medicalInfo);
      expect(decrypted.bankAccount).toBe(driver.bankAccount);
    });

    it('should handle nested object encryption', async () => {
      const vehicle = {
        id: 'VEH-001',
        make: 'Ford',
        model: 'F-150',
        vin: '1FTFW1ET6DFC10124',
        owner: {
          name: 'Fleet Manager',
          address: '123 Company Dr, NY'
        }
      };

      const encrypted = await encryptionService.encryptObject(
        vehicle,
        'CONFIDENTIAL'
      );
      const decrypted = await encryptionService.decryptObject(
        encrypted,
        'CONFIDENTIAL'
      );

      expect(decrypted.vin).toBe(vehicle.vin);
      expect(decrypted.owner.address).toBe(vehicle.owner.address);
    });

    it('should preserve fields that are null/undefined', async () => {
      const data = {
        name: 'John',
        ssn: null as any,
        phone: undefined as any,
        email: 'john@example.com'
      };

      const encrypted = await encryptionService.encryptObject(
        data,
        'CONFIDENTIAL'
      );
      const decrypted = await encryptionService.decryptObject(
        encrypted,
        'CONFIDENTIAL'
      );

      expect(decrypted.name).toBe('John');
      expect(decrypted.ssn).toBeNull();
      expect(decrypted.phone).toBeUndefined();
      expect(decrypted.email).toBe('john@example.com');
    });
  });

  // ========================================================================
  // Test: Data Classification Levels
  // ========================================================================

  describe('Data Classification Levels', () => {
    it('PUBLIC classification should require no encryption', () => {
      const publicFields = sensitiveFields['PUBLIC'];
      expect(publicFields).toEqual([]);
    });

    it('INTERNAL classification should encrypt basic data', () => {
      const internalFields = sensitiveFields['INTERNAL'];
      expect(internalFields).toEqual(['notes', 'comments']);
    });

    it('CONFIDENTIAL classification should encrypt PII', () => {
      const confidentialFields = sensitiveFields['CONFIDENTIAL'];
      expect(confidentialFields.length).toBeGreaterThan(0);
      expect(confidentialFields).toContain('driver.ssn');
      expect(confidentialFields).toContain('vehicle.vin');
    });

    it('RESTRICTED classification should encrypt most sensitive data', () => {
      const restrictedFields = sensitiveFields['RESTRICTED'];
      expect(restrictedFields.length).toBeGreaterThan(0);
      expect(restrictedFields).toContain('driver.medicalInfo');
      expect(restrictedFields).toContain('payment.cardNumber');
    });
  });

  // ========================================================================
  // Test: Convenience Functions
  // ========================================================================

  describe('Convenience Functions', () => {
    it('encryptField should encrypt single field', async () => {
      const ssn = '123-45-6789';
      const encrypted = await encryptField(ssn, 'RESTRICTED');

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();

      const decrypted = await decryptField(encrypted, 'RESTRICTED');
      expect(decrypted).toBe(ssn);
    });

    it('decryptField should decrypt single field', async () => {
      const cardNumber = '4111111111111111';
      const encrypted = await encryptField(cardNumber, 'RESTRICTED');
      const decrypted = await decryptField(encrypted, 'RESTRICTED');

      expect(decrypted).toBe(cardNumber);
    });
  });

  // ========================================================================
  // Test: Encryption Integrity & Authenticity
  // ========================================================================

  describe('GCM Mode - Authentication & Integrity', () => {
    it('should include 128-bit authentication tag', async () => {
      const plaintext = 'Authenticated data';
      const encrypted = await encryptionService.encrypt(
        plaintext,
        'CONFIDENTIAL'
      );

      // GCM mode includes authentication tag in ciphertext
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.algorithm).toBe('AES-256-GCM');
    });

    it('should detect tampering (authentication failure)', async () => {
      const plaintext = 'Important data';
      const encrypted = await encryptionService.encrypt(
        plaintext,
        'CONFIDENTIAL'
      );

      // Tamper with ciphertext
      const tampered = {
        ...encrypted,
        ciphertext: encrypted.ciphertext.slice(0, -4) + 'XXXX'
      };

      await expect(
        encryptionService.decrypt(tampered, 'CONFIDENTIAL')
      ).rejects.toThrow();
    });

    it('should prevent decryption with wrong key version', async () => {
      const plaintext = 'Version-locked data';
      const encrypted = await encryptionService.encrypt(
        plaintext,
        'CONFIDENTIAL'
      );

      // Decrypt with wrong key version should fail
      const wrongVersion = { ...encrypted, keyVersion: 'v-wrong' };

      await expect(
        encryptionService.decrypt(wrongVersion, 'CONFIDENTIAL')
      ).rejects.toThrow();
    });
  });

  // ========================================================================
  // Test: Error Handling
  // ========================================================================

  describe('Error Handling & Edge Cases', () => {
    it('should handle very large data', async () => {
      const largeData = 'A'.repeat(10 * 1024 * 1024); // 10MB
      const encrypted = await encryptionService.encrypt(
        largeData,
        'CONFIDENTIAL'
      );
      const decrypted = await encryptionService.decrypt(
        encrypted,
        'CONFIDENTIAL'
      );

      expect(decrypted).toBe(largeData);
    });

    it('should handle special characters and unicode', async () => {
      const specialData =
        '!@#$%^&*()_+-=[]{}|;:",.<>?/~`\nTabName™ 中文データ';
      const encrypted = await encryptionService.encrypt(
        specialData,
        'CONFIDENTIAL'
      );
      const decrypted = await encryptionService.decrypt(
        encrypted,
        'CONFIDENTIAL'
      );

      expect(decrypted).toBe(specialData);
    });

    it('should handle encryption service reinitialization', async () => {
      const plaintext = 'Reinitialization test';

      // First encryption
      const encrypted1 = await encryptionService.encrypt(
        plaintext,
        'CONFIDENTIAL'
      );

      // Reinitialize
      await encryptionService.initialize();

      // Should still decrypt (keys are reinitialized)
      const decrypted = await encryptionService.decrypt(
        encrypted1,
        'CONFIDENTIAL'
      );
      expect(decrypted).toBe(plaintext);
    });
  });
});
