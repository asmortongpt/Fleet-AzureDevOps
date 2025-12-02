/**
 * Radio Dispatch API Integration
 * All API calls for radio channels, transmissions, and policies
 */

import type {
  RadioChannel,
  Transmission,
  DispatchPolicy,
  PolicyExecution,
  ChannelStatistics,
  PolicyStatistics
} from '@/types/radio';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================================================
// Channel Management
// ============================================================================

export async function getChannels(): Promise<RadioChannel[]> {
  const response = await fetch(`${API_BASE}/api/radio/channels`);
  if (!response.ok) {
    throw new Error(`Failed to fetch channels: ${response.statusText}`);
  }
  return response.json();
}

export async function getChannel(channelId: string): Promise<RadioChannel> {
  const response = await fetch(`${API_BASE}/api/radio/channels/${channelId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch channel: ${response.statusText}`);
  }
  return response.json();
}

export async function createChannel(data: Partial<RadioChannel>): Promise<RadioChannel> {
  const response = await fetch(`${API_BASE}/api/radio/channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Failed to create channel: ${response.statusText}`);
  }
  return response.json();
}

export async function updateChannel(channelId: string, data: Partial<RadioChannel>): Promise<RadioChannel> {
  const response = await fetch(`${API_BASE}/api/radio/channels/${channelId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Failed to update channel: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteChannel(channelId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/radio/channels/${channelId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error(`Failed to delete channel: ${response.statusText}`);
  }
}

export async function testChannel(channelId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/radio/channels/${channelId}/test`, {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error(`Failed to test channel: ${response.statusText}`);
  }
  return response.json();
}

export async function getChannelStatistics(channelId: string): Promise<ChannelStatistics> {
  const response = await fetch(`${API_BASE}/api/radio/channels/${channelId}/statistics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch channel statistics: ${response.statusText}`);
  }
  return response.json();
}

// ============================================================================
// Transmissions
// ============================================================================

export async function getTransmissions(params?: {
  channel_id?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}): Promise<Transmission[]> {
  const query = new URLSearchParams();
  if (params?.channel_id) query.set('channel_id', params.channel_id);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.offset) query.set('offset', params.offset.toString());

  const response = await fetch(`${API_BASE}/api/radio/transmissions?${query}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch transmissions: ${response.statusText}`);
  }
  return response.json();
}

export async function getTransmission(transmissionId: string): Promise<Transmission> {
  const response = await fetch(`${API_BASE}/api/radio/transmissions/${transmissionId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch transmission: ${response.statusText}`);
  }
  return response.json();
}

export async function searchTranscripts(query: string): Promise<Transmission[]> {
  const response = await fetch(`${API_BASE}/api/radio/transmissions/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!response.ok) {
    throw new Error(`Failed to search transcripts: ${response.statusText}`);
  }
  return response.json();
}

export async function exportTranscripts(params?: {
  channel_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<Blob> {
  const query = new URLSearchParams();
  if (params?.channel_id) query.set('channel_id', params.channel_id);
  if (params?.start_date) query.set('start_date', params.start_date);
  if (params?.end_date) query.set('end_date', params.end_date);

  const response = await fetch(`${API_BASE}/api/radio/transmissions/export?${query}`);
  if (!response.ok) {
    throw new Error(`Failed to export transcripts: ${response.statusText}`);
  }
  return response.blob();
}

// ============================================================================
// Dispatch Policies
// ============================================================================

export async function getPolicies(): Promise<DispatchPolicy[]> {
  const response = await fetch(`${API_BASE}/api/dispatch/policies`);
  if (!response.ok) {
    throw new Error(`Failed to fetch policies: ${response.statusText}`);
  }
  return response.json();
}

export async function getPolicy(policyId: string): Promise<DispatchPolicy> {
  const response = await fetch(`${API_BASE}/api/dispatch/policies/${policyId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch policy: ${response.statusText}`);
  }
  return response.json();
}

export async function createPolicy(data: Partial<DispatchPolicy>): Promise<DispatchPolicy> {
  const response = await fetch(`${API_BASE}/api/dispatch/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Failed to create policy: ${response.statusText}`);
  }
  return response.json();
}

export async function updatePolicy(policyId: string, data: Partial<DispatchPolicy>): Promise<DispatchPolicy> {
  const response = await fetch(`${API_BASE}/api/dispatch/policies/${policyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Failed to update policy: ${response.statusText}`);
  }
  return response.json();
}

export async function deletePolicy(policyId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/dispatch/policies/${policyId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error(`Failed to delete policy: ${response.statusText}`);
  }
}

export async function togglePolicy(policyId: string, enabled: boolean): Promise<DispatchPolicy> {
  const response = await fetch(`${API_BASE}/api/dispatch/policies/${policyId}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!response.ok) {
    throw new Error(`Failed to toggle policy: ${response.statusText}`);
  }
  return response.json();
}

export async function getPolicyStatistics(policyId: string): Promise<PolicyStatistics> {
  const response = await fetch(`${API_BASE}/api/dispatch/policies/${policyId}/statistics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch policy statistics: ${response.statusText}`);
  }
  return response.json();
}

// ============================================================================
// Policy Executions (HITL Queue)
// ============================================================================

export async function getPolicyExecutions(params?: {
  status?: string;
  policy_id?: string;
  limit?: number;
}): Promise<PolicyExecution[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.policy_id) query.set('policy_id', params.policy_id);
  if (params?.limit) query.set('limit', params.limit.toString());

  const response = await fetch(`${API_BASE}/api/dispatch/policies/executions?${query}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch policy executions: ${response.statusText}`);
  }
  return response.json();
}

export async function getPolicyExecution(executionId: string): Promise<PolicyExecution> {
  const response = await fetch(`${API_BASE}/api/dispatch/policies/executions/${executionId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch policy execution: ${response.statusText}`);
  }
  return response.json();
}

export async function approveExecution(executionId: string): Promise<PolicyExecution> {
  const response = await fetch(`${API_BASE}/api/dispatch/policies/executions/${executionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`Failed to approve execution: ${response.statusText}`);
  }
  return response.json();
}

export async function rejectExecution(executionId: string, reason: string): Promise<PolicyExecution> {
  const response = await fetch(`${API_BASE}/api/dispatch/policies/executions/${executionId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  if (!response.ok) {
    throw new Error(`Failed to reject execution: ${response.statusText}`);
  }
  return response.json();
}
