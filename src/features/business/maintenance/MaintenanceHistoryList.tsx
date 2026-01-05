import React, { useState, useEffect } from 'react';

import { maintenanceService, MaintenanceRecord } from '../../services/maintenanceService';
import { vehicleService, Vehicle } from '../../services/vehicleService';

interface MaintenanceHistoryListProps {
  currentTheme: any;
  onEdit?: (record: MaintenanceRecord) => void;
  refresh?: number;
}

const MaintenanceHistoryList: React.FC<MaintenanceHistoryListProps> = ({
  currentTheme,
  onEdit,
  refresh
}) => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterVehicle, setFilterVehicle] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchData();
  }, [refresh]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordsData, vehiclesData] = await Promise.all([
        maintenanceService.getAll(),
        vehicleService.getAll()
      ]);
      setRecords(recordsData);
      setVehicles(vehiclesData);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await maintenanceService.update(id, { status: 'Completed' });
      await fetchData();
    } catch (err: any) {
      console.error('Failed to complete maintenance:', err);
      alert('Failed to mark as completed: ' + (err.message || 'Unknown error'))
    }
  };

  const getFilteredAndSortedRecords = () => {
    let filtered = [...records];

    if (filterVehicle) {
      filtered = filtered.filter(r => r.vehicleId === filterVehicle);
    }

    if (filterStatus) {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime();
          break;
        case 'cost':
          comparison = (a.cost || 0) - (b.cost || 0);
          break;
        case 'type':
          comparison = a.serviceType.localeCompare(b.serviceType);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredRecords = getFilteredAndSortedRecords();
  const totalCost = filteredRecords.reduce((sum, r) => sum + (r.cost || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return currentTheme.warning;
      case 'Completed':
        return currentTheme.success;
      case 'Cancelled':
        return currentTheme.danger;
      default:
        return currentTheme.textMuted
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  };

  const tableHeaderStyle = {
    padding: '12px',
    textAlign: 'left' as const,
    fontSize: '14px',
    fontWeight: '600',
    color: currentTheme.text,
    borderBottom: `2px solid ${currentTheme.border}`,
    cursor: 'pointer',
    userSelect: 'none' as const
  };

  const tableCellStyle = {
    padding: '12px',
    fontSize: '14px',
    color: currentTheme.text,
    borderBottom: `1px solid ${currentTheme.border}`
  };

  const buttonStyle = {
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }

  if (loading) {
    return (
      <div style={{
        backgroundColor: currentTheme.card,
        borderRadius: '12px',
        padding: '24px',
        border: `1px solid ${currentTheme.border}`,
        textAlign: 'center'
      }}>
        <p style={{ color: currentTheme.text }}>Loading maintenance records...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: currentTheme.card,
        borderRadius: '12px',
        padding: '24px',
        border: `1px solid ${currentTheme.border}`
      }}>
        <div style={{
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '6px',
          padding: '12px',
          color: '#c00'
        }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: currentTheme.card,
      borderRadius: '12px',
      padding: '24px',
      border: `1px solid ${currentTheme.border}`
    }}>
      {/* Header with filters */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: currentTheme.text,
          marginBottom: '16px'
        }}>
          Maintenance History
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: currentTheme.text
            }}>
              Filter by Vehicle
            </label>
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: currentTheme.bg,
                color: currentTheme.text
              }}
            >
              <option value="">All Vehicles</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.licensePlate || vehicle.vin} - {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: currentTheme.text
            }}>
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${currentTheme.border}`,
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: currentTheme.bg,
                color: currentTheme.text
              }}
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: currentTheme.text
            }}>
              Sort By
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'cost' | 'type')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: currentTheme.bg,
                  color: currentTheme.text
                }}
              >
                <option value="date">Date</option>
                <option value="cost">Cost</option>
                <option value="type">Type</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{
                  ...buttonStyle,
                  backgroundColor: currentTheme.surface,
                  color: currentTheme.text
                }}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: currentTheme.surface,
        borderRadius: '8px'
      }}>
        <div>
          <p style={{ fontSize: '14px', color: currentTheme.textMuted, marginBottom: '4px' }}>
            Total Records
          </p>
          <p style={{ fontSize: '24px', fontWeight: '600', color: currentTheme.text }}>
            {filteredRecords.length}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '14px', color: currentTheme.textMuted, marginBottom: '4px' }}>
            Total Cost
          </p>
          <p style={{ fontSize: '24px', fontWeight: '600', color: currentTheme.success }}>
            {formatCurrency(totalCost)}
          </p>
        </div>
      </div>

      {/* Table */}
      {filteredRecords.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: currentTheme.textMuted
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No maintenance records found</p>
          <p style={{ fontSize: '14px' }}>
            {filterVehicle || filterStatus ? 'Try adjusting your filters' : 'Schedule your first maintenance'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle} onClick={() => setSortBy('date')}>
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={tableHeaderStyle}>Vehicle</th>
                <th style={tableHeaderStyle} onClick={() => setSortBy('type')}>
                  Service Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={tableHeaderStyle}>Vendor</th>
                <th style={tableHeaderStyle}>Mileage</th>
                <th style={tableHeaderStyle} onClick={() => setSortBy('cost')}>
                  Cost {sortBy === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td style={tableCellStyle}>
                    {formatDate(record.serviceDate)}
                  </td>
                  <td style={tableCellStyle}>
                    {record.vehicle ? (
                      <div>
                        <div style={{ fontWeight: '500' }}>
                          {record.vehicle.licensePlate || 'N/A'}
                        </div>
                        <div style={{ fontSize: '12px', color: currentTheme.textMuted }}>
                          {record.vehicle.make} {record.vehicle.model}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: currentTheme.textMuted }}>Unknown</span>
                    )}
                  </td>
                  <td style={tableCellStyle}>{record.serviceType}</td>
                  <td style={tableCellStyle}>{record.vendor || '-'}</td>
                  <td style={tableCellStyle}>
                    {record.mileageAtService ? record.mileageAtService.toLocaleString() : '-'}
                  </td>
                  <td style={tableCellStyle}>
                    <strong>{formatCurrency(record.cost)}</strong>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: getStatusColor(record.status) + '20',
                      color: getStatusColor(record.status)
                    }}>
                      {record.status}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {record.status === 'Scheduled' && (
                        <>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(record)}
                              style={{
                                ...buttonStyle,
                                backgroundColor: currentTheme.primary + '20',
                                color: currentTheme.primary
                              }}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleComplete(record.id)}
                            style={{
                              ...buttonStyle,
                              backgroundColor: currentTheme.success + '20',
                              color: currentTheme.success
                            }}
                          >
                            Complete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
};

export default MaintenanceHistoryList;
