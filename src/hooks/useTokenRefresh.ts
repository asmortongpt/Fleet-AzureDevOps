// src/hooks/useTokenRefresh.ts

import axios, { AxiosError } from 'axios';
import { useState, useEffect } from 'react';

const REFRESH_TOKEN_ENDPOINT = '/api/refresh-token'; // Hardcoded endpoint as a fallback
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const useTokenRefresh = (): { refresh: () => Promise<void> } => {
  const { isAuthenticated, refreshToken } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing && isAuthenticated) {
        refresh();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, isRefreshing]);

  const refresh = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      // Call the auth context's built-in refreshToken method
      await refreshToken();
    } catch (error) {
      handleError(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleError = (error: unknown): void => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      logger.error(`Token refresh failed: ${axiosError.message}`, {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      });
    } else {
      logger.error(`Token refresh failed: ${(error as Error).message}`);
    }
    // FedRAMP Compliance: Ensure error logging does not expose sensitive information
  };

  return { refresh };
};