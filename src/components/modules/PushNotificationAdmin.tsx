/**
 * Push Notification Admin Interface
 * Manage and send push notifications to mobile devices
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Send,
  Clock,
  BarChart3,
  Users,
  Smartphone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  FileText,
  TrendingUp,
  Eye
} from 'lucide-react';

interface NotificationStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  delivery_status: string;
  created_at: string;
  total_recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  created_by_name?: string;
}

interface NotificationTemplate {
  id: string;
  template_name: string;
  category: string;
  title_template: string;
  message_template: string;
  priority: string;
}

const PushNotificationAdmin: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'send' | 'schedule' | 'history' | 'stats' | 'templates'>('send');

  // Send notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    category: 'administrative',
    priority: 'normal',
    recipientType: 'all',
    specificUsers: '',
    scheduledFor: '',
    useTemplate: false,
    selectedTemplate: '',
    templateVariables: '{}'
  });

  // Fetch functions for queries
  const fetchStats = async (): Promise<NotificationStats> => {
    const response = await fetch('/api/push-notifications/stats', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch stats');
    return data.data;
  };

  const fetchHistory = async (): Promise<NotificationHistory[]> => {
    const response = await fetch('/api/push-notifications/history?limit=50', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch history');
    return data.data;
  };

  const fetchTemplates = async (): Promise<NotificationTemplate[]> => {
    const response = await fetch('/api/push-notifications/templates', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch templates');
    return data.data;
  };

  const fetchUsers = async () => {
    const response = await fetch('/api/users', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch users');
    return data.data;
  };

  // Queries
  const statsQuery = useQuery({
    queryKey: ['pushNotificationStats'],
    queryFn: fetchStats
  });

  const historyQuery = useQuery({
    queryKey: ['pushNotificationHistory'],
    queryFn: fetchHistory
  });

  const templatesQuery = useQuery({
    queryKey: ['pushNotificationTemplates'],
    queryFn: fetchTemplates
  });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  // Mutations
  const sendNotificationMutation = useMutation({
    mutationFn: async (body: any) => {
      const response = await fetch(body.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body.payload)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to send notification');
      return data;
    },
    onSuccess: () => {
      alert('Notification sent successfully!');
      setNotificationForm({
        title: '',
        message: '',
        category: 'administrative',
        priority: 'normal',
        recipientType: 'all',
        specificUsers: '',
        scheduledFor: '',
        useTemplate: false,
        selectedTemplate: '',
        templateVariables: '{}'
      });
      queryClient.invalidateQueries({ queryKey: ['pushNotificationHistory'] });
      queryClient.invalidateQueries({ queryKey: ['pushNotificationStats'] });
    },
    onError: (error: any) => {
      alert('Failed to send notification: ' + (error.message || 'Unknown error'));
    }
  });

  const scheduleNotificationMutation = useMutation({
    mutationFn: async (body: any) => {
      const response = await fetch('/api/push-notifications/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to schedule notification');
      return data;
    },
    onSuccess: () => {
      alert('Notification scheduled successfully!');
      setNotificationForm({
        title: '',
        message: '',
        category: 'administrative',
        priority: 'normal',
        recipientType: 'all',
        specificUsers: '',
        scheduledFor: '',
        useTemplate: false,
        selectedTemplate: '',
        templateVariables: '{}'
      });
      queryClient.invalidateQueries({ queryKey: ['pushNotificationHistory'] });
      queryClient.invalidateQueries({ queryKey: ['pushNotificationStats'] });
    },
    onError: (error: any) => {
      alert('Failed to schedule notification: ' + (error.message || 'Unknown error'));
    }
  });

  const sendFromTemplateMutation = useMutation({
    mutationFn: async (body: any) => {
      const response = await fetch('/api/push-notifications/send-from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to send notification');
      return data;
    },
    onSuccess: () => {
      alert('Notification sent from template successfully!');
      setNotificationForm({
        title: '',
        message: '',
        category: 'administrative',
        priority: 'normal',
        recipientType: 'all',
        specificUsers: '',
        scheduledFor: '',
        useTemplate: false,
        selectedTemplate: '',
        templateVariables: '{}'
      });
      queryClient.invalidateQueries({ queryKey: ['pushNotificationHistory'] });
      queryClient.invalidateQueries({ queryKey: ['pushNotificationStats'] });
    },
    onError: (error: any) => {
      alert('Failed to send notification: ' + (error.message || 'Unknown error'));
    }
  });

  const testNotificationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/push-notifications/test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (!data.success) throw new Error('Failed to send test notification');
      return data;
    },
    onSuccess: () => {
      alert('Test notification sent! Check your mobile device.');
    },
    onError: () => {
      alert('Failed to send test notification');
    }
  });

  const handleSendNotification = async () => {
    try {
      let endpoint = '/api/push-notifications/send';
      let body: any = {
        title: notificationForm.title,
        message: notificationForm.message,
        category: notificationForm.category,
        priority: notificationForm.priority,
        actionButtons: [
          { id: 'view', title: 'View Details' },
          { id: 'dismiss', title: 'Dismiss' }
        ]
      };

      // Handle recipient selection
      if (notificationForm.recipientType === 'all') {
        // Use users from usersQuery
        body.userIds = usersQuery.data?.map((u: any) => u.id) || [];
        endpoint = '/api/push-notifications/send-bulk';
      } else if (notificationForm.recipientType === 'specific') {
        const userIds = notificationForm.specificUsers.split(',').map(id => id.trim());
        body.userIds = userIds;
        endpoint = '/api/push-notifications/send-bulk';
      }

      // Handle scheduling
      if (notificationForm.scheduledFor) {
        scheduleNotificationMutation.mutate({
          title: notificationForm.title,
          message: notificationForm.message,
          category: notificationForm.category,
          priority: notificationForm.priority,
          actionButtons: [
            { id: 'view', title: 'View Details' },
            { id: 'dismiss', title: 'Dismiss' }
          ],
          scheduledFor: notificationForm.scheduledFor,
          recipients: body.userIds?.map((id: string) => ({ userId: id })) || []
        });
      } else {
        sendNotificationMutation.mutate({
          endpoint,
          payload: body
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    }
  };

  const handleSendFromTemplate = async () => {
    try {
      const variables = JSON.parse(notificationForm.templateVariables);
      const recipients = usersQuery.data?.map((u: any) => ({ userId: u.id })) || [];

      sendFromTemplateMutation.mutate({
        templateName: notificationForm.selectedTemplate,
        recipients,
        variables
      });
    } catch (error) {
      console.error('Error sending from template:', error);
      alert('Failed to send notification');
    }
  };

  const handleSendTest = () => {
    testNotificationMutation.mutate();
  };

  const categoryOptions = [
    { value: 'critical_alert', label: 'Critical Alert', color: 'red' },
    { value: 'maintenance_reminder', label: 'Maintenance Reminder', color: 'orange' },
    { value: 'task_assignment', label: 'Task Assignment', color: 'blue' },
    { value: 'driver_alert', label: 'Driver Alert', color: 'yellow' },
    { value: 'administrative', label: 'Administrative', color: 'gray' },
    { value: 'performance', label: 'Performance', color: 'green' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', icon: '📘' },
    { value: 'normal', label: 'Normal', icon: '📗' },
    { value: 'high', label: 'High', icon: '📙' },
    { value: 'critical', label: 'Critical', icon: '📕' }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="text-blue-600" size={32} />
                Push Notification Admin
              </h1>
              <p className="text-gray-600 mt-2">
                Send and manage mobile push notifications for iOS and Android
              </p>
            </div>
            <button
              onClick={handleSendTest}
              disabled={testNotificationMutation.isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Smartphone size={20} />
              {testNotificationMutation.isPending ? 'Sending...' : 'Send Test Notification'}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {statsQuery.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sent</p>
                  <p className="text-2xl font-bold text-gray-900">{statsQuery.data.totalSent}</p>
                </div>
                <Send className="text-blue-600" size={32} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Delivery Rate</p>
                  <p className="text-2xl font-bold text-green-600">{statsQuery.data.deliveryRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="text-green-600" size={32} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Open Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{statsQuery.data.openRate.toFixed(1)}%</p>
                </div>
                <Eye className="text-blue-600" size={32} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Click Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{statsQuery.data.clickRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="text-purple-600" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('send')}
                className={`px-6 py-3 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'send'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Send size={18} />
                Send Notification
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-6 py-3 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'templates'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <FileText size={18} />
                Templates
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Clock size={18} />
                History
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-3 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'stats'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <BarChart3 size={18} />
                Statistics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Send Notification Tab */}
            {activeTab === 'send' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={notificationForm.useTemplate}
                      onChange={(e) => setNotificationForm({ ...notificationForm, useTemplate: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Use Template</span>
                  </label>
                </div>

                {notificationForm.useTemplate ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Template
                      </label>
                      <select
                        value={notificationForm.selectedTemplate}
                        onChange={(e) => setNotificationForm({ ...notificationForm, selectedTemplate: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select Template --</option>
                        {templatesQuery.data?.map(template => (
                          <option key={template.id} value={template.template_name}>
                            {template.template_name} ({template.category})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Variables (JSON)
                      </label>
                      <textarea
                        value={notificationForm.templateVariables}
                        onChange={(e) => setNotificationForm({ ...notificationForm, templateVariables: e.target.value })}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder='{"vehicleId": "V-001", "location": "Highway 101"}'
                      />
                    </div>
                    <button
                      onClick={handleSendFromTemplate}
                      disabled={sendFromTemplateMutation.isPending || !notificationForm.selectedTemplate}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send size={20} />
                      {sendFromTemplateMutation.isPending ? 'Sending...' : 'Send from Template'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={notificationForm.category}
                          onChange={(e) => setNotificationForm({ ...notificationForm, category: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {categoryOptions.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority
                        </label>
                        <select
                          value={notificationForm.priority}
                          onChange={(e) => setNotificationForm({ ...notificationForm, priority: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {priorityOptions.map(pri => (
                            <option key={pri.value} value={pri.value}>
                              {pri.icon} {pri.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={notificationForm.title}
                        onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Notification title..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        value={notificationForm.message}
                        onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Notification message..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recipients
                      </label>
                      <select
                        value={notificationForm.recipientType}
                        onChange={(e) => setNotificationForm({ ...notificationForm, recipientType: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                      >
                        <option value="all">All Users</option>
                        <option value="specific">Specific Users</option>
                      </select>
                      {notificationForm.recipientType === 'specific' && (
                        <input
                          type="text"
                          value={notificationForm.specificUsers}
                          onChange={(e) => setNotificationForm({ ...notificationForm, specificUsers: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="User IDs (comma-separated)"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schedule (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={notificationForm.scheduledFor}
                        onChange={(e) => setNotificationForm({ ...notificationForm, scheduledFor: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      onClick={handleSendNotification}
                      disabled={sendNotificationMutation.isPending || scheduleNotificationMutation.isPending || !notificationForm.title || !notificationForm.message}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {notificationForm.scheduledFor ? <Calendar size={20} /> : <Send size={20} />}
                      {sendNotificationMutation.isPending || scheduleNotificationMutation.isPending ? 'Sending...' : notificationForm.scheduledFor ? 'Schedule Notification' : 'Send Now'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Available Templates</h3>
                  {templatesQuery.isRefetching && <span className="text-sm text-gray-500">Refreshing...</span>}
                </div>
                {templatesQuery.isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading templates...</div>
                ) : templatesQuery.error ? (
                  <div className="text-center py-8 text-red-500">Error loading templates</div>
                ) : (
                  <div className="grid gap-4">
                    {templatesQuery.data?.map(template => (
                      <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{template.template_name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Category:</span> {template.category}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Priority:</span> {template.priority}
                            </p>
                            <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                              <p className="text-sm font-medium text-gray-700">{template.title_template}</p>
                              <p className="text-sm text-gray-600 mt-1">{template.message_template}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Notification History</h3>
                  <button
                    onClick={() => historyQuery.refetch()}
                    disabled={historyQuery.isRefetching}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    {historyQuery.isRefetching ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                {historyQuery.isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading history...</div>
                ) : historyQuery.error ? (
                  <div className="text-center py-8 text-red-500">Error loading history</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Title</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Priority</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Recipients</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Delivered</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Opened</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {historyQuery.data?.map(notification => (
                          <tr key={notification.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium text-gray-900">{notification.title}</div>
                              <div className="text-gray-600 text-xs mt-1">{notification.message.substring(0, 50)}...</div>
                            </td>
                            <td className="px-4 py-3 text-sm">{notification.category}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                notification.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                notification.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {notification.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{notification.total_recipients}</td>
                            <td className="px-4 py-3 text-sm">{notification.delivered}</td>
                            <td className="px-4 py-3 text-sm">{notification.opened}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                notification.delivery_status === 'sent' ? 'bg-green-100 text-green-800' :
                                notification.delivery_status === 'sending' ? 'bg-yellow-100 text-yellow-800' :
                                notification.delivery_status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {notification.delivery_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(notification.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div>
                {statsQuery.isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading statistics...</div>
                ) : statsQuery.error ? (
                  <div className="text-center py-8 text-red-500">Error loading statistics</div>
                ) : statsQuery.data ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold mb-4">Delivery Statistics</h3>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="text-sm font-medium text-gray-600 mb-4">Delivery Performance</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Delivered</span>
                              <span className="font-semibold">{statsQuery.data.delivered} / {statsQuery.data.totalSent}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${statsQuery.data.deliveryRate}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Failed</span>
                              <span className="font-semibold">{statsQuery.data.failed}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-red-600 h-2 rounded-full"
                                style={{ width: `${(statsQuery.data.failed / statsQuery.data.totalSent) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="text-sm font-medium text-gray-600 mb-4">Engagement Metrics</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Open Rate</span>
                              <span className="font-semibold">{statsQuery.data.openRate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${statsQuery.data.openRate}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Click Rate</span>
                              <span className="font-semibold">{statsQuery.data.clickRate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${statsQuery.data.clickRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-800 font-medium">Total Notifications</p>
                            <p className="text-3xl font-bold text-blue-900 mt-2">{statsQuery.data.totalSent}</p>
                          </div>
                          <Bell className="text-blue-600" size={40} />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-800 font-medium">Successfully Delivered</p>
                            <p className="text-3xl font-bold text-green-900 mt-2">{statsQuery.data.delivered}</p>
                          </div>
                          <CheckCircle className="text-green-600" size={40} />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-800 font-medium">User Interactions</p>
                            <p className="text-3xl font-bold text-purple-900 mt-2">{statsQuery.data.clicked}</p>
                          </div>
                          <TrendingUp className="text-purple-600" size={40} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { PushNotificationAdmin };
export default PushNotificationAdmin;
