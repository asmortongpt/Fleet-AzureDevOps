/**
 * Authentication Service
 * Handles user authentication, token generation, and refresh logic.
 */
import { randomBytes } from 'crypto';

import jwt from 'jsonwebtoken';

interface RefreshToken {
    token: string;
    userId: string;
    expiresAt: Date;
}

// In-memory store for demo purposes (replace with Redis in production)
const refreshTokens: Record<string, RefreshToken> = {};

export class AuthService {
    private readonly jwtSecret: string;
    private readonly refreshSecret: string;

    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
        this.refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret';
    }

    /**
     * Generate Access and Refresh Tokens
     */
    generateTokens(userId: string) {
        const accessToken = jwt.sign({ sub: userId }, this.jwtSecret, { expiresIn: '15m' });
        const refreshToken = this.createRefreshToken(userId);

        return { accessToken, refreshToken };
    }

    /**
     * Create and store a opaque refresh token
     */
    private createRefreshToken(userId: string): string {
        const token = randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        refreshTokens[token] = {
            token,
            userId,
            expiresAt
        };

        return token;
    }

    /**
     * Refresh the access token using a valid refresh token
     */
    async refreshToken(token: string): Promise<{ accessToken: string, refreshToken: string } | null> {
        const storedToken = refreshTokens[token];

        if (!storedToken || new Date() > storedToken.expiresAt) {
            return null;
        }

        // Rotate refresh token (Security Best Practice)
        delete refreshTokens[token];
        return this.generateTokens(storedToken.userId);
    }

    /**
     * Verify an Access Token
     */
    verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (e) {
            return null;
        }
    }

    /**
     * Revoke a refresh token (Logout)
     */
    revokeToken(token: string): void {
        delete refreshTokens[token];
    }
}

export const authService = new AuthService();
