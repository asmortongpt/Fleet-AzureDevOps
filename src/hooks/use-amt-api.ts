import axios, { AxiosError } from 'axios';
import { useQuery, useMutation, UseQueryResult, UseMutationResult } from 'react-query';
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
  return useQuery(['scanSession', tenant_id], async () => {
    validateInput(tenant_id, 'string');
    const response = await apiClient.get(`/scan-session`, { params: { tenant_id } });
    return response.data;
  });
}

function useRecordScan(tenant_id: string): UseMutationResult<ApiResponse<any>, AxiosError, any> {
  return useMutation(async (scanData: any) => {
    validateInput(tenant_id, 'string');
    validateInput(scanData, 'object');
    const response = await apiClient.post(`/record-scan`, { ...scanData, tenant_id });
    return response.data;
  });
}

function useCheckout(tenant_id: string): UseMutationResult<ApiResponse<any>, AxiosError, any> {
  return useMutation(async (checkoutData: any) => {
    validateInput(tenant_id, 'string');
    validateInput(checkoutData, 'object');
    const response = await apiClient.post(`/checkout`, { ...checkoutData, tenant_id });
    return response.data;
  });
}

function useCheckin(tenant_id: string): UseMutationResult<ApiResponse<any>, AxiosError, any> {
  return useMutation(async (checkinData: any) => {
    validateInput(tenant_id, 'string');
    validateInput(checkinData, 'object');
    const response = await apiClient.post(`/checkin`, { ...checkinData, tenant_id });
    return response.data;
  });
}

function useAssetLocation(tenant_id: string): UseQueryResult<ApiResponse<any>, AxiosError> {
  return useQuery(['assetLocation', tenant_id], async () => {
    validateInput(tenant_id, 'string');
    const response = await apiClient.get(`/asset-location`, { params: { tenant_id } });
    return response.data;
  });
}

function useGeofences(tenant_id: string): UseQueryResult<ApiResponse<any>, AxiosError> {
  return useQuery(['geofences', tenant_id], async () => {
    validateInput(tenant_id, 'string');
    const response = await apiClient.get(`/geofences`, { params: { tenant_id } });
    return response.data;
  });
}

function useUtilizationReport(tenant_id: string): UseQueryResult<ApiResponse<any>, AxiosError> {
  return useQuery(['utilizationReport', tenant_id], async () => {
    validateInput(tenant_id, 'string');
    const response = await apiClient.get(`/utilization-report`, { params: { tenant_id } });
    return response.data;
  });
}

function useLicenses(tenant_id: string): UseQueryResult<ApiResponse<any>, AxiosError> {
  return useQuery(['licenses', tenant_id], async () => {
    validateInput(tenant_id, 'string');
    const response = await apiClient.get(`/licenses`, { params: { tenant_id } });
    return response.data;
  });
}

function useAllocateLicense(tenant_id: string): UseMutationResult<ApiResponse<any>, AxiosError, any> {
  return useMutation(async (licenseData: any) => {
    validateInput(tenant_id, 'string');
    validateInput(licenseData, 'object');
    const response = await apiClient.post(`/allocate-license`, { ...licenseData, tenant_id });
    return response.data;
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