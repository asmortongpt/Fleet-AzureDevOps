import { z } from 'zod';

/**
 * Comprehensive Zod validation schemas for Authentication
 * Implements CRIT-B-003: Input validation across all API endpoints
 * Enforces strong password requirements and secure authentication practices
 */

// Email validation
const emailSchema = z.string()
  .email('Invalid email address')
  .toLowerCase()
  .max(255, 'Email must be 255 characters or less')
  .trim();

// Password validation - enforces NIST/CIS standards
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be 128 characters or less')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Phone number validation (flexible international format)
const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
  mfaCode: z.string().length(6).optional(), // Optional MFA code
});

/**
 * Registration schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less')
    .trim(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or less')
    .trim(),
  phone: z.string()
    .regex(phoneRegex, 'Invalid phone number format')
    .optional(),
  organizationName: z.string()
    .max(255, 'Organization name must be 255 characters or less')
    .optional(),
  role: z.enum(['viewer', 'driver', 'supervisor', 'admin']).default('viewer'),
  terms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' })
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset confirmation schema
 */
export const passwordResetSchema = z.object({
  token: z.string()
    .min(32, 'Invalid reset token')
    .max(128, 'Invalid reset token'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
});

/**
 * Email verification schema
 */
export const emailVerificationSchema = z.object({
  token: z.string()
    .min(32, 'Invalid verification token')
    .max(128, 'Invalid verification token'),
});

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(32, 'Invalid refresh token')
    .max(512, 'Invalid refresh token'),
});

/**
 * Multi-factor authentication setup schema
 */
export const mfaSetupSchema = z.object({
  method: z.enum(['totp', 'sms', 'email']),
  phone: z.string()
    .regex(phoneRegex, 'Invalid phone number format')
    .optional(),
});

/**
 * Multi-factor authentication verification schema
 */
export const mfaVerifySchema = z.object({
  code: z.string()
    .length(6, 'MFA code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'MFA code must contain only digits'),
  method: z.enum(['totp', 'sms', 'email']),
});

/**
 * User profile update schema
 */
export const profileUpdateSchema = z.object({
  firstName: z.string()
    .min(1, 'First name cannot be empty')
    .max(100, 'First name must be 100 characters or less')
    .trim()
    .optional(),
  lastName: z.string()
    .min(1, 'Last name cannot be empty')
    .max(100, 'Last name must be 100 characters or less')
    .trim()
    .optional(),
  phone: z.string()
    .regex(phoneRegex, 'Invalid phone number format')
    .nullable()
    .optional(),
  photoUrl: z.string()
    .url('Invalid photo URL')
    .max(500, 'Photo URL must be 500 characters or less')
    .nullable()
    .optional(),
  timezone: z.string()
    .max(50, 'Timezone must be 50 characters or less')
    .optional(),
  locale: z.string()
    .max(10, 'Locale must be 10 characters or less')
    .optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
  }).optional(),
});

/**
 * API key creation schema
 */
export const apiKeyCreateSchema = z.object({
  name: z.string()
    .min(1, 'API key name is required')
    .max(100, 'API key name must be 100 characters or less')
    .trim(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  expiresAt: z.coerce.date()
    .refine(date => date > new Date(), {
      message: 'Expiration date must be in the future'
    })
    .optional(),
  scopes: z.array(z.string()).min(1, 'At least one scope is required'),
});

/**
 * Session management schema
 */
export const sessionRevokeSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
});

// Type exports
export type Login = z.infer<typeof loginSchema>;
export type Register = z.infer<typeof registerSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type EmailVerification = z.infer<typeof emailVerificationSchema>;
export type RefreshToken = z.infer<typeof refreshTokenSchema>;
export type MfaSetup = z.infer<typeof mfaSetupSchema>;
export type MfaVerify = z.infer<typeof mfaVerifySchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type ApiKeyCreate = z.infer<typeof apiKeyCreateSchema>;
export type SessionRevoke = z.infer<typeof sessionRevokeSchema>;
