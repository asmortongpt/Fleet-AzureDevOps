import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as authService from '../services/authService';
import { AppError } from '../middleware/errorHandler';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, role } = req.body;

  const result = await authService.register({ email, password, role });

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    },
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  if (!result) {
    throw new AppError(401, 'Invalid credentials');
  }

  res.status(200).json({
    message: 'Login successful',
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    },
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
};

export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  const result = await authService.refreshAccessToken(refreshToken);

  res.status(200).json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Not authenticated');
  }

  await authService.logout(req.user.id);

  res.status(200).json({
    message: 'Logged out successfully',
  });
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Not authenticated');
  }

  const user = await authService.getUserById(req.user.id);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      locationId: user.locationId,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
};
