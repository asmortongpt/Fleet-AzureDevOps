import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import toast from 'sonner';

import { Policy, PolicyType } from '@/lib/policy-engine/types';
import logger from '@/utils/logger';

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

interface PolicyProviderProps {
  children: ReactNode;
}

export const PolicyProvider: React.FC<PolicyProviderProps> = ({ children }) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch policies from backend
  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('/api/policy-templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch policies');
      }

      const data = await response.json();
      setPolicies(data.data || []);
      logger.info('Policies fetched successfully', { count: data.data?.length });
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
      const token = localStorage.getItem('token') || '';
      const response = await fetch('/api/policy-templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(policyData)
      });

      if (!response.ok) {
        throw new Error('Failed to create policy');
      }

      const newPolicy = await response.json();
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
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`/api/policy-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update policy');
      }

      const updatedPolicy = await response.json();
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
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`/api/policy-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
    const policy = getPolicyById(policyId);

    if (!policy) {
      return { allowed: true, reason: 'Policy not found' };
    }

    if (policy.status !== 'active') {
      return { allowed: true, reason: 'Policy not active' };
    }

    // TODO: Implement actual policy evaluation logic
    // For now, return allowed for monitor mode, check conditions for autonomous mode
    if (policy.mode === 'monitor') {
      logger.info('Policy evaluation (monitor mode)', { policyId, context });
      return { allowed: true, reason: 'Monitor mode - logging only' };
    }

    // Basic condition evaluation (this should be expanded based on your policy schema)
    const conditionsMet = policy.conditions.every(condition => {
      // Implement condition checking logic here
      return true; // Placeholder
    });

    if (!conditionsMet) {
      logger.warn('Policy violation detected', { policyId, context });
      return { allowed: false, reason: 'Policy conditions not met' };
    }

    return { allowed: true };
  }, [getPolicyById]);

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

  // Load policies on mount
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
