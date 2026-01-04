import React, { useState } from 'react';
import MaintenanceScheduler from './MaintenanceScheduler';
import MaintenanceHistoryList from './MaintenanceHistoryList';
import { MaintenanceRecord } from '../../services/maintenanceService';

interface MaintenanceManagementProps {
  currentTheme: any;
}

type TabType = 'schedule' | 'history' | 'upcoming';

const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({ currentTheme }) => {
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [refresh, setRefresh] = useState(0);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);

  const handleScheduleSuccess = () => {
    setRefresh(prev => prev + 1);
    setActiveTab('upcoming');
  }

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setActiveTab('schedule');
  }

  const tabButtonStyle = (isActive: boolean) => ({
    padding: '12px 24px',
    border: 'none',
    background: isActive ? currentTheme.primary : 'transparent',
    color: isActive ? '#fff' : currentTheme.text,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.2s',
    borderBottom: isActive ? 'none' : `2px solid transparent`
  });

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
          <div style={{
            backgroundColor: currentTheme.card,
            borderRadius: '12px',
            padding: '24px',
            border: `1px solid ${currentTheme.border}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: currentTheme.text
              }}>
                Upcoming Maintenance
              </h2>
              <button
                onClick={() => setRefresh(prev => prev + 1)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: `1px solid ${currentTheme.border}`,
                  backgroundColor: currentTheme.surface,
                  color: currentTheme.text,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
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

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: currentTheme.text,
          marginBottom: '8px'
        }}>
          Maintenance Management
        </h1>
        <p style={{
          fontSize: '14px',
          color: currentTheme.textMuted
        }}>
          Schedule, track, and manage vehicle maintenance operations
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        borderBottom: `2px solid ${currentTheme.border}`,
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('schedule')}
            style={tabButtonStyle(activeTab === 'schedule')}
            onMouseEnter={(e) => {
              if (activeTab !== 'schedule') {
                e.currentTarget.style.backgroundColor = currentTheme.surface
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'schedule') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            📅 Schedule Maintenance
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            style={tabButtonStyle(activeTab === 'upcoming')}
            onMouseEnter={(e) => {
              if (activeTab !== 'upcoming') {
                e.currentTarget.style.backgroundColor = currentTheme.surface;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'upcoming') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            ⏰ Upcoming
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={tabButtonStyle(activeTab === 'history')}
            onMouseEnter={(e) => {
              if (activeTab !== 'history') {
                e.currentTarget.style.backgroundColor = currentTheme.surface;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'history') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            📋 All Records
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>

      {/* Quick Stats Panel */}
      <div style={{
        marginTop: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: currentTheme.card,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${currentTheme.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '32px' }}>🔧</span>
            <div>
              <p style={{ fontSize: '14px', color: currentTheme.textMuted, marginBottom: '4px' }}>
                Scheduled
              </p>
              <p style={{ fontSize: '24px', fontWeight: '600', color: currentTheme.warning }}>
                -
              </p>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: currentTheme.textMuted }}>
            Pending maintenance tasks
          </p>
        </div>

        <div style={{
          backgroundColor: currentTheme.card,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${currentTheme.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '32px' }}>✅</span>
            <div>
              <p style={{ fontSize: '14px', color: currentTheme.textMuted, marginBottom: '4px' }}>
                Completed
              </p>
              <p style={{ fontSize: '24px', fontWeight: '600', color: currentTheme.success }}>
                -
              </p>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: currentTheme.textMuted }}>
            This month
          </p>
        </div>

        <div style={{
          backgroundColor: currentTheme.card,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${currentTheme.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '32px' }}>💰</span>
            <div>
              <p style={{ fontSize: '14px', color: currentTheme.textMuted, marginBottom: '4px' }}>
                Total Spend
              </p>
              <p style={{ fontSize: '24px', fontWeight: '600', color: currentTheme.primary }}>
                -
              </p>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: currentTheme.textMuted }}>
            This month
          </p>
        </div>

        <div style={{
          backgroundColor: currentTheme.card,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${currentTheme.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '32px' }}>📊</span>
            <div>
              <p style={{ fontSize: '14px', color: currentTheme.textMuted, marginBottom: '4px' }}>
                Avg Cost
              </p>
              <p style={{ fontSize: '24px', fontWeight: '600', color: currentTheme.info }}>
                -
              </p>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: currentTheme.textMuted }}>
            Per maintenance
          </p>
        </div>
      </div>
    </div>
  )
};

export default MaintenanceManagement;
