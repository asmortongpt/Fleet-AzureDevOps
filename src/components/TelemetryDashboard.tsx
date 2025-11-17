/**
 * Telemetry Dashboard
 *
 * Development-only component for visualizing telemetry data in real-time.
 * Shows usage metrics, error rates, performance trends, and user behavior.
 *
 * Only renders in development mode.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { analytics } from '../services/analytics';
import { getTelemetryConfig } from '../config/telemetry';
import { PrivacyManager } from '../utils/privacy';
import analyticsService from '../utils/analytics';

interface TelemetryEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId?: string;
}

interface MetricsSummary {
  totalEvents: number;
  uniqueSessions: number;
  errorCount: number;
  avgResponseTime: number;
  topEvents: { name: string; count: number }[];
  recentErrors: TelemetryEvent[];
}

/**
 * Main Telemetry Dashboard Component
 */
export const TelemetryDashboard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummary>({
    totalEvents: 0,
    uniqueSessions: 0,
    errorCount: 0,
    avgResponseTime: 0,
    topEvents: [],
    recentErrors: [],
  });
  const [filter, setFilter] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const config = getTelemetryConfig();

  // Only show in development
  if (import.meta.env.MODE === 'production') {
    return null;
  }

  // Load events from localStorage
  const loadEvents = useCallback(() => {
    try {
      const stored = analyticsService.getEvents();
      setEvents(stored || []);
      calculateMetrics(stored || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }, []);

  // Calculate metrics from events
  const calculateMetrics = useCallback((events: TelemetryEvent[]) => {
    const sessions = new Set(events.map(e => e.sessionId).filter(Boolean));
    const errors = events.filter(e =>
      e.name.includes('error') || e.name.includes('exception')
    );

    const eventCounts = events.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEvents = Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const performanceEvents = events.filter(e =>
      e.properties?.duration || e.properties?.load_time
    );
    const avgResponseTime = performanceEvents.length > 0
      ? performanceEvents.reduce((sum, e) =>
          sum + (e.properties?.duration || e.properties?.load_time || 0), 0
        ) / performanceEvents.length
      : 0;

    setMetrics({
      totalEvents: events.length,
      uniqueSessions: sessions.size,
      errorCount: errors.length,
      avgResponseTime,
      topEvents,
      recentErrors: errors.slice(-10).reverse(),
    });
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    loadEvents();
    const interval = setInterval(loadEvents, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadEvents]);

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Filter events
  const filteredEvents = filter
    ? events.filter(e =>
        e.name.toLowerCase().includes(filter.toLowerCase()) ||
        JSON.stringify(e.properties).toLowerCase().includes(filter.toLowerCase())
      )
    : events;

  // Clear all events
  const handleClearEvents = () => {
    if (confirm('Clear all telemetry data?')) {
      analyticsService.clearEvents();
      loadEvents();
    }
  };

  // Export events
  const handleExportEvents = () => {
    const data = JSON.stringify(events, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={styles.toggleButton}
        title="Toggle Telemetry Dashboard"
      >
        📊
      </button>

      {/* Dashboard panel */}
      {isVisible && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <h2 style={styles.title}>Telemetry Dashboard</h2>
            <button onClick={() => setIsVisible(false)} style={styles.closeButton}>
              ×
            </button>
          </div>

          {/* Configuration status */}
          <div style={styles.configSection}>
            <h3 style={styles.sectionTitle}>Configuration</h3>
            <div style={styles.configGrid}>
              <div style={styles.configItem}>
                <span style={styles.configLabel}>Status:</span>
                <span style={config.enabled ? styles.statusEnabled : styles.statusDisabled}>
                  {config.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div style={styles.configItem}>
                <span style={styles.configLabel}>Level:</span>
                <span>{config.level}</span>
              </div>
              <div style={styles.configItem}>
                <span style={styles.configLabel}>Provider:</span>
                <span>{config.providers.join(', ')}</span>
              </div>
              <div style={styles.configItem}>
                <span style={styles.configLabel}>Session:</span>
                <span style={styles.sessionId}>{analytics.getSessionId()}</span>
              </div>
            </div>
          </div>

          {/* Metrics summary */}
          <div style={styles.metricsSection}>
            <h3 style={styles.sectionTitle}>Metrics</h3>
            <div style={styles.metricsGrid}>
              <MetricCard label="Total Events" value={metrics.totalEvents} />
              <MetricCard label="Sessions" value={metrics.uniqueSessions} />
              <MetricCard label="Errors" value={metrics.errorCount} color="#ef4444" />
              <MetricCard
                label="Avg Response"
                value={`${metrics.avgResponseTime.toFixed(0)}ms`}
              />
            </div>
          </div>

          {/* Top events */}
          <div style={styles.topEventsSection}>
            <h3 style={styles.sectionTitle}>Top Events</h3>
            <div style={styles.topEventsList}>
              {metrics.topEvents.map(({ name, count }) => (
                <div key={name} style={styles.topEventItem}>
                  <span style={styles.eventName}>{name}</span>
                  <span style={styles.eventCount}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent errors */}
          {metrics.recentErrors.length > 0 && (
            <div style={styles.errorsSection}>
              <h3 style={styles.sectionTitle}>Recent Errors</h3>
              <div style={styles.errorsList}>
                {metrics.recentErrors.map((error, idx) => (
                  <div key={idx} style={styles.errorItem}>
                    <div style={styles.errorName}>{error.name}</div>
                    <div style={styles.errorTime}>
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div style={styles.controls}>
            <input
              type="text"
              placeholder="Filter events..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={styles.filterInput}
            />
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
            <button onClick={handleExportEvents} style={styles.actionButton}>
              Export
            </button>
            <button onClick={handleClearEvents} style={styles.dangerButton}>
              Clear All
            </button>
          </div>

          {/* Events list */}
          <div style={styles.eventsSection}>
            <h3 style={styles.sectionTitle}>
              Recent Events ({filteredEvents.length})
            </h3>
            <div style={styles.eventsList}>
              {filteredEvents.slice(-50).reverse().map((event, idx) => (
                <EventItem key={idx} event={event} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{
  label: string;
  value: string | number;
  color?: string;
}> = ({ label, value, color = '#3b82f6' }) => (
  <div style={styles.metricCard}>
    <div style={{ ...styles.metricValue, color }}>{value}</div>
    <div style={styles.metricLabel}>{label}</div>
  </div>
);

/**
 * Event Item Component
 */
const EventItem: React.FC<{ event: TelemetryEvent }> = ({ event }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={styles.eventItem}>
      <div
        style={styles.eventHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={styles.eventTimestamp}>
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
        <span style={styles.eventNameBadge}>{event.name}</span>
        <span style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && event.properties && (
        <pre style={styles.eventProperties}>
          {JSON.stringify(event.properties, null, 2)}
        </pre>
      )}
    </div>
  );
};

/**
 * Styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 20,
    right: 20,
    zIndex: 9999,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  toggleButton: {
    width: 50,
    height: 50,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: 24,
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    position: 'fixed',
    top: 20,
    right: 20,
    bottom: 20,
    width: 500,
    backgroundColor: 'white',
    borderRadius: 8,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: 16,
    backgroundColor: '#1f2937',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: 28,
    cursor: 'pointer',
    padding: 0,
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configSection: {
    padding: 16,
    borderBottom: '1px solid #e5e7eb',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
  },
  configGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    fontSize: 13,
  },
  configItem: {
    display: 'flex',
    gap: 8,
  },
  configLabel: {
    fontWeight: 600,
    color: '#6b7280',
  },
  statusEnabled: {
    color: '#10b981',
    fontWeight: 600,
  },
  statusDisabled: {
    color: '#ef4444',
    fontWeight: 600,
  },
  sessionId: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  metricsSection: {
    padding: 16,
    borderBottom: '1px solid #e5e7eb',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  metricCard: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  topEventsSection: {
    padding: 16,
    borderBottom: '1px solid #e5e7eb',
    maxHeight: 200,
    overflowY: 'auto',
  },
  topEventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  topEventItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    fontSize: 12,
  },
  eventName: {
    fontFamily: 'monospace',
    color: '#374151',
  },
  eventCount: {
    fontWeight: 600,
    color: '#3b82f6',
  },
  errorsSection: {
    padding: 16,
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fef2f2',
  },
  errorsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  errorItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
    backgroundColor: 'white',
    borderRadius: 4,
    fontSize: 12,
  },
  errorName: {
    color: '#ef4444',
    fontWeight: 600,
  },
  errorTime: {
    color: '#6b7280',
    fontSize: 11,
  },
  controls: {
    padding: 16,
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  filterInput: {
    flex: 1,
    padding: '6px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 4,
    fontSize: 13,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  dangerButton: {
    padding: '6px 12px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  eventsSection: {
    flex: 1,
    padding: 16,
    overflowY: 'auto',
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  eventItem: {
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  eventHeader: {
    padding: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    backgroundColor: '#f9fafb',
  },
  eventTimestamp: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  eventNameBadge: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
  },
  expandIcon: {
    fontSize: 10,
    color: '#9ca3af',
  },
  eventProperties: {
    margin: 0,
    padding: 12,
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    fontSize: 11,
    fontFamily: 'monospace',
    overflow: 'auto',
    maxHeight: 300,
  },
};

export default TelemetryDashboard;
