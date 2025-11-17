/**
 * Mobile Manager View Component
 * Mobile-optimized interface for managers to review and approve assignments (BR-11.4)
 *
 * Features:
 * - View team assignments
 * - Quick approve/deny from mobile
 * - View current on-call team members
 * - Monitor compliance exceptions
 */

import React, { useState, useEffect } from 'react';
import {
  Car,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Phone,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface PendingAssignment {
  id: string;
  unit_number: string;
  make: string;
  model: string;
  year: number;
  driver_name: string;
  employee_number: string;
  assignment_type: string;
  recommended_at: string;
  department_name: string;
}

const MobileManagerView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'on-call'>('pending');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<PendingAssignment | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/mobile/dashboard/manager', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching manager dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApproval = async (assignmentId: string, action: 'approve' | 'deny') => {
    try {
      const response = await fetch(`/api/mobile/assignment/${assignmentId}/quick-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action,
          notes: approvalNotes || undefined,
        }),
      });

      if (response.ok) {
        alert(`Assignment ${action}d successfully`);
        setShowApprovalModal(false);
        setSelectedAssignment(null);
        setApprovalNotes('');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Failed to process approval');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderPendingTab = () => (
    <div className="space-y-4">
      {dashboardData.pending_approvals.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">No pending approvals</p>
        </div>
      ) : (
        dashboardData.pending_approvals.map((assignment: PendingAssignment) => (
          <div key={assignment.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{assignment.driver_name}</h3>
                <p className="text-sm text-gray-600">{assignment.employee_number}</p>
                <p className="text-xs text-gray-500 mt-1">{assignment.department_name}</p>
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                Pending
              </span>
            </div>

            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700">
                {assignment.unit_number} - {assignment.make} {assignment.model} {assignment.year}
              </p>
              <p className="text-xs text-gray-500">
                Type: {assignment.assignment_type.replace('_', ' ')}
              </p>
              <p className="text-xs text-gray-500">
                Requested: {new Date(assignment.recommended_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedAssignment(assignment);
                  setShowApprovalModal(true);
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => {
                  setSelectedAssignment(assignment);
                  setShowApprovalModal(true);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                Deny
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderActiveTab = () => (
    <div className="space-y-4">
      {dashboardData.active_assignments.map((assignment: any) => (
        <div key={assignment.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">{assignment.driver_name}</h3>
              <p className="text-sm text-gray-600">{assignment.employee_number}</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
              Active
            </span>
          </div>
          <p className="text-sm text-gray-700">
            {assignment.unit_number} - {assignment.make} {assignment.model}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Since: {new Date(assignment.start_date).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );

  const renderOnCallTab = () => (
    <div className="space-y-4">
      {dashboardData.current_on_call.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No team members on-call</p>
        </div>
      ) : (
        dashboardData.current_on_call.map((period: any) => (
          <div key={period.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{period.driver_name}</h3>
                <p className="text-sm text-gray-600">{period.employee_number}</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                On-Call Now
              </span>
            </div>

            {period.unit_number && (
              <p className="text-sm text-gray-700 mb-2">
                Vehicle: {period.unit_number} - {period.make} {period.model}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span>{period.driver_phone || 'N/A'}</span>
              </div>
              <div>
                Callbacks: {period.callback_count}
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Until: {new Date(period.end_datetime).toLocaleDateString()} {new Date(period.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))
      )}
    </div>
  );

  const renderApprovalModal = () => {
    if (!showApprovalModal || !selectedAssignment) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
        <div className="bg-white rounded-t-3xl w-full p-6 space-y-4">
          <h2 className="text-xl font-bold">Review Assignment</h2>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Driver:</strong> {selectedAssignment.driver_name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Vehicle:</strong> {selectedAssignment.unit_number} - {selectedAssignment.make} {selectedAssignment.model}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Type:</strong> {selectedAssignment.assignment_type.replace('_', ' ')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
              placeholder="Add approval or denial notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleQuickApproval(selectedAssignment.id, 'approve')}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium"
            >
              Approve
            </button>
            <button
              onClick={() => handleQuickApproval(selectedAssignment.id, 'deny')}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium"
            >
              Deny
            </button>
          </div>

          <button
            onClick={() => {
              setShowApprovalModal(false);
              setSelectedAssignment(null);
              setApprovalNotes('');
            }}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 pb-8">
        <h1 className="text-2xl font-bold">Manager Dashboard</h1>
        <p className="text-blue-100 mt-1">{user?.email}</p>

        <div className="mt-4 flex gap-2 flex-wrap">
          <div className="bg-yellow-500 px-3 py-1 rounded-full text-sm">
            {dashboardData.notifications.pending_approvals_count} Pending
          </div>
          <div className="bg-green-500 px-3 py-1 rounded-full text-sm">
            {dashboardData.active_assignments.length} Active
          </div>
          <div className="bg-blue-700 px-3 py-1 rounded-full text-sm">
            {dashboardData.notifications.active_on_call_count} On-Call
          </div>
          {dashboardData.notifications.compliance_exceptions_count > 0 && (
            <div className="bg-red-500 px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {dashboardData.notifications.compliance_exceptions_count} Exceptions
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 flex">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-4 text-center font-medium ${
            activeTab === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          Pending ({dashboardData.notifications.pending_approvals_count})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-4 text-center font-medium ${
            activeTab === 'active'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveTab('on-call')}
          className={`flex-1 py-4 text-center font-medium ${
            activeTab === 'on-call'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          On-Call
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'pending' && renderPendingTab()}
        {activeTab === 'active' && renderActiveTab()}
        {activeTab === 'on-call' && renderOnCallTab()}
      </div>

      {/* Approval modal */}
      {renderApprovalModal()}
    </div>
  );
};

export default MobileManagerView;
