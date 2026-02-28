import React, { useState, useEffect } from 'react';

import { formatCurrency, formatNumber } from '@/utils/format-helpers';

import { MaintenanceRecord } from '../../services/maintenanceService';

import MaintenanceHistoryList from './MaintenanceHistoryList';
import MaintenanceScheduler from './MaintenanceScheduler';

interface MaintenanceManagementProps {
  currentTheme: any;
}

type TabType = 'schedule' | 'history' | 'upcoming';

interface QuickStats {
  scheduled: number;
  completed: number;
  totalSpend: number;
  avgCost: number;
}

const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({ currentTheme }) => {
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [refresh, setRefresh] = useState(0);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [stats, setStats] = useState<QuickStats>({ scheduled: 0, completed: 0, totalSpend: 0, avgCost: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [woRes, costRes] = await Promise.all([
          fetch('/api/work-orders?limit=200', { credentials: 'include' }),
          fetch('/api/costs?limit=200', { credentials: 'include' }),
        ]);

        let scheduled = 0;
        let completed = 0;
        if (woRes.ok) {
          const woJson = await woRes.json();
          const workOrders = woJson.data ?? woJson ?? [];
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          scheduled = workOrders.filter((wo: any) =>
            ['open', 'pending', 'scheduled', 'in_progress'].includes((wo.status || '').toLowerCase())
          ).length;
          completed = workOrders.filter((wo: any) => {
            const isComplete = (wo.status || '').toLowerCase() === 'completed';
            const completedAt = wo.completed_at || wo.completedAt || wo.updated_at;
            return isComplete && completedAt && new Date(completedAt) >= monthStart;
          }).length;
        }

        let totalSpend = 0;
        if (costRes.ok) {
          const costJson = await costRes.json();
          const costs = costJson.data ?? costJson ?? [];
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthCosts = costs.filter((c: any) => {
            const date = c.date || c.created_at || c.createdAt;
            return date && new Date(date) >= monthStart;
          });
          totalSpend = monthCosts.reduce((sum: number, c: any) => sum + (Number(c.amount) || Number(c.total) || 0), 0);
        }

        const avgCost = completed > 0 ? totalSpend / completed : 0;
        setStats({ scheduled, completed, totalSpend, avgCost });
      } catch {
        // Stats are best-effort; leave defaults
      }
    };

    fetchStats();
  }, [refresh]);

  const handleScheduleSuccess = () => {
    setRefresh(prev => prev + 1);
    setActiveTab('upcoming');
  }

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setActiveTab('schedule');
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'schedule', label: 'Schedule Maintenance', icon: '📅' },
    { id: 'upcoming', label: 'Upcoming', icon: '⏰' },
    { id: 'history', label: 'All Records', icon: '📋' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'schedule':
        return (<MaintenanceScheduler
            currentTheme={currentTheme}
            onSuccess={handleScheduleSuccess}
          />
        );

      case 'history':
        return (
          <MaintenanceHistoryList
            currentTheme={currentTheme}
            onEdit={handleEdit}
            refresh={refresh}
          />
        );

      case 'upcoming':
        return (
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/[0.08]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white/80">
                Upcoming Maintenance
              </h2>
              <button
                onClick={() => setRefresh(prev => prev + 1)}
                className="px-4 py-2 rounded-md text-sm font-semibold border border-white/[0.08] bg-white/[0.03] text-white/80 hover:bg-white/[0.06] transition-all cursor-pointer"
              >
                🔄 Refresh
              </button>
            </div>
            <MaintenanceHistoryList
              currentTheme={currentTheme}
              onEdit={handleEdit}
              refresh={refresh}
            />
          </div>);

      default:
        return null
    }
  };

  const statCards = [
    { icon: '🔧', label: 'Scheduled', value: formatNumber(stats.scheduled), color: 'text-amber-400', sub: 'Pending maintenance tasks' },
    { icon: '✅', label: 'Completed', value: formatNumber(stats.completed), color: 'text-emerald-400', sub: 'This month' },
    { icon: '💰', label: 'Total Spend', value: formatCurrency(stats.totalSpend), color: 'text-emerald-400', sub: 'This month' },
    { icon: '📊', label: 'Avg Cost', value: formatCurrency(stats.avgCost), color: 'text-white/80', sub: 'Per maintenance' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-white/80 mb-2">
          Maintenance Management
        </h1>
        <p className="text-sm text-white/40">
          Schedule, track, and manage vehicle maintenance operations
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b-2 border-white/[0.08] mb-6">
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-semibold rounded-t-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-transparent text-white/60 hover:bg-white/[0.03]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>

      {/* Quick Stats — inline metrics matrix */}
      <div className="mt-6 flex items-center gap-0 bg-[#1a1a1a] rounded-lg border border-white/[0.08] overflow-hidden divide-x divide-white/[0.06]">
        {statCards.map(card => (
          <div key={card.label} className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0">
            <span className="text-xl flex-shrink-0">{card.icon}</span>
            <div className="min-w-0">
              <div className="text-[10px] text-white/40 uppercase tracking-wide">{card.label}</div>
              <div className={`text-base font-semibold ${card.color} truncate`}>{card.value}</div>
              <div className="text-[10px] text-white/30">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
};

export default MaintenanceManagement;
