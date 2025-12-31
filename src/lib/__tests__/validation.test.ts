/**
 * Validation Schema Tests
 * 
 * Tests Zod schemas for runtime validation
 */

import { describe, it, expect } from 'vitest';
import {
  userSchema,
  createUserSchema,
  updateUserSchema,
  vehicleSchema,
  vinSchema,
  createVehicleSchema,
  maintenanceRecordSchema,
  chatMessageSchema,
  validate,
  validateOrThrow,
  formatZodErrors,
  sanitizeInput,
  isValidEmail,
  isValidVINChecksum,
} from '../validation';

describe('User Schemas', () => {
  it('should validate a valid user', () => {
    const validUser = {
      name: 'John Doe',
      email: 'john@fleet.com',
      role: 'admin' as const,
      department: 'Operations',
      status: 'active' as const,
    };

    const result = validate(userSchema, validUser);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('john@fleet.com');
    }
  });

  it('should reject invalid name (too short)', () => {
    const invalidUser = {
      name: 'J',
      email: 'john@fleet.com',
      role: 'admin' as const,
    };

    const result = validate(userSchema, invalidUser);
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const invalidUser = {
      name: 'John Doe',
      email: 'not-an-email',
      role: 'admin' as const,
    };

    const result = validate(userSchema, invalidUser);
    expect(result.success).toBe(false);
  });

  it('should reject invalid role', () => {
    const invalidUser = {
      name: 'John Doe',
      email: 'john@fleet.com',
      role: 'superadmin' as any,
    };

    const result = validate(userSchema, invalidUser);
    expect(result.success).toBe(false);
  });

  it('should transform email to lowercase', () => {
    const user = {
      name: 'John Doe',
      email: 'JOHN@FLEET.COM',
      role: 'admin' as const,
    };

    const result = validate(userSchema, user);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('john@fleet.com');
    }
  });

  it('should omit id and timestamps for createUserSchema', () => {
    const user = {
      id: '123',
      name: 'John Doe',
      email: 'john@fleet.com',
      role: 'admin' as const,
      createdAt: new Date(),
    };

    const result = validate(createUserSchema, user);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
      expect(result.data).not.toHaveProperty('createdAt');
    }
  });
});

describe('Vehicle Schemas', () => {
  it('should validate a valid vehicle', () => {
    const validVehicle = {
      vin: '1FTFW1E50PFA12345',
      make: 'Ford',
      model: 'F-150',
      year: 2024,
      vehicleType: 'truck' as const,
      status: 'active' as const,
    };

    const result = validate(vehicleSchema, validVehicle);
    expect(result.success).toBe(true);
  });

  it('should reject invalid VIN (wrong length)', () => {
    const invalidVehicle = {
      vin: '1FTFW1E50PFA',
      make: 'Ford',
      model: 'F-150',
      year: 2024,
      vehicleType: 'truck' as const,
    };

    const result = validate(vehicleSchema, invalidVehicle);
    expect(result.success).toBe(false);
  });

  it('should reject VIN with invalid characters (I, O, Q)', () => {
    const invalidVehicle = {
      vin: 'IFTFW1E50PFA12345', // I is not allowed
      make: 'Ford',
      model: 'F-150',
      year: 2024,
      vehicleType: 'truck' as const,
    };

    const result = validate(vehicleSchema, invalidVehicle);
    expect(result.success).toBe(false);
  });

  it('should reject future years beyond next year', () => {
    const invalidVehicle = {
      vin: '1FTFW1E50PFA12345',
      make: 'Ford',
      model: 'F-150',
      year: new Date().getFullYear() + 2,
      vehicleType: 'truck' as const,
    };

    const result = validate(vehicleSchema, invalidVehicle);
    expect(result.success).toBe(false);
  });

  it('should validate mileage >= 0', () => {
    const vehicle = {
      vin: '1FTFW1E50PFA12345',
      make: 'Ford',
      model: 'F-150',
      year: 2024,
      vehicleType: 'truck' as const,
      mileage: -100,
    };

    const result = validate(vehicleSchema, vehicle);
    expect(result.success).toBe(false);
  });

  it('should validate fuel level 0-100', () => {
    const vehicle = {
      vin: '1FTFW1E50PFA12345',
      make: 'Ford',
      model: 'F-150',
      year: 2024,
      vehicleType: 'truck' as const,
      fuelLevel: 150,
    };

    const result = validate(vehicleSchema, vehicle);
    expect(result.success).toBe(false);
  });
});

