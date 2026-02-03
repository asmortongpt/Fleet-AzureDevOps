import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';

import { secureFetch } from '@/hooks/use-api';
import { Policy, PolicyMode, PolicyStatus, PolicyType } from '@/lib/policy-engine/types';
import logger from '@/utils/logger';

export interface PolicyContextType {
  policies: Policy[];
  loading: boolean;
  error: string | null;

  // CRUD operations
  fetchPolicies: () => Promise<void>;
  createPolicy: (policy: Omit<Policy, 'id' | 'createdAt' | 'executionCount' | 'violationCount'>) => Promise<Policy>;
  updatePolicy: (id: string, updates: Partial<Policy>) => Promise<Policy>;
  deletePolicy: (id: string) => Promise<void>;

  // Policy activation/deactivation
  activatePolicy: (id: string) => Promise<void>;
  deactivatePolicy: (id: string) => Promise<void>;

  // Policy queries
  getPolicyById: (id: string) => Policy | undefined;
  getPoliciesByType: (type: PolicyType) => Policy[];
  getActivePolicies: () => Policy[];

  // Policy evaluation
  evaluatePolicy: (policyId: string, context: any) => Promise<{ allowed: boolean; reason?: string }>;
  checkPolicies: (type: PolicyType, context: any) => Promise<{ allowed: boolean; violations: string[] }>;
}

interface PolicyContextValue {
  policies: Policy[];
  loading: boolean;
  error: string | null;

  // CRUD operations
  fetchPolicies: () => Promise<void>;
  createPolicy: (policy: Omit<Policy, 'id' | 'createdAt' | 'executionCount' | 'violationCount'>) => Promise<Policy>;
  updatePolicy: (id: string, updates: Partial<Policy>) => Promise<Policy>;
  deletePolicy: (id: string) => Promise<void>;

  // Policy activation/deactivation
  activatePolicy: (id: string) => Promise<void>;
  deactivatePolicy: (id: string) => Promise<void>;

  // Policy queries
  getPolicyById: (id: string) => Policy | undefined;
  getPoliciesByType: (type: PolicyType) => Policy[];
  getActivePolicies: () => Policy[];

  // Policy evaluation
  evaluatePolicy: (policyId: string, context: any) => Promise<{ allowed: boolean; reason?: string }>;
  checkPolicies: (type: PolicyType, context: any) => Promise<{ allowed: boolean; violations: string[] }>;
}

const PolicyContext = createContext<PolicyContextValue | undefined>(undefined);

export const usePolicies = () => {
  const context = useContext(PolicyContext);
  if (!context) {
    throw new Error('usePolicies must be used within a PolicyProvider');
  }
  return context;
};

// Alias for compatibility with barrel export
export const usePolicy = usePolicies;

interface PolicyProviderProps {
  children: ReactNode;
}

const POLICY_TYPES: PolicyType[] = [
  "safety",
  "dispatch",
  "privacy",
  "ev-charging",
  "payments",
  "maintenance",
  "osha",
  "environmental",
  "data-retention",
  "security",
  "vehicle-use",
  "driver-behavior",
  "driver-qualification",
  "preventive-maintenance",
  "fuel-fraud-prevention",
  "maintenance-authorization",
  "telematics",
  "asset-tracking",
  "accident-response",
  "vehicle-replacement"
];

const POLICY_STATUSES: PolicyStatus[] = [
  "draft",
  "testing",
  "approved",
  "active",
  "deprecated",
  "archived"
];

const parsePolicyContent = (content: any) => {
  if (!content) return {};
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
  if (typeof content === 'object') return content;
  return {};
};

const normalizePolicyType = (value: any): PolicyType => {
  if (!value) return 'safety';
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, '-');
  return (POLICY_TYPES.includes(normalized as PolicyType) ? normalized : 'safety') as PolicyType;
};

const normalizePolicyStatus = (value: any): PolicyStatus => {
  if (!value) return 'draft';
  const normalized = String(value).trim().toLowerCase();
  return (POLICY_STATUSES.includes(normalized as PolicyStatus) ? normalized : 'draft') as PolicyStatus;
};

