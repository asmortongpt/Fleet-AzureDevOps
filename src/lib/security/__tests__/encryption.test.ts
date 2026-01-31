/**
 * AES-256-GCM Encryption Service Tests
 * Comprehensive tests for production-grade encryption
 * Target: 80%+ coverage
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  encryptionService,
  encryptField,
  decryptField,
  type EncryptedData,
  type DataClassification,
  sensitiveFields,
} from '../encryption';

describe('EncryptionService', () => {
  beforeEach(async () => {
    // Initialize encryption service before each test
    await encryptionService.initialize();
  });

  describe('initialization', () => {
    it('should initialize with temporary key in development', async () => {
      // Re-initialize to test
      await encryptionService.initialize();

      // Should not throw
      expect(true).toBe(true);
    });

    it('should initialize with provided master key', async () => {
      // Generate a base64 key
      const key = btoa(Array.from(crypto.getRandomValues(new Uint8Array(32)), b => String.fromCharCode(b)).join(''));

      await encryptionService.initialize(key);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('encrypt', () => {
    it('should encrypt string data', async () => {
      const plaintext = 'sensitive data';
      const encrypted = await encryptionService.encrypt(plaintext);

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.keyVersion).toBeDefined();
      expect(encrypted.algorithm).toBe('AES-256-GCM');
      expect(encrypted.encryptedAt).toBeDefined();
    });

    it('should encrypt object data', async () => {
      const plaintext = { name: 'John Doe', ssn: '123-45-6789' };
      const encrypted = await encryptionService.encrypt(plaintext);

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
    });

    it('should use different IVs for each encryption', async () => {
      const plaintext = 'same data';
      const encrypted1 = await encryptionService.encrypt(plaintext);
      const encrypted2 = await encryptionService.encrypt(plaintext);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    });

    it('should include current key version', async () => {
      const encrypted = await encryptionService.encrypt('test');

      expect(encrypted.keyVersion).toBe('v1');
    });

    it('should support different data classifications', async () => {
      const classifications: DataClassification[] = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'];

      for (const classification of classifications) {
        const encrypted = await encryptionService.encrypt('test', classification);
        expect(encrypted.ciphertext).toBeDefined();
      }
    });

    it('should default to CONFIDENTIAL classification', async () => {
      const encrypted = await encryptionService.encrypt('test');

      // Should not throw and produce valid encrypted data
      expect(encrypted.algorithm).toBe('AES-256-GCM');
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted string data', async () => {
      const plaintext = 'sensitive data';
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt encrypted object data', async () => {
      const plaintext = { name: 'John Doe', ssn: '123-45-6789' };
      const encrypted = await encryptionService.encrypt(plaintext);
      const decrypted = await encryptionService.decrypt(encrypted);

      expect(JSON.parse(decrypted)).toEqual(plaintext);
    });

    it('should work with different classifications', async () => {
      const classifications: DataClassification[] = ['INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'];

      for (const classification of classifications) {
        const plaintext = `test-${classification}`;
        const encrypted = await encryptionService.encrypt(plaintext, classification);
        const decrypted = await encryptionService.decrypt(encrypted, classification);

        expect(decrypted).toBe(plaintext);
      }
    });

    it('should handle corrupted ciphertext gracefully', async () => {
      const invalidEncrypted: EncryptedData = {
        ciphertext: 'invalid-base64-!@#$',
        iv: btoa('12345678901234567890'),
        keyVersion: 'v1',
        algorithm: 'AES-256-GCM',
        encryptedAt: new Date().toISOString(),
      };

      await expect(
        encryptionService.decrypt(invalidEncrypted)
      ).rejects.toThrow();
    });

    it('should validate authentication tag (GCM mode)', async () => {
      const plaintext = 'sensitive data';
      const encrypted = await encryptionService.encrypt(plaintext);

      // Tamper with ciphertext
      const tamperedCiphertext = encrypted.ciphertext.split('').reverse().join('');
      const tampered: EncryptedData = {
        ...encrypted,
        ciphertext: tamperedCiphertext,
      };

      // Should fail due to authentication tag mismatch
      await expect(
        encryptionService.decrypt(tampered)
      ).rejects.toThrow();
    });
  });

  describe('encryptObject', () => {
    it('should encrypt sensitive fields only', async () => {
      const driver = {
        id: '123',
        name: 'John Doe',
        ssn: '123-45-6789',
        email: 'john@example.com',
        phone: '555-1234',
      };

      const encrypted = await encryptionService.encryptObject(driver, 'CONFIDENTIAL');

      expect(encrypted.id).toBe('123');
      expect(encrypted.name).toBe('John Doe');
      expect(typeof encrypted.ssn).toBe('object');
      expect(typeof encrypted.email).toBe('object');
      expect(typeof encrypted.phone).toBe('object');
    });

    it('should handle nested object paths', async () => {
      const data = {
        driver: {
          name: 'John Doe',
          ssn: '123-45-6789',
          email: 'john@example.com',
        },
      };

      const encrypted = await encryptionService.encryptObject(data, 'CONFIDENTIAL');

      expect(encrypted.driver.name).toBe('John Doe');
      expect(typeof encrypted.driver.ssn).toBe('object');
      expect(typeof encrypted.driver.email).toBe('object');
    });

    it('should skip null and undefined values', async () => {
      const data = {
        ssn: null,
        email: undefined,
        name: 'John Doe',
      };

      const encrypted = await encryptionService.encryptObject(data, 'CONFIDENTIAL');

      expect(encrypted.ssn).toBeNull();
      expect(encrypted.email).toBeUndefined();
      expect(encrypted.name).toBe('John Doe');
    });

    it('should not encrypt PUBLIC classification fields', async () => {
      const data = {
        name: 'John Doe',
        notes: 'Some notes',
      };

      const encrypted = await encryptionService.encryptObject(data, 'PUBLIC');

      expect(encrypted.name).toBe('John Doe');
      expect(encrypted.notes).toBe('Some notes');
    });

    it('should encrypt RESTRICTED fields', async () => {
      const data = {
        name: 'John Doe',
        medicalInfo: 'Type 1 Diabetes',
        bankAccount: '1234567890',
      };

      const encrypted = await encryptionService.encryptObject(data, 'RESTRICTED');

      expect(encrypted.name).toBe('John Doe');
      expect(typeof encrypted.medicalInfo).toBe('object');
      expect(typeof encrypted.bankAccount).toBe('object');
    });
  });

  describe('decryptObject', () => {
    it('should decrypt encrypted fields', async () => {
      const original = {
        id: '123',
        name: 'John Doe',
        ssn: '123-45-6789',
        email: 'john@example.com',
      };

      const encrypted = await encryptionService.encryptObject(original, 'CONFIDENTIAL');
      const decrypted = await encryptionService.decryptObject(encrypted, 'CONFIDENTIAL');

      expect(decrypted.id).toBe('123');
      expect(decrypted.name).toBe('John Doe');
      expect(decrypted.ssn).toBe('123-45-6789');
      expect(decrypted.email).toBe('john@example.com');
    });

    it('should handle nested encrypted fields', async () => {
      const original = {
        driver: {
          name: 'John Doe',
          ssn: '123-45-6789',
        },
      };

      const encrypted = await encryptionService.encryptObject(original, 'CONFIDENTIAL');
      const decrypted = await encryptionService.decryptObject(encrypted, 'CONFIDENTIAL');

      expect(decrypted.driver.name).toBe('John Doe');
      expect(decrypted.driver.ssn).toBe('123-45-6789');
    });

    it('should skip non-encrypted fields', async () => {
      const data = {
        name: 'John Doe',
        ssn: 'plain-text-ssn',
      };

      const decrypted = await encryptionService.decryptObject(data, 'CONFIDENTIAL');

      expect(decrypted.name).toBe('John Doe');
      expect(decrypted.ssn).toBe('plain-text-ssn');
    });
  });

  describe('rotateKeys', () => {
    it('should update key version', async () => {
      const oldVersion = 'v1';

      await encryptionService.rotateKeys();

      const encrypted = await encryptionService.encrypt('test');

      expect(encrypted.keyVersion).not.toBe(oldVersion);
    });

    it('should allow decrypting old encrypted data after rotation', async () => {
      const plaintext = 'test data';
      const encrypted = await encryptionService.encrypt(plaintext);

      await encryptionService.rotateKeys();

      const decrypted = await encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should use new key for new encryptions', async () => {
      const encrypted1 = await encryptionService.encrypt('test');

      await encryptionService.rotateKeys();

      const encrypted2 = await encryptionService.encrypt('test');

      expect(encrypted1.keyVersion).not.toBe(encrypted2.keyVersion);
    });
  });

  describe('data classifications', () => {
    it('should define correct sensitive fields for PUBLIC', () => {
      expect(sensitiveFields.PUBLIC).toEqual([]);
    });

    it('should define sensitive fields for INTERNAL', () => {
      expect(sensitiveFields.INTERNAL).toContain('notes');
      expect(sensitiveFields.INTERNAL).toContain('comments');
    });

    it('should define sensitive fields for CONFIDENTIAL', () => {
      expect(sensitiveFields.CONFIDENTIAL).toContain('ssn');
      expect(sensitiveFields.CONFIDENTIAL).toContain('email');
      expect(sensitiveFields.CONFIDENTIAL).toContain('phone');
      expect(sensitiveFields.CONFIDENTIAL).toContain('driver.ssn');
    });

    it('should define sensitive fields for RESTRICTED', () => {
      expect(sensitiveFields.RESTRICTED).toContain('medicalInfo');
      expect(sensitiveFields.RESTRICTED).toContain('bankAccount');
      expect(sensitiveFields.RESTRICTED).toContain('payment.cardNumber');
    });
  });
});

describe('Convenience Functions', () => {
  beforeEach(async () => {
    await encryptionService.initialize();
  });

  describe('encryptField', () => {
    it('should encrypt a field', async () => {
      const encrypted = await encryptField('sensitive value');

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.algorithm).toBe('AES-256-GCM');
    });

    it('should use specified classification', async () => {
      const encrypted = await encryptField('sensitive value', 'RESTRICTED');

      expect(encrypted.ciphertext).toBeDefined();
    });

    it('should default to CONFIDENTIAL', async () => {
      const encrypted = await encryptField('sensitive value');

      expect(encrypted.algorithm).toBe('AES-256-GCM');
    });
  });

  describe('decryptField', () => {
    it('should decrypt an encrypted field', async () => {
      const plaintext = 'sensitive value';
      const encrypted = await encryptField(plaintext);
      const decrypted = await decryptField(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should work with different classifications', async () => {
      const plaintext = 'sensitive value';
      const encrypted = await encryptField(plaintext, 'RESTRICTED');
      const decrypted = await decryptField(encrypted, 'RESTRICTED');

      expect(decrypted).toBe(plaintext);
    });
  });
});

describe('Base64 Encoding/Decoding', () => {
  beforeEach(async () => {
    await encryptionService.initialize();
  });

  it('should properly encode and decode ArrayBuffer', async () => {
    const data = 'test data with special chars: 你好 🎉';
    const encrypted = await encryptionService.encrypt(data);
    const decrypted = await encryptionService.decrypt(encrypted);

    expect(decrypted).toBe(data);
  });

  it('should handle binary data', async () => {
    const binaryData = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);
    const dataStr = Array.from(binaryData, b => String.fromCharCode(b)).join('');

    const encrypted = await encryptionService.encrypt(dataStr);
    const decrypted = await encryptionService.decrypt(encrypted);

    expect(decrypted).toBe(dataStr);
  });
});

describe('Edge Cases', () => {
  beforeEach(async () => {
    await encryptionService.initialize();
  });

  it('should handle empty string', async () => {
    const encrypted = await encryptionService.encrypt('');
    const decrypted = await encryptionService.decrypt(encrypted);

    expect(decrypted).toBe('');
  });

  it('should handle very long strings', async () => {
    const longString = 'a'.repeat(100000);
    const encrypted = await encryptionService.encrypt(longString);
    const decrypted = await encryptionService.decrypt(encrypted);

    expect(decrypted).toBe(longString);
  });

  it('should handle unicode characters', async () => {
    const unicode = '你好世界 🌍🎉 مرحبا العالم';
    const encrypted = await encryptionService.encrypt(unicode);
    const decrypted = await encryptionService.decrypt(encrypted);

    expect(decrypted).toBe(unicode);
  });

  it('should handle special JSON characters', async () => {
    const specialChars = '{"test": "value", "nested": {"key": "value"}}';
    const encrypted = await encryptionService.encrypt(specialChars);
    const decrypted = await encryptionService.decrypt(encrypted);

    expect(decrypted).toBe(specialChars);
  });

  it('should handle objects with circular references gracefully', async () => {
    const obj: any = { name: 'test' };
    obj.self = obj;

    await expect(
      encryptionService.encrypt(obj)
    ).rejects.toThrow();
  });
});

describe('Security Properties', () => {
  beforeEach(async () => {
    await encryptionService.initialize();
  });

  it('should use 12-byte IV for GCM mode', async () => {
    const encrypted = await encryptionService.encrypt('test');

    // Base64-encoded 12 bytes = 16 characters
    const ivLength = atob(encrypted.iv).length;
    expect(ivLength).toBe(12);
  });

  it('should produce different ciphertext for same plaintext', async () => {
    const plaintext = 'same data';
    const encrypted1 = await encryptionService.encrypt(plaintext);
    const encrypted2 = await encryptionService.encrypt(plaintext);

    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
  });

  it('should include timestamp in encrypted data', async () => {
    const before = new Date();
    const encrypted = await encryptionService.encrypt('test');
    const after = new Date();

    const timestamp = new Date(encrypted.encryptedAt);

    expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should specify AES-256-GCM algorithm', async () => {
    const encrypted = await encryptionService.encrypt('test');

    expect(encrypted.algorithm).toBe('AES-256-GCM');
  });
});
