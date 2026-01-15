'use client';

import { useState } from 'react';

import { CSRFInput, useCSRFToken } from '@/components/CSRFInput';
import { api } from '@/lib/api';
import { useMutation } from '@/lib/hooks/useMutation';

/**
 * CSRF Protection Examples
 *
 * This file demonstrates all the ways to use CSRF protection in the application:
 * 1. API mutations using useMutation hook (recommended)
 * 2. Direct API calls
 * 3. HTML form submissions with CSRFInput
 * 4. Programmatic token access
 */

// ============================================================================
// Example 1: Creating an Incident using useMutation (RECOMMENDED)
// ============================================================================

interface CreateIncidentInput {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface Incident {
  id: string;
  title: string;
  description: string;
  priority: string;
  created_at: string;
}

export function CreateIncidentExample() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const createIncident = useMutation<Incident, CreateIncidentInput>(
    (data) => api.post('/api/incidents', data),
    {
      onSuccess: (incident) => {
        console.log('Incident created successfully:', incident.id);
        // Clear form
        setTitle('');
        setDescription('');
        setPriority('medium');
      },
      onError: (error) => {
        console.error('Failed to create incident:', error.message);
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // CSRF token is automatically included by api.post()
      await createIncident.mutate({
        title,
        description,
        priority,
      });
    } catch (error) {
      // Error already handled by onError callback
    }
  };

  return (
    <div className="p-2 border rounded">
      <h3 className="text-sm font-semibold mb-2">
        Example 1: Create Incident (useMutation)
      </h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={createIncident.loading}
          className="px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {createIncident.loading ? 'Creating...' : 'Create Incident'}
        </button>

        {createIncident.error && (
          <div className="text-red-600 text-sm">
            Error: {createIncident.error.message}
          </div>
        )}

        {createIncident.data && (
          <div className="text-green-600 text-sm">
            Success! Incident ID: {createIncident.data.id}
          </div>
        )}
      </form>
    </div>
  );
}

// ============================================================================
// Example 2: Updating an Incident using Direct API Call
// ============================================================================

export function UpdateIncidentExample({ incidentId }: { incidentId: string }) {
  const [status, setStatus] = useState<'open' | 'in_progress' | 'closed'>('open');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async () => {
    setLoading(true);
    setMessage('');

    try {
      // CSRF token is automatically included by api.put()
      const updated = await api.put(`/api/incidents/${incidentId}`, {
        status,
      });

      setMessage(`Incident updated successfully`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 border rounded">
      <h3 className="text-sm font-semibold mb-2">
        Example 2: Update Incident (Direct API)
      </h3>
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="px-2 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Incident'}
        </button>

        {message && (
          <div className={message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Example 3: Deleting an Incident
// ============================================================================

export function DeleteIncidentExample({ incidentId }: { incidentId: string }) {
  const deleteIncident = useMutation<void, string>(
    (id) => api.delete(`/api/incidents/${id}`),
    {
      onSuccess: () => {
        console.log('Incident deleted successfully');
      },
      onError: (error) => {
        console.error('Failed to delete incident:', error.message);
      },
    }
  );

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this incident?')) {
      try {
        // CSRF token is automatically included by api.delete()
        await deleteIncident.mutate(incidentId);
      } catch (error) {
        // Error already handled by onError callback
      }
    }
  };

  return (
    <div className="p-2 border rounded">
      <h3 className="text-sm font-semibold mb-2">
        Example 3: Delete Incident
      </h3>
      <button
        onClick={handleDelete}
        disabled={deleteIncident.loading}
        className="px-2 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
      >
        {deleteIncident.loading ? 'Deleting...' : 'Delete Incident'}
      </button>

      {deleteIncident.error && (
        <div className="text-red-600 text-sm mt-2">
          Error: {deleteIncident.error.message}
        </div>
      )}

      {deleteIncident.data !== null && (
        <div className="text-green-600 text-sm mt-2">
          Incident deleted successfully
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 4: HTML Form Submission with CSRFInput
// ============================================================================

export function HTMLFormExample() {
  return (
    <div className="p-2 border rounded">
      <h3 className="text-sm font-semibold mb-2">
        Example 4: HTML Form with CSRF Token
      </h3>
      <form method="POST" action="/api/submit" className="space-y-2">
        {/* CSRF token automatically included in form data */}
        <CSRFInput />

        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="px-2 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Submit Form
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// Example 5: Programmatic CSRF Token Access
// ============================================================================

export function CSRFTokenDisplay() {
  const csrfToken = useCSRFToken();

  return (
    <div className="p-2 border rounded">
      <h3 className="text-sm font-semibold mb-2">
        Example 5: Display CSRF Token
      </h3>
      <div className="space-y-2">
        <p className="text-sm text-slate-700">
          Current CSRF Token (for debugging):
        </p>
        {csrfToken ? (
          <code className="block p-2 bg-gray-100 rounded text-xs break-all">
            {csrfToken}
          </code>
        ) : (
          <p className="text-sm text-gray-400">Loading token...</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Batch Operations with CSRF
// ============================================================================

export function BatchOperationsExample() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleBatchUpdate = async () => {
    setLoading(true);
    setMessage('');

    try {
      // All requests automatically include CSRF tokens
      const promises = selectedIds.map((id) =>
        api.patch(`/api/incidents/${id}`, { status: 'closed' })
      );

      await Promise.all(promises);
      setMessage(`Successfully updated ${selectedIds.length} incidents`);
      setSelectedIds([]);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 border rounded">
      <h3 className="text-sm font-semibold mb-2">
        Example 6: Batch Operations
      </h3>
      <div className="space-y-2">
        <div>
          <p className="text-sm text-slate-700 mb-2">
            Selected incidents: {selectedIds.length}
          </p>
          <div className="space-x-2">
            <button
              onClick={() => setSelectedIds(['1', '2', '3'])}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Select 3 incidents
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Clear selection
            </button>
          </div>
        </div>

        <button
          onClick={handleBatchUpdate}
          disabled={loading || selectedIds.length === 0}
          className="px-2 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Close Selected Incidents'}
        </button>

        {message && (
          <div className={message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// All Examples Container
// ============================================================================

export function CSRFProtectionExamples() {
  return (
    <div className="container mx-auto p-3">
      <h1 className="text-base font-bold mb-2">CSRF Protection Examples</h1>
      <p className="text-slate-700 mb-3">
        All examples automatically include CSRF tokens. No manual token handling required!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <CreateIncidentExample />
        <UpdateIncidentExample incidentId="example-123" />
        <DeleteIncidentExample incidentId="example-123" />
        <HTMLFormExample />
        <CSRFTokenDisplay />
        <BatchOperationsExample />
      </div>

      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
        <h2 className="font-semibold mb-2">How It Works</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>CSRF token is fetched when the app loads (in Providers component)</li>
          <li>Token is stored in sessionStorage and memory</li>
          <li>All POST/PUT/PATCH/DELETE requests automatically include the token in headers</li>
          <li>If a CSRF error occurs (403), the token is automatically refreshed</li>
          <li>Forms can include CSRFInput component for traditional submissions</li>
          <li>No manual token handling required in most cases</li>
        </ul>
      </div>
    </div>
  );
}
