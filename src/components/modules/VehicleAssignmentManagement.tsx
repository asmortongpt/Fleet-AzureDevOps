/**
 * Vehicle Assignment Management Module
 * Comprehensive interface for managing vehicle assignments, on-call periods,
 * cost/benefit analyses, and annual reauthorization
 *
 * Supports BR-1 through BR-11 requirements
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Car,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Building,
  BarChart,
  Download,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// Types
interface VehicleAssignment {
  id: string;
  vehicle_id: string;
  driver_id: string;
  department_id: string;
  assignment_type: 'designated' | 'on_call' | 'temporary';
  start_date: string;
  end_date?: string;
  lifecycle_state: string;
  approval_status: string;
  commuting_authorized: boolean;
  // Expanded fields from joins
  unit_number: string;
  make: string;
  model: string;
  year: number;
  driver_first_name: string;
  driver_last_name: string;
  employee_number: string;
  department_name: string;
  home_county: string;
  secured_parking_name?: string;
}

interface OnCallPeriod {
  id: string;
  driver_id: string;
  start_datetime: string;
  end_datetime: string;
  is_active: boolean;
  acknowledged_by_driver: boolean;
  callback_count: number;
  driver_first_name: string;
  driver_last_name: string;
}

interface ComplianceException {
  assignment_id: string;
  exception_type: string;
  exception_description: string;
  driver_name: string;
  unit_number: string;
  department_name: string;
}

const VehicleAssignmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assignments' | 'on-call' | 'compliance' | 'reports'>('assignments');

  // State for assignments
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<VehicleAssignment[]>([]);
  const [onCallPeriods, setOnCallPeriods] = useState<OnCallPeriod[]>([]);
  const [complianceExceptions, setComplianceExceptions] = useState<ComplianceException[]>([]);

  // Filters
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<string>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<VehicleAssignment | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchAssignments();
    if (activeTab === 'on-call') {
      fetchOnCallPeriods();
    } else if (activeTab === 'compliance') {
      fetchComplianceExceptions();
    }
  }, [activeTab]);

  // Apply filters
  useEffect(() => {
    let filtered = assignments;

    if (assignmentTypeFilter !== 'all') {
      filtered = filtered.filter(a => a.assignment_type === assignmentTypeFilter);
    }
    if (lifecycleFilter !== 'all') {
      filtered = filtered.filter(a => a.lifecycle_state === lifecycleFilter);
    }
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(a => a.department_id === departmentFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.driver_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.driver_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employee_number.includes(searchTerm) ||
        a.unit_number.includes(searchTerm)
      );
    }

    setFilteredAssignments(filtered);
  }, [assignments, assignmentTypeFilter, lifecycleFilter, departmentFilter, searchTerm]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vehicle-assignments?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnCallPeriods = async () => {
    try {
      const response = await fetch('/api/on-call-periods/active/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setOnCallPeriods(data || []);
    } catch (err: any) {
      console.error('Error fetching on-call periods:', err);
    }
  };

  const fetchComplianceExceptions = async () => {
    try {
      const response = await fetch('/api/reports/policy-compliance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setComplianceExceptions(data.exceptions || []);
    } catch (err: any) {
      console.error('Error fetching compliance exceptions:', err);
    }
  };

  const handleApproveAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/vehicle-assignments/${assignmentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (response.ok) {
        fetchAssignments();
      }
    } catch (err: any) {
      console.error('Error approving assignment:', err);
    }
  };

  const handleDenyAssignment = async (assignmentId: string, reason: string) => {
    try {
      const response = await fetch(`/api/vehicle-assignments/${assignmentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action: 'deny', notes: reason }),
      });

      if (response.ok) {
        fetchAssignments();
      }
    } catch (err: any) {
      console.error('Error denying assignment:', err);
    }
  };

  const getAssignmentTypeColor = (type: string) => {
    switch (type) {
      case 'designated': return 'bg-blue-100 text-blue-800';
      case 'on_call': return 'bg-green-100 text-green-800';
      case 'temporary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLifecycleStateColor = (state: string) => {
    switch (state) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'terminated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render tabs
  const renderTabs = () => (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`${
            activeTab === 'assignments'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
        >
          <Car className="w-5 h-5" />
          Vehicle Assignments
        </button>
        <button
          onClick={() => setActiveTab('on-call')}
          className={`${
            activeTab === 'on-call'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
        >
          <Clock className="w-5 h-5" />
          On-Call Management
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`${
            activeTab === 'compliance'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
        >
          <AlertTriangle className="w-5 h-5" />
          Policy Compliance
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`${
            activeTab === 'reports'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
        >
          <BarChart className="w-5 h-5" />
          Reports & Analytics
        </button>
      </nav>
    </div>
  );

  // Render assignments tab
  const renderAssignmentsTab = () => (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search driver or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={assignmentTypeFilter}
            onChange={(e) => setAssignmentTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="designated">Designated</option>
            <option value="on_call">On-Call</option>
            <option value="temporary">Temporary</option>
          </select>

          <select
            value={lifecycleFilter}
            onChange={(e) => setLifecycleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All States</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="denied">Denied</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Assignment
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
            </div>
            <Car className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {assignments.filter(a => a.lifecycle_state === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">
                {assignments.filter(a => a.lifecycle_state === 'submitted').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Temporary</p>
              <p className="text-2xl font-bold text-purple-600">
                {assignments.filter(a => a.assignment_type === 'temporary').length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Assignments table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Region
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssignments.map((assignment) => (
              <tr key={assignment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {assignment.driver_first_name} {assignment.driver_last_name}
                    </div>
                    <div className="text-sm text-gray-500">{assignment.employee_number}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{assignment.unit_number}</div>
                    <div className="text-sm text-gray-500">
                      {assignment.make} {assignment.model} {assignment.year}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAssignmentTypeColor(assignment.assignment_type)}`}>
                    {assignment.assignment_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLifecycleStateColor(assignment.lifecycle_state)}`}>
                    {assignment.lifecycle_state}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(assignment.start_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    {assignment.home_county || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => setSelectedAssignment(assignment)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                  {assignment.lifecycle_state === 'submitted' && user?.role === 'ExecutiveTeamMember' && (
                    <>
                      <button
                        onClick={() => handleApproveAssignment(assignment.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDenyAssignment(assignment.id, 'Denied by executive review')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deny
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render on-call tab
  const renderOnCallTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Active On-Call Periods</h3>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Schedule On-Call
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {onCallPeriods.map((period) => (
          <div key={period.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {period.driver_first_name} {period.driver_last_name}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(period.start_datetime).toLocaleDateString()} -{' '}
                  {new Date(period.end_datetime).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${period.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {period.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Acknowledged:</span>
                <span className={period.acknowledged_by_driver ? 'text-green-600' : 'text-red-600'}>
                  {period.acknowledged_by_driver ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Callbacks:</span>
                <span className="font-medium">{period.callback_count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render compliance tab
  const renderComplianceTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Policy Compliance Exceptions</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {complianceExceptions.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-green-900">No Compliance Exceptions</h4>
          <p className="text-green-700 mt-2">All vehicle assignments are compliant with policies.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Exception Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complianceExceptions.map((exception, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {exception.exception_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {exception.driver_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {exception.unit_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {exception.exception_description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render reports tab
  const renderReportsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Reports & Analytics</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:border-blue-500 transition-colors text-left">
          <FileText className="w-8 h-8 text-blue-600 mb-3" />
          <h4 className="font-semibold text-gray-900">Assignment Inventory</h4>
          <p className="text-sm text-gray-500 mt-2">
            Comprehensive list of all vehicle assignments by department and type
          </p>
        </button>

        <button className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:border-blue-500 transition-colors text-left">
          <BarChart className="w-8 h-8 text-green-600 mb-3" />
          <h4 className="font-semibold text-gray-900">Department Summary</h4>
          <p className="text-sm text-gray-500 mt-2">
            Assignment statistics grouped by department
          </p>
        </button>

        <button className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:border-blue-500 transition-colors text-left">
          <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
          <h4 className="font-semibold text-gray-900">Cost/Benefit Analysis</h4>
          <p className="text-sm text-gray-500 mt-2">
            Financial analysis of vehicle assignments
          </p>
        </button>

        <button className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:border-blue-500 transition-colors text-left">
          <MapPin className="w-8 h-8 text-orange-600 mb-3" />
          <h4 className="font-semibold text-gray-900">Region Distribution</h4>
          <p className="text-sm text-gray-500 mt-2">
            Geographic distribution of assignments by region
          </p>
        </button>

        <button className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:border-blue-500 transition-colors text-left">
          <Clock className="w-8 h-8 text-yellow-600 mb-3" />
          <h4 className="font-semibold text-gray-900">On-Call Summary</h4>
          <p className="text-sm text-gray-500 mt-2">
            On-call periods, callbacks, and reimbursements
          </p>
        </button>

        <button className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:border-blue-500 transition-colors text-left">
          <FileText className="w-8 h-8 text-red-600 mb-3" />
          <h4 className="font-semibold text-gray-900">Change History</h4>
          <p className="text-sm text-gray-500 mt-2">
            Complete audit trail of all assignment changes
          </p>
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Assignment Management</h1>
          <p className="text-gray-600 mt-1">
            Manage vehicle assignments, on-call periods, and compliance
          </p>
        </div>
      </div>

      {renderTabs()}

      <div className="mt-6">
        {activeTab === 'assignments' && renderAssignmentsTab()}
        {activeTab === 'on-call' && renderOnCallTab()}
        {activeTab === 'compliance' && renderComplianceTab()}
        {activeTab === 'reports' && renderReportsTab()}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleAssignmentManagement;
