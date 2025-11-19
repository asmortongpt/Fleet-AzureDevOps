import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'uuid' | 'date' | 'phone' | 'url' | 'vin';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export const validate = (rules: ValidationRule[], source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: any[] = [];
    const data = req[source];

    for (const rule of rules) {
      const value = data[rule.field];

      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({ field: rule.field, message: `${rule.field} is required` });
        continue;
      }

      // Skip validation if not required and not provided
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rule.type) {
        switch (rule.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push({ field: rule.field, message: `${rule.field} must be a string` });
            }
            break;
          case 'number':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              errors.push({ field: rule.field, message: `${rule.field} must be a number` });
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push({ field: rule.field, message: `${rule.field} must be a boolean` });
            }
            break;
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              errors.push({ field: rule.field, message: `${rule.field} must be a valid email` });
            }
            break;
          case 'uuid':
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
              errors.push({ field: rule.field, message: `${rule.field} must be a valid UUID` });
            }
            break;
          case 'date':
            if (isNaN(Date.parse(value))) {
              errors.push({ field: rule.field, message: `${rule.field} must be a valid date` });
            }
            break;
          case 'phone':
            if (!/^\+?[1-9]\d{1,14}$/.test(value.replace(/[\s-()]/g, ''))) {
              errors.push({ field: rule.field, message: `${rule.field} must be a valid phone number` });
            }
            break;
          case 'url':
            try {
              new URL(value);
            } catch {
              errors.push({ field: rule.field, message: `${rule.field} must be a valid URL` });
            }
            break;
          case 'vin':
            if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(value)) {
              errors.push({ field: rule.field, message: `${rule.field} must be a valid VIN (17 alphanumeric characters, excluding I, O, Q)` });
            }
            break;
        }
      }

      // Length validation
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        errors.push({ field: rule.field, message: `${rule.field} must be at least ${rule.minLength} characters` });
      }
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push({ field: rule.field, message: `${rule.field} must be at most ${rule.maxLength} characters` });
      }

      // Number range validation
      if (rule.min !== undefined && Number(value) < rule.min) {
        errors.push({ field: rule.field, message: `${rule.field} must be at least ${rule.min}` });
      }
      if (rule.max !== undefined && Number(value) > rule.max) {
        errors.push({ field: rule.field, message: `${rule.field} must be at most ${rule.max}` });
      }

      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({ field: rule.field, message: `${rule.field} must be one of: ${rule.enum.join(', ')}` });
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({ field: rule.field, message: `${rule.field} format is invalid` });
      }

      // Custom validation
      if (rule.custom) {
        const result = rule.custom(value);
        if (result !== true) {
          errors.push({ field: rule.field, message: typeof result === 'string' ? result : `${rule.field} is invalid` });
        }
      }
    }

    if (errors.length > 0) {
      return ApiResponse.validationError(res, errors);
    }

    next();
  };
};
