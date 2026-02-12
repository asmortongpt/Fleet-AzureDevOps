/**
 * FLAIR Approval Dashboard Component
 * Interface for supervisors and finance managers to review and approve expense submissions
 * Supports bulk approvals, detailed review, and audit trail management
 */

import React, { useState, useEffect } from 'react';

import { useAuth } from '@/contexts';

// FLAIR expense entry type - defined locally since FLAIRIntegration service is not yet implemented
export interface FLAIRExpenseEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  expenseType: string;
  amount: number;
  transactionDate: string;
  description: string;
  accountCodes: {
    fundCode: string;
    appUnitCode: string;
    objectCode: string;
    locationCode: string;
  };
  supportingDocuments: string[];
  travelDetails?: {
    originAddress: string;
    destinationAddress: string;
    mileage: number;
    mileageRate: number;
    purposeCode: string;
  };
  approvalStatus: 'pending' | 'supervisor_approved' | 'finance_approved' | 'submitted_to_flair' | 'processed' | 'rejected';
  approvalHistory: ApprovalRecord[];
}

interface ApprovalRecord {
  approverEmployeeId: string;
  approverName: string;
  approverTitle: string;
  approvalLevel: string;
  approvedAt: string;
  comments?: string;
}

// Component props
interface FLAIRApprovalDashboardProps {
  onApprovalComplete?: (entryId: string, approved: boolean) => void;
  className?: string;
}

// Filter criteria
interface FilterCriteria {
  status: 'all' | 'pending' | 'supervisor_approved' | 'finance_approved' | 'submitted_to_flair';
  expenseType: 'all' | 'travel_mileage' | 'fuel' | 'maintenance' | 'vehicle_rental';
  amountRange: 'all' | 'under_100' | '100_to_500' | 'over_500';
  dateRange: 'all' | 'today' | 'week' | 'month';
  department: string;
}

