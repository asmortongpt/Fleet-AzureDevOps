// src/hooks/useTokenRefresh.ts

import axios, { AxiosError } from 'axios';
import { useState, useEffect } from 'react';

const REFRESH_TOKEN_ENDPOINT = '/api/refresh-token'; // Hardcoded endpoint as a fallback
import { useAuthContext } from '../context/AuthContext'; // Ensure this file exists or create a type definition
import logger from '../utils/logger'; // Changed to default import assuming logger is exported as default

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  accessToken?: string;
  refreshToken?: string;
}

export const useTokenRefresh = (): { refresh: () => Promise<void> } => {
  const { authState, setAuthState } = useAuthContext();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing && authState?.refreshToken) {
        refresh();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(interval);
  }, [authState?.refreshToken, isRefreshing]);

  const refresh = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      const response = await axios.post<TokenResponse>(REFRESH_TOKEN_ENDPOINT, {
        refreshToken: authState?.refreshToken,
      });

      if (response?.data && response.data.accessToken && response.data.refreshToken) {
        setAuthState({
          ...authState,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        });
      } else {
        throw new Error('Invalid token response structure');
      }
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