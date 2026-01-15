
import QRCode from 'qrcode';
// @ts-ignore
import speakeasy from 'speakeasy';

import { pool } from '../config/database';

export class MFAService {
  async generateSecret(userId: number, email: string) {
    const secret = speakeasy.generateSecret({
      name: `Fleet Manager (${email})`,
      issuer: 'Fleet Manager'
    });

    // Store secret in database
    await pool.query(
      'UPDATE users SET mfa_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    );

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode
    };
  }

  async verifyToken(userId: number, token: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT mfa_secret FROM users WHERE id = $1',
      [userId]
    );

    if (!result.rows[0]?.mfa_secret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: result.rows[0].mfa_secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps (60 seconds)
    });
  }
}