// Expense entry card component
const ExpenseEntryCard: React.FC<{
  entry: FLAIRExpenseEntry;
  onApprove: (entryId: string, comments?: string) => void;
  onReject: (entryId: string, reason: string) => void;
  onViewDetails: (entryId: string) => void;
  userRole: string;
}> = ({ entry, onApprove, onReject, onViewDetails, userRole }) => {
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
      supervisor_approved: { color: 'bg-blue-100 text-blue-800', text: 'Supervisor Approved' },
      finance_approved: { color: 'bg-green-100 text-green-800', text: 'Finance Approved' },
      submitted_to_flair: { color: 'bg-purple-100 text-purple-800', text: 'Submitted to FLAIR' },
      processed: { color: 'bg-gray-100 text-gray-800', text: 'Processed' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const config = statusConfig[entry.approvalStatus as keyof typeof statusConfig] || statusConfig.pending;
    return <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>{config.text}</span>;
  };

  const getExpenseTypeIcon = () => {
    const icons = {
      travel_mileage: '🚗',
      fuel: '⛽',
      maintenance: '🔧',
      vehicle_rental: '🚙',
      parking: '🅿️',
      tolls: '💳'
    };
    return icons[entry.expenseType as keyof typeof icons] || '💰';
  };

  const canApprove = () => {
    const role = userRole?.toLowerCase?.() || '';
    if (role === 'superadmin' || role === 'admin') return true;
    if (role === 'manager' && entry.approvalStatus === 'pending') return true;
    return false;
  };

  const handleApproval = () => {
    onApprove(entry.id, comments);
    setShowApprovalForm(false);
    setComments('');
  };

  const handleRejection = () => {
    if (rejectionReason.trim()) {
      onReject(entry.id, rejectionReason);
      setRejectionReason('');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3">
          <span className="text-sm">{getExpenseTypeIcon()}</span>
          <div>
            <h3 className="font-semibold text-gray-900">
              {entry.expenseType.replace('_', ' ').toUpperCase()}
            </h3>
            <p className="text-sm text-slate-700">
              {entry.employeeName} • {entry.department}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-green-600">${entry.amount.toFixed(2)}</div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-2">
        <div className="text-sm">
          <span className="font-medium text-gray-700">Date:</span>{' '}
          {new Date(entry.transactionDate).toLocaleDateString()}
        </div>
        <div className="text-sm">
          <span className="font-medium text-gray-700">Description:</span> {entry.description}
        </div>
        {entry.travelDetails && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Route:</span>{' '}
            {entry.travelDetails.originAddress} → {entry.travelDetails.destinationAddress}
          </div>
        )}
        <div className="text-sm">
          <span className="font-medium text-gray-700">Documents:</span>{' '}
          {entry.supportingDocuments.length} attached
        </div>
      </div>

      {/* Approval history */}
      {entry.approvalHistory.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 mb-2">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Approval History</h4>
          <div className="space-y-1">
            {entry.approvalHistory.map((approval: ApprovalRecord, index: number) => (
              <div key={index} className="text-xs text-slate-700">
                <strong>{approval.approverName}</strong> ({approval.approvalLevel}) approved on{' '}
                {new Date(approval.approvedAt).toLocaleString()}
                {approval.comments && <div className="italic ml-2">"{approval.comments}"</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <button
          onClick={() => onViewDetails(entry.id)}
          className="text-blue-800 hover:text-blue-800 text-sm transition-colors"
        >
          View details
        </button>

        {canApprove() && !showApprovalForm && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowApprovalForm(true)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => {
                const reason = prompt('Reason for rejection:');
                if (reason) {
                  setRejectionReason(reason);
                  handleRejection();
                }
              }}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Approval form */}
      {showApprovalForm && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Approval comments (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any comments about this approval..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowApprovalForm(false)}
                className="px-3 py-1 text-slate-700 hover:text-gray-800 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApproval}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Confirm approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Filter panel component
const FilterPanel: React.FC<{
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
}> = ({ filters, onFiltersChange }) => {
  const updateFilter = (key: keyof FilterCriteria, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 space-y-2">
      <h3 className="font-semibold text-gray-900">Filters</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="supervisor_approved">Supervisor Approved</option>
            <option value="finance_approved">Finance Approved</option>
            <option value="submitted_to_flair">Submitted to FLAIR</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type</label>
          <select
            value={filters.expenseType}
            onChange={(e) => updateFilter('expenseType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Types</option>
            <option value="travel_mileage">Travel Mileage</option>
            <option value="fuel">Fuel</option>
            <option value="maintenance">Maintenance</option>
            <option value="vehicle_rental">Vehicle Rental</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
          <select
            value={filters.amountRange}
            onChange={(e) => updateFilter('amountRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Amounts</option>
            <option value="under_100">Under $100</option>
            <option value="100_to_500">$100 - $500</option>
            <option value="over_500">Over $500</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => updateFilter('dateRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
        <input
          type="text"
          value={filters.department}
          onChange={(e) => updateFilter('department', e.target.value)}
          placeholder="Filter by department..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
    </div>
  );
};

// Summary stats component
const SummaryStats: React.FC<{
  entries: FLAIRExpenseEntry[];
}> = ({ entries }) => {
  const stats = {
    total: entries.length,
    pending: entries.filter((e) => e.approvalStatus === 'pending').length,
    approved: entries.filter((e) => e.approvalStatus === 'finance_approved').length,
    totalAmount: entries.reduce((sum, e) => sum + e.amount, 0)
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
      <div className="bg-white border border-gray-200 rounded-lg p-2">
        <div className="text-sm font-bold text-blue-800">{stats.total}</div>
        <div className="text-sm text-slate-700">Total Entries</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-2">
        <div className="text-sm font-bold text-yellow-600">{stats.pending}</div>
        <div className="text-sm text-slate-700">Pending Approval</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-2">
        <div className="text-sm font-bold text-green-600">{stats.approved}</div>
        <div className="text-sm text-slate-700">Approved</div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-2">
        <div className="text-sm font-bold text-purple-600">${stats.totalAmount.toFixed(2)}</div>
        <div className="text-sm text-slate-700">Total Amount</div>
      </div>
    </div>
  );
};

// Main approval dashboard component
export const FLAIRApprovalDashboard: React.FC<FLAIRApprovalDashboardProps> = ({
  onApprovalComplete,
  className = ''
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FLAIRExpenseEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<FLAIRExpenseEntry[]>([]);
  const [filters, setFilters] = useState<FilterCriteria>({
    status: 'all',
    expenseType: 'all',
    amountRange: 'all',
    dateRange: 'all',
    department: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Load expense entries
  useEffect(() => {
    loadExpenseEntries();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [entries, filters]);

  const loadExpenseEntries = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/flair/expenses', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to load expenses (${response.status})`);
      }

      const payload = await response.json();
      const rows = payload.data ?? payload;

      const mapped: FLAIRExpenseEntry[] = (rows || []).map((item: any) => ({
        id: item.id,
        employeeId: item.employee_id,
        employeeName: item.employee_name,
        department: item.department,
        expenseType: item.expense_type,
        amount: Number(item.amount) || 0,
        transactionDate: item.transaction_date,
        description: item.description,
        accountCodes: item.account_codes || {
          fundCode: '',
          appUnitCode: '',
          objectCode: '',
          locationCode: ''
        },
        supportingDocuments: Array.isArray(item.supporting_documents) ? item.supporting_documents : [],
        travelDetails: item.travel_details || undefined,
        approvalStatus: item.approval_status,
        approvalHistory: Array.isArray(item.approval_history) ? item.approval_history : []
      }));

      setEntries(mapped);
    } catch (error) {
      console.error('Error loading expense entries:', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...entries];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((entry) => entry.approvalStatus === filters.status);
    }

    // Expense type filter
    if (filters.expenseType !== 'all') {
      filtered = filtered.filter((entry) => entry.expenseType === filters.expenseType);
    }

    // Amount range filter
    if (filters.amountRange !== 'all') {
      if (filters.amountRange === 'under_100') {
        filtered = filtered.filter((entry) => entry.amount < 100);
      } else if (filters.amountRange === '100_to_500') {
        filtered = filtered.filter((entry) => entry.amount >= 100 && entry.amount <= 500);
      } else if (filters.amountRange === 'over_500') {
        filtered = filtered.filter((entry) => entry.amount > 500);
      }
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (filters.dateRange === 'today') {
        filtered = filtered.filter((entry) => {
          const entryDate = new Date(entry.transactionDate);
          return entryDate >= today;
        });
      } else if (filters.dateRange === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((entry) => {
          const entryDate = new Date(entry.transactionDate);
          return entryDate >= weekAgo;
        });
      } else if (filters.dateRange === 'month') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((entry) => {
          const entryDate = new Date(entry.transactionDate);
          return entryDate >= monthAgo;
        });
      }
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter((entry) =>
        entry.department.toLowerCase().includes(filters.department.toLowerCase())
      );
    }

    setFilteredEntries(filtered);
  };

  const handleApproval = async (entryId: string, comments?: string) => {
    try {
      const entry = entries.find((e) => e.id === entryId);
      const approverName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Approver';
      const approvalLevel = user?.role === 'Admin' || user?.role === 'SuperAdmin'
        ? 'finance_manager'
        : 'supervisor';

      const approvalRecord: ApprovalRecord = {
        approverEmployeeId: user?.id || '',
        approverName,
        approverTitle: user?.role || '',
        approvalLevel,
        approvedAt: new Date().toISOString(),
        comments
      };

      const updatedHistory = [...(entry?.approvalHistory || []), approvalRecord];
      const nextStatus = approvalLevel === 'finance_manager' ? 'finance_approved' : 'supervisor_approved';

      const response = await fetch(`/api/flair/expenses/${entryId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_status: nextStatus,
          approval_history: updatedHistory
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to approve expense (${response.status})`);
      }

      await loadExpenseEntries();
      onApprovalComplete?.(entryId, true);
    } catch (error) {
      console.error('Error approving expense:', error);
    }
  };

  const handleRejection = async (entryId: string, reason: string) => {
    try {
      const entry = entries.find((e) => e.id === entryId);
      const approverName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Approver';

      const rejectionRecord: ApprovalRecord = {
        approverEmployeeId: user?.id || '',
        approverName,
        approverTitle: user?.role || '',
        approvalLevel: 'rejection',
        approvedAt: new Date().toISOString(),
        comments: reason
      };

      const updatedHistory = [...(entry?.approvalHistory || []), rejectionRecord];

      const response = await fetch(`/api/flair/expenses/${entryId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_status: 'rejected',
          approval_history: updatedHistory
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to reject expense (${response.status})`);
      }

      await loadExpenseEntries();
      onApprovalComplete?.(entryId, false);
    } catch (error) {
      console.error('Error rejecting expense:', error);
    }
  };

  const handleViewDetails = (_entryId: string) => {
    // View details handler - integrate with expense detail panel
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-slate-700">Loading expense entries...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">FLAIR Approval Dashboard</h2>
          <p className="text-slate-700">Review and approve expense submissions</p>
        </div>
        <div className="text-sm text-gray-700">
          Logged in as: {user ? `${user.firstName} ${user.lastName}`.trim() : ''} ({user?.role})
        </div>
      </div>

      {/* Summary stats */}
      <SummaryStats entries={filteredEntries} />

      {/* Filters */}
      <FilterPanel filters={filters} onFiltersChange={setFilters} />

      {/* Entries list */}
      <div className="space-y-2">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-sm mb-2">📭</div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">No Expense Entries Found</h3>
            <p className="text-slate-700">
              Try adjusting your filters or check back later for new submissions.
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <ExpenseEntryCard
              key={entry.id}
              entry={entry}
              onApprove={handleApproval}
              onReject={handleRejection}
              onViewDetails={handleViewDetails}
              userRole={user?.role || 'user'}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FLAIRApprovalDashboard;
