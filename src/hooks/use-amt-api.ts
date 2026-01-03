import axios, { AxiosError } from 'axios';
import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { logger } from '../utils/logger';
import { validateInput } from '../utils/validation';

// Security headers and HTTPS configuration
axios.defaults.headers.common['Content-Security-Policy'] = "default-src 'self'";
axios.defaults.headers.common['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
axios.defaults.headers.common['X-Content-Type-Options'] = 'nosniff';
axios.defaults.headers.common['X-Frame-Options'] = 'DENY';
axios.defaults.headers.common['X-XSS-Protection'] = '1; mode=block';

interface ApiResponse<T> {
  data: T;
  error?: string;
}

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    logger.error('API Error', error);
    toast.error('An error occurred while processing your request.');
    return Promise.reject(error);
  }
);

function useScanSession(tenant_id: string): UseQueryResult<ApiResponse<any>, AxiosError> {
  return useQuery({
    queryKey: ['scanSession', tenant_id],
    queryFn: async () => {
      validateInput(tenant_id);
      const response = await apiClient.get(`/scan-session`, { params: { tenant_id } });
      return response?.data;
    },
    gcTime: 5 * 60 * 1000,
  });
}

function useRecordScan(tenant_id: string): UseMutationResult<ApiResponse<any>, AxiosError, any> {
  return useMutation({
    mutationFn: async (scanData: any) => {
      validateInput(tenant_id);
      validateInput(scanData);
      const response = await apiClient.post(`/record-scan`, { ...scanData, tenant_id });
      return response?.data;
    },
  });
}

function useCheckout(tenant_id: string): UseMutationResult<ApiResponse<any>, AxiosError, any> {
  return useMutation({
    mutationFn: async (checkoutData: any) => {
      validateInput(tenant_id);
      validateInput(checkoutData);
      const response = await apiClient.post(`/checkout`, { ...checkoutData, tenant_id });
      return response?.data;
    },
  });
}

function useCheckin(tenant_id: string): UseMutationResult<ApiResponse<any>, AxiosError, any> {
  return useMutation({
    mutationFn: async (checkinData: any) => {
      validateInput(tenant_id);
      validateInput(checkinData);
      const response = await apiClient.post(`/checkin`, { ...checkinData, tenant_id });
      return response?.data;
    },
  });
}

function useAssetLocation(tenant_id: string): UseQueryResult<ApiResponse<any>, AxiosError> {
  return useQuery({
    queryKey: ['assetLocation', tenant_id],
    queryFn: async () => {
      validateInput(tenant_id);
      const response = await apiClient.get(`/asset-location`, { params: { tenant_id } });
      return response?.data;
    },
    gcTime: 5 * 60 * 1000,
  });
}

function useGeofences(tenant_id: string): UseQueryResult<ApiResponse<any>, AxiosError> {
  return useQuery({
    queryKey: ['geofences', tenant_id],
    queryFn: async () => {
      validateInput(tenant_id);
      const response = await apiClient.get(`/geofences`, { params: { tenant_id } });
      return response?.data;
    },
    gcTime: 5 * 60 * 1000,
  });
}

function useUtilizationReport(tenant_id: string): UseQueryResult<ApiResponse<any>, AxiosError> {
  return useQuery({
    queryKey: ['utilizationReport', tenant_id],
    queryFn: async () => {
      validateInput(tenant_id);
      const response = await apiClient.get(`/utilization-report`, { params: { tenant_id } });
      return response?.data;
    },
    gcTime: 5 * 60 * 1000,
  });
}

function useLicenses(tenant_id: string): UseQueryResult<ApiResponse<any>, AxiosError> {
  return useQuery({
    queryKey: ['licenses', tenant_id],
    queryFn: async () => {
      validateInput(tenant_id);
      const response = await apiClient.get(`/licenses`, { params: { tenant_id } });
      return response?.data;
    },
    gcTime: 5 * 60 * 1000,
  });
}

function useAllocateLicense(tenant_id: string): UseMutationResult<ApiResponse<any>, AxiosError, any> {
  return useMutation({
    mutationFn: async (licenseData: any) => {
      validateInput(tenant_id);
      validateInput(licenseData);
      const response = await apiClient.post(`/allocate-license`, { ...licenseData, tenant_id });
      return response?.data;
    },
  });
}

export {
  useScanSession,
  useRecordScan,
  useCheckout,
  useCheckin,
  useAssetLocation,
  useGeofences,
  useUtilizationReport,
  useLicenses,
  useAllocateLicense,
};