describe('Maintenance Schemas', () => {
  it('should validate a valid maintenance record', () => {
    const validRecord = {
      vehicleId: 'VEH-001',
      maintenanceType: 'oil_change' as const,
      scheduledDate: new Date('2024-12-31'),
      status: 'pending' as const,
    };

    const result = validate(maintenanceRecordSchema, validRecord);
    expect(result.success).toBe(true);
  });

  it('should reject negative cost', () => {
    const invalidRecord = {
      vehicleId: 'VEH-001',
      maintenanceType: 'oil_change' as const,
      scheduledDate: new Date(),
      cost: -50,
    };

    const result = validate(maintenanceRecordSchema, invalidRecord);
    expect(result.success).toBe(false);
  });

  it('should validate maintenance type enum', () => {
    const invalidRecord = {
      vehicleId: 'VEH-001',
      maintenanceType: 'window_cleaning' as any,
      scheduledDate: new Date(),
    };

    const result = validate(maintenanceRecordSchema, invalidRecord);
    expect(result.success).toBe(false);
  });
});

describe('Chat Message Schema', () => {
  it('should validate a valid chat message', () => {
    const validMessage = {
      id: '123',
      role: 'user' as const,
      content: 'Hello, how can I help?',
      timestamp: new Date(),
    };

    const result = validate(chatMessageSchema, validMessage);
    expect(result.success).toBe(true);
  });

  it('should reject empty content', () => {
    const invalidMessage = {
      id: '123',
      role: 'user' as const,
      content: '',
      timestamp: new Date(),
    };

    const result = validate(chatMessageSchema, invalidMessage);
    expect(result.success).toBe(false);
  });

  it('should reject content that is too long', () => {
    const invalidMessage = {
      id: '123',
      role: 'user' as const,
      content: 'a'.repeat(10001),
      timestamp: new Date(),
    };

    const result = validate(chatMessageSchema, invalidMessage);
    expect(result.success).toBe(false);
  });
});

describe('Validation Helper Functions', () => {
  describe('validateOrThrow', () => {
    it('should return data for valid input', () => {
      const data = {
        name: 'John Doe',
        email: 'john@fleet.com',
        role: 'admin' as const,
      };

      expect(() => validateOrThrow(userSchema, data)).not.toThrow();
      const result = validateOrThrow(userSchema, data);
      expect(result.email).toBe('john@fleet.com');
    });

    it('should throw error for invalid input', () => {
      const data = {
        name: 'J',
        email: 'invalid',
        role: 'superadmin',
      };

      expect(() => validateOrThrow(userSchema, data)).toThrow();
    });

    it('should use custom error message', () => {
      const data = { name: 'J', email: 'invalid', role: 'admin' };
      
      try {
        validateOrThrow(userSchema, data, 'Custom error message');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Validation failed');
      }
    });
  });

  describe('formatZodErrors', () => {
    it('should format errors as key-value pairs', () => {
      const result = validate(userSchema, {
        name: 'J',
        email: 'invalid',
        role: 'superadmin',
      });

      if (!result.success) {
        const formatted = formatZodErrors(result.errors);
        expect(formatted).toHaveProperty('name');
        expect(formatted).toHaveProperty('email');
        expect(formatted).toHaveProperty('role');
      }
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Hello');
    });

    it('should trim whitespace', () => {
      const input = '   Hello World   ';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Hello World');
    });

    it('should handle both HTML and whitespace', () => {
      const input = '  <p>Hello</p> <b>World</b>  ';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Hello World');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('isValidVINChecksum', () => {
    it('should validate VIN with correct checksum', () => {
      // Real VIN with valid checksum
      const validVIN = '1HGBH41JXMN109186';
      expect(isValidVINChecksum(validVIN)).toBe(true);
    });

    it('should reject VIN with wrong length', () => {
      expect(isValidVINChecksum('1HGBH41JXM')).toBe(false);
    });
  });
});

describe('Edge Cases', () => {
  it('should handle undefined values correctly', () => {
    const data = {
      name: 'John Doe',
      email: 'john@fleet.com',
      role: 'admin' as const,
      department: undefined,
    };

    const result = validate(userSchema, data);
    expect(result.success).toBe(true);
  });

  it('should handle null values', () => {
    const data = {
      name: 'John Doe',
      email: 'john@fleet.com',
      role: 'admin' as const,
      department: null,
    };

    const result = validate(userSchema, data);
    // Zod should handle null appropriately
    expect(result.success).toBe(false); // null is not undefined
  });

  it('should handle date validation', () => {
    const record = {
      vehicleId: 'VEH-001',
      maintenanceType: 'oil_change' as const,
      scheduledDate: 'not-a-date' as any,
    };

    const result = validate(maintenanceRecordSchema, record);
    expect(result.success).toBe(false);
  });
});