const mapPolicyFromApi = (row: any): Policy => {
  const content = parsePolicyContent(row?.content);
  const status = normalizePolicyStatus(content.status ?? (row?.is_active ? 'active' : row?.status));
  const type = normalizePolicyType(content.type ?? row?.category ?? row?.type);
  const confidenceScore = Number(content.confidenceScore ?? row?.confidence_score ?? 0);

  return {
    id: String(row?.id ?? ''),
    tenantId: row?.tenant_id ?? content.tenantId ?? 'global',
    name: row?.name ?? content.name ?? 'Untitled Policy',
    description: row?.description ?? content.description ?? '',
    type,
    version: row?.version ?? content.version ?? '1.0.0',
    status,
    mode: (content.mode ?? row?.mode ?? 'monitor') as PolicyMode,
    conditions: Array.isArray(content.conditions) ? content.conditions : [],
    actions: Array.isArray(content.actions) ? content.actions : [],
    scope: content.scope ?? {},
    confidenceScore: Number.isFinite(confidenceScore) ? confidenceScore : 0,
    requiresDualControl: Boolean(content.requiresDualControl ?? row?.requires_dual_control ?? false),
    requiresMFAForExecution: Boolean(content.requiresMFAForExecution ?? row?.requires_mfa_for_execution ?? false),
    createdBy: row?.created_by ?? content.createdBy ?? '',
    createdAt: row?.created_at ?? content.createdAt ?? '',
    tags: Array.isArray(content.tags) ? content.tags : [],
    executionCount: Number(content.executionCount ?? row?.execution_count ?? 0) || 0,
    violationCount: Number(content.violationCount ?? row?.violation_count ?? 0) || 0,
    category: row?.category ?? content.category,
    relatedPolicies: Array.isArray(content.relatedPolicies) ? content.relatedPolicies : [],
    lastModifiedBy: row?.updated_by ?? content.lastModifiedBy,
    lastModifiedAt: row?.updated_at ?? content.lastModifiedAt,
  };
};

const buildPolicyPayload = (policy: Partial<Policy>) => {
  const content = {
    type: policy.type,
    mode: policy.mode,
    status: policy.status,
    conditions: policy.conditions ?? [],
    actions: policy.actions ?? [],
    scope: policy.scope ?? {},
    confidenceScore: policy.confidenceScore ?? 0,
    requiresDualControl: policy.requiresDualControl ?? false,
    requiresMFAForExecution: policy.requiresMFAForExecution ?? false,
    tags: policy.tags ?? [],
    relatedPolicies: policy.relatedPolicies ?? [],
    executionCount: policy.executionCount ?? 0,
    violationCount: policy.violationCount ?? 0,
    category: policy.category ?? policy.type,
    createdBy: policy.createdBy,
    createdAt: policy.createdAt,
    lastModifiedBy: policy.lastModifiedBy,
    lastModifiedAt: policy.lastModifiedAt,
  };

  return {
    name: policy.name,
    description: policy.description,
    category: policy.category ?? policy.type,
    version: policy.version ?? '1.0.0',
    is_active: policy.status === 'active',
    content,
  };
};

