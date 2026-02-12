import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { prisma } from '../app';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  JWTPayload,
} from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

interface RegisterInput {
  email: string;
  password: string;
  role?: Role;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    role: Role;
    locationId?: string;
  };
  accessToken: string;
  refreshToken: string;
}

const SALT_ROUNDS = 12;

export const register = async (input: RegisterInput): Promise<AuthResult> => {
  const { email, password, role = 'CUSTOMER' } = input;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(409, 'User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
    },
  });

  // Generate tokens
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    locationId: user.locationId || undefined,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      locationId: user.locationId || undefined,
    },
    accessToken,
    refreshToken,
  };
};

export const login = async (input: LoginInput): Promise<AuthResult | null> => {
  const { email, password } = input;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    return null;
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    return null;
  }

  // Generate tokens
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    locationId: user.locationId || undefined,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      locationId: user.locationId || undefined,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (token: string): Promise<Omit<AuthResult, 'user'>> => {
  try {
    // Verify token
    const payload = verifyRefreshToken(token);

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    // Generate new tokens
    const newPayload: JWTPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      locationId: payload.locationId,
    };

    const accessToken = generateAccessToken(newPayload);
    const refreshToken = generateRefreshToken(newPayload);

    // Delete old refresh token and create new one
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token } }),
      prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: payload.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new AppError(401, 'Invalid refresh token');
  }
};

export const logout = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
};

export const getUserById = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
  });
};
