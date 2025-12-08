// src/hooks/useTokenRefresh.ts

import axios, { AxiosError } from 'axios';
import { useState, useEffect } from 'react';

import { refreshTokenEndpoint } from '../config/endpoints'; // Endpoint configuration
import { useAuthContext } from '../context/AuthContext'; // Assuming there's an AuthContext for managing auth state
import { logError } from '../utils/logger'; // Utility for logging errors

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const useTokenRefresh = (): { refresh: () => Promise<void> } => {
  const { authState, setAuthState } = useAuthContext();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing && authState.refreshToken) {
        refresh();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(interval);
  }, [authState.refreshToken, isRefreshing]);

  const refresh = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      const response = await axios.post<TokenResponse>(refreshTokenEndpoint, {
        refreshToken: authState.refreshToken,
      });

      if (response.data && response.data.accessToken && response.data.refreshToken) {
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
      logError(`Token refresh failed: ${axiosError.message}`, {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      });
    } else {
      logError(`Token refresh failed: ${(error as Error).message}`);
    }
    // FedRAMP Compliance: Ensure error logging does not expose sensitive information
  };

  return { refresh };
};