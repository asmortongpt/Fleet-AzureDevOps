/**
 * Telemetry Dashboard
 *
 * Development-only component for visualizing telemetry data in real-time.
 * Shows usage metrics, error rates, performance trends, and user behavior.
 *
 * Only renders in development mode.
 */

import React, { useState, useEffect, useCallback } from 'react';

import { getTelemetryConfig } from '../config/telemetry';
import { analytics } from '../services/analytics';
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