export const PolicyProvider: React.FC<PolicyProviderProps> = ({ children }) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch policies from backend
  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await secureFetch('/api/policies');

      if (!response.ok) {
        throw new Error('Failed to fetch policies');
      }

      const data = await response.json();
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const mapped = rows.map(mapPolicyFromApi);
      setPolicies(mapped);
      logger.info('Policies fetched successfully', { count: mapped.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to fetch policies', { error: errorMessage });
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new policy
  const createPolicy = useCallback(async (policyData: Omit<Policy, 'id' | 'createdAt' | 'executionCount' | 'violationCount'>) => {
    try {
      const response = await secureFetch('/api/policies', {
        method: 'POST',
        body: JSON.stringify(buildPolicyPayload(policyData))
      });

      if (!response.ok) {
        throw new Error('Failed to create policy');
      }

      const newPolicyRaw = await response.json();
      const newPolicy = mapPolicyFromApi(newPolicyRaw);
      setPolicies(prev => [...prev, newPolicy]);
      toast.success('Policy created successfully');
      logger.info('Policy created', { policyId: newPolicy.id });

      return newPolicy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to create policy', { error: errorMessage });
      toast.error('Failed to create policy');
      throw err;
    }
  }, []);

  // Update existing policy
  const updatePolicy = useCallback(async (id: string, updates: Partial<Policy>) => {
    try {
      const response = await secureFetch(`/api/policies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(buildPolicyPayload(updates))
      });

      if (!response.ok) {
        throw new Error('Failed to update policy');
      }

      const updatedPolicyRaw = await response.json();
      const updatedPolicy = mapPolicyFromApi(updatedPolicyRaw);
      setPolicies(prev => prev.map(p => p.id === id ? updatedPolicy : p));
      toast.success('Policy updated successfully');
      logger.info('Policy updated', { policyId: id });

      return updatedPolicy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to update policy', { policyId: id, error: errorMessage });
      toast.error('Failed to update policy');
      throw err;
    }
  }, []);

  // Delete policy
  const deletePolicy = useCallback(async (id: string) => {
    try {
      const response = await secureFetch(`/api/policies/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete policy');
      }

      setPolicies(prev => prev.filter(p => p.id !== id));
      toast.success('Policy deleted successfully');
      logger.info('Policy deleted', { policyId: id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to delete policy', { policyId: id, error: errorMessage });
      toast.error('Failed to delete policy');
      throw err;
    }
  }, []);

  // Activate policy
  const activatePolicy = useCallback(async (id: string) => {
    await updatePolicy(id, { status: 'active' });
    logger.info('Policy activated', { policyId: id });
  }, [updatePolicy]);

  // Deactivate policy
  const deactivatePolicy = useCallback(async (id: string) => {
    await updatePolicy(id, { status: 'draft' });
    logger.info('Policy deactivated', { policyId: id });
  }, [updatePolicy]);

  // Get policy by ID
  const getPolicyById = useCallback((id: string) => {
    return policies.find(p => p.id === id);
  }, [policies]);

  // Get policies by type
  const getPoliciesByType = useCallback((type: PolicyType) => {
    return policies.filter(p => p.type === type);
  }, [policies]);

  // Get active policies
  const getActivePolicies = useCallback(() => {
    return policies.filter(p => p.status === 'active');
  }, [policies]);

  // Evaluate single policy
  const evaluatePolicy = useCallback(async (policyId: string, context: any): Promise<{ allowed: boolean; reason?: string }> => {
    try {
      const response = await secureFetch(`/api/policies/${policyId}/execute`, {
        method: 'POST',
        body: JSON.stringify({ context })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Policy evaluation failed');
      }

      const data = await response.json();
      const evaluation = data?.evaluation;
      if (!evaluation) {
        return { allowed: true };
      }

      return {
        allowed: Boolean(evaluation.compliant),
        reason: evaluation.violations?.[0]?.message || evaluation.checks?.find((c: any) => !c.passed)?.message
      };
    } catch (error: any) {
      logger.error('Policy evaluation failed', { policyId, error: error?.message });
      return { allowed: false, reason: error?.message || 'Policy evaluation failed' };
    }
  }, []);

  // Check all policies of a type
  const checkPolicies = useCallback(async (type: PolicyType, context: any): Promise<{ allowed: boolean; violations: string[] }> => {
    const relevantPolicies = getActivePolicies().filter(p => p.type === type);
    const violations: string[] = [];

    for (const policy of relevantPolicies) {
      const result = await evaluatePolicy(policy.id, context);

      if (!result.allowed) {
        violations.push(`${policy.name}: ${result.reason || 'Violation detected'}`);
      }
    }

    return {
      allowed: violations.length === 0,
      violations
    };
  }, [getActivePolicies, evaluatePolicy]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const value: PolicyContextValue = {
    policies,
    loading,
    error,
    fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    activatePolicy,
    deactivatePolicy,
    getPolicyById,
    getPoliciesByType,
    getActivePolicies,
    evaluatePolicy,
    checkPolicies
  };

  return (
    <PolicyContext.Provider value={value}>
      {children}
    </PolicyContext.Provider>
  );
};
