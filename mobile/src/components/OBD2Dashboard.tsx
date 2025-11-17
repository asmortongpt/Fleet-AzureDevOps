/**
 * OBD2Dashboard Component
 * Complete vehicle diagnostics dashboard with live metrics and DTC codes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Gauge from './Gauge';
import DTCCard from './DTCCard';
import {
  VehicleDiagnostics,
  ConnectionStatus,
  DTCCode,
  GAUGE_CONFIGS,
  ReadinessMonitors,
  MonitorStatus,
  celsiusToFahrenheit,
  DTCSeverity,
} from '../types/obd2';
import {
  calculateVehicleHealth,
  HealthScoreBreakdown,
  RiskLevel,
  RecommendationPriority,
} from '../services/VehicleHealthScore';

// ============================================================================
// Types
// ============================================================================

export interface OBD2DashboardProps {
  vehicleId: string;
  diagnostics: VehicleDiagnostics | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onClearCodes?: (codes: string[]) => void;
  onCreateWorkOrder?: (dtcCode: string) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get connection status color
 */
const getConnectionStatusColor = (status: ConnectionStatus): string => {
  switch (status) {
    case ConnectionStatus.CONNECTED:
      return '#10b981'; // green-500
    case ConnectionStatus.CONNECTING:
      return '#f59e0b'; // amber-500
    case ConnectionStatus.ERROR:
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
};

/**
 * Get connection status text
 */
const getConnectionStatusText = (status: ConnectionStatus): string => {
  switch (status) {
    case ConnectionStatus.CONNECTED:
      return 'Connected';
    case ConnectionStatus.CONNECTING:
      return 'Connecting...';
    case ConnectionStatus.ERROR:
      return 'Connection Error';
    default:
      return 'Disconnected';
  }
};

/**
 * Get health score color
 */
const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return '#10b981'; // green
  if (score >= 60) return '#f59e0b'; // amber
  if (score >= 40) return '#fb923c'; // orange
  return '#ef4444'; // red
};

/**
 * Get risk level badge color
 */
const getRiskLevelColor = (level: RiskLevel): { bg: string; text: string } => {
  switch (level) {
    case RiskLevel.LOW:
      return { bg: '#d1fae5', text: '#065f46' }; // green
    case RiskLevel.MODERATE:
      return { bg: '#fef3c7', text: '#92400e' }; // amber
    case RiskLevel.HIGH:
      return { bg: '#fed7aa', text: '#9a3412' }; // orange
    case RiskLevel.CRITICAL:
      return { bg: '#fee2e2', text: '#991b1b' }; // red
  }
};

// ============================================================================
// OBD2Dashboard Component
// ============================================================================

export const OBD2Dashboard: React.FC<OBD2DashboardProps> = ({
  vehicleId,
  diagnostics,
  isLoading = false,
  onRefresh,
  onConnect,
  onDisconnect,
  onClearCodes,
  onCreateWorkOrder,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [healthScore, setHealthScore] = useState<HealthScoreBreakdown | null>(
    null
  );

  // Calculate health score when diagnostics change
  useEffect(() => {
    if (diagnostics) {
      const score = calculateVehicleHealth(
        diagnostics.dtcCodes,
        diagnostics.liveData?.data,
        diagnostics.readinessMonitors,
        diagnostics.vehicleInfo
      );
      setHealthScore(score);
    }
  }, [diagnostics]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  }, [onRefresh]);

  /**
   * Handle clear all codes
   */
  const handleClearAllCodes = () => {
    if (!diagnostics || diagnostics.dtcCodes.length === 0) {
      Alert.alert('No Codes', 'There are no diagnostic codes to clear.');
      return;
    }

    Alert.alert(
      'Clear All Codes',
      `Are you sure you want to clear all ${diagnostics.dtcCodes.length} diagnostic trouble codes?\n\nImportant: This only clears the codes from memory. If the underlying issues are not fixed, the codes will return.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            if (onClearCodes) {
              const codes = diagnostics.dtcCodes.map((dtc) => dtc.code);
              onClearCodes(codes);
            }
          },
        },
      ]
    );
  };

  /**
   * Handle connection toggle
   */
  const handleConnectionToggle = () => {
    if (!diagnostics) return;

    if (diagnostics.connection.status === ConnectionStatus.CONNECTED) {
      if (onDisconnect) {
        onDisconnect();
      }
    } else {
      if (onConnect) {
        onConnect();
      }
    }
  };

  // Loading state
  if (isLoading || !diagnostics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading diagnostics...</Text>
      </View>
    );
  }

  const connectionStatus = diagnostics.connection.status;
  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;
  const liveData = diagnostics.liveData?.data;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vehicle Diagnostics</Text>
        <Text style={styles.subtitle}>
          {diagnostics.vehicleInfo.year} {diagnostics.vehicleInfo.make}{' '}
          {diagnostics.vehicleInfo.model}
        </Text>
      </View>

      {/* Connection Status */}
      <View style={styles.connectionCard}>
        <View style={styles.connectionHeader}>
          <View style={styles.connectionInfo}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: getConnectionStatusColor(connectionStatus) },
              ]}
            />
            <Text style={styles.connectionStatus}>
              {getConnectionStatusText(connectionStatus)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.connectionButton,
              isConnected && styles.disconnectButton,
            ]}
            onPress={handleConnectionToggle}
          >
            <Text
              style={[
                styles.connectionButtonText,
                isConnected && styles.disconnectButtonText,
              ]}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>

        {diagnostics.connection.adapter && (
          <Text style={styles.adapterInfo}>
            {diagnostics.connection.adapter.name} •{' '}
            {diagnostics.connection.adapter.protocol}
          </Text>
        )}

        {diagnostics.connection.errorMessage && (
          <Text style={styles.errorMessage}>
            {diagnostics.connection.errorMessage}
          </Text>
        )}
      </View>

      {/* Health Score */}
      {healthScore && (
        <View style={styles.healthScoreCard}>
          <View style={styles.healthScoreHeader}>
            <Text style={styles.healthScoreTitle}>Vehicle Health Score</Text>
            <View
              style={[
                styles.riskBadge,
                {
                  backgroundColor: getRiskLevelColor(healthScore.riskLevel).bg,
                },
              ]}
            >
              <Text
                style={[
                  styles.riskText,
                  {
                    color: getRiskLevelColor(healthScore.riskLevel).text,
                  },
                ]}
              >
                {healthScore.riskLevel.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.healthScoreMain}>
            <Text
              style={[
                styles.healthScoreValue,
                { color: getHealthScoreColor(healthScore.totalScore) },
              ]}
            >
              {healthScore.totalScore}
            </Text>
            <Text style={styles.healthScoreMax}>/100</Text>
          </View>

          {/* Score Breakdown */}
          <View style={styles.scoreBreakdown}>
            <ScoreBar
              label="DTCs"
              score={healthScore.dtcScore}
              weight={35}
            />
            <ScoreBar
              label="Metrics"
              score={healthScore.metricsScore}
              weight={30}
            />
            <ScoreBar
              label="Readiness"
              score={healthScore.readinessScore}
              weight={20}
            />
            <ScoreBar
              label="Maintenance"
              score={healthScore.maintenanceScore}
              weight={15}
            />
          </View>

          {/* Top Recommendations */}
          {healthScore.recommendations.length > 0 && (
            <View style={styles.recommendations}>
              <Text style={styles.recommendationsTitle}>
                Top Recommendations
              </Text>
              {healthScore.recommendations.slice(0, 3).map((rec, index) => (
                <View key={rec.id} style={styles.recommendationItem}>
                  <View
                    style={[
                      styles.priorityDot,
                      {
                        backgroundColor: getPriorityColor(rec.priority),
                      },
                    ]}
                  />
                  <Text style={styles.recommendationText}>{rec.title}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* MIL Status */}
      {diagnostics.milStatus && (
        <View style={styles.milWarning}>
          <Text style={styles.milIcon}>⚠️</Text>
          <View style={styles.milContent}>
            <Text style={styles.milTitle}>Check Engine Light ON</Text>
            <Text style={styles.milText}>
              {diagnostics.dtcCount} diagnostic trouble{' '}
              {diagnostics.dtcCount === 1 ? 'code' : 'codes'} detected
            </Text>
          </View>
        </View>
      )}

      {/* Live Gauges */}
      {isConnected && liveData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Metrics</Text>
          <View style={styles.gaugesGrid}>
            <View style={styles.gaugeContainer}>
              <Gauge
                config={GAUGE_CONFIGS.rpm}
                value={liveData.rpm}
                size={160}
              />
            </View>
            <View style={styles.gaugeContainer}>
              <Gauge
                config={GAUGE_CONFIGS.speed}
                value={liveData.speed}
                size={160}
              />
            </View>
            <View style={styles.gaugeContainer}>
              <Gauge
                config={{
                  ...GAUGE_CONFIGS.coolantTemp,
                  label: 'Coolant',
                }}
                value={celsiusToFahrenheit(liveData.coolantTemp)}
                size={160}
              />
            </View>
            <View style={styles.gaugeContainer}>
              <Gauge
                config={GAUGE_CONFIGS.fuelLevel}
                value={liveData.fuelLevel}
                size={160}
              />
            </View>
          </View>

          {/* Additional Metrics */}
          <View style={styles.metricsGrid}>
            <MetricCard
              label="Battery"
              value={`${liveData.batteryVoltage.toFixed(1)} V`}
              status={
                liveData.batteryVoltage >= 12.6 ? 'normal' : 'warning'
              }
            />
            <MetricCard
              label="Engine Load"
              value={`${liveData.engineLoad.toFixed(0)}%`}
              status={liveData.engineLoad > 85 ? 'warning' : 'normal'}
            />
            <MetricCard
              label="Throttle"
              value={`${liveData.throttlePosition.toFixed(0)}%`}
              status="normal"
            />
            <MetricCard
              label="MAF"
              value={`${liveData.maf.toFixed(1)} g/s`}
              status="normal"
            />
          </View>
        </View>
      )}

      {/* DTC Codes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Diagnostic Trouble Codes ({diagnostics.dtcCodes.length})
          </Text>
          {diagnostics.dtcCodes.length > 0 && (
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={handleClearAllCodes}
            >
              <Text style={styles.clearAllButtonText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {diagnostics.dtcCodes.length === 0 ? (
          <View style={styles.noDtcCard}>
            <Text style={styles.noDtcIcon}>✓</Text>
            <Text style={styles.noDtcTitle}>No Codes Detected</Text>
            <Text style={styles.noDtcText}>
              All systems are operating normally
            </Text>
          </View>
        ) : (
          <>
            {/* Sort by severity */}
            {[DTCSeverity.CRITICAL, DTCSeverity.WARNING, DTCSeverity.INFORMATIONAL]
              .flatMap((severity) =>
                diagnostics.dtcCodes.filter((dtc) => dtc.severity === severity)
              )
              .map((dtc) => (
                <DTCCard
                  key={dtc.code}
                  dtc={dtc}
                  onCreateWorkOrder={onCreateWorkOrder}
                  onClearCode={(code) => {
                    if (onClearCodes) {
                      onClearCodes([code]);
                    }
                  }}
                />
              ))}
          </>
        )}
      </View>

      {/* Readiness Monitors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Readiness Monitors</Text>
        <View style={styles.readinessGrid}>
          {Object.entries(diagnostics.readinessMonitors).map(
            ([monitor, status]) =>
              status !== MonitorStatus.NOT_SUPPORTED && (
                <ReadinessMonitorCard
                  key={monitor}
                  name={formatMonitorName(monitor)}
                  status={status}
                />
              )
          )}
        </View>
      </View>

      {/* Last Update */}
      <Text style={styles.lastUpdate}>
        Last updated: {new Date(diagnostics.lastDiagnosticTime).toLocaleString()}
      </Text>
    </ScrollView>
  );
};

// ============================================================================
// Sub-Components
// ============================================================================

interface ScoreBarProps {
  label: string;
  score: number;
  weight: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, score, weight }) => {
  return (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <Text style={styles.scoreBarLabel}>
          {label} ({weight}%)
        </Text>
        <Text style={styles.scoreBarValue}>{score}</Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <View
          style={[
            styles.scoreBarFill,
            {
              width: `${score}%`,
              backgroundColor: getHealthScoreColor(score),
            },
          ]}
        />
      </View>
    </View>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  status: 'normal' | 'warning' | 'critical';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: getStatusColor() }]}>
        {value}
      </Text>
    </View>
  );
};

interface ReadinessMonitorCardProps {
  name: string;
  status: MonitorStatus;
}

const ReadinessMonitorCard: React.FC<ReadinessMonitorCardProps> = ({
  name,
  status,
}) => {
  const isComplete = status === MonitorStatus.COMPLETE;

  return (
    <View
      style={[
        styles.readinessCard,
        isComplete ? styles.readinessComplete : styles.readinessIncomplete,
      ]}
    >
      <Text style={styles.readinessIcon}>{isComplete ? '✓' : '○'}</Text>
      <Text
        style={[
          styles.readinessName,
          isComplete ? styles.readinessNameComplete : styles.readinessNameIncomplete,
        ]}
      >
        {name}
      </Text>
    </View>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

const formatMonitorName = (name: string): string => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const getPriorityColor = (priority: RecommendationPriority): string => {
  switch (priority) {
    case RecommendationPriority.IMMEDIATE:
      return '#ef4444';
    case RecommendationPriority.URGENT:
      return '#f59e0b';
    case RecommendationPriority.SCHEDULED:
      return '#3b82f6';
    default:
      return '#6b7280';
  }
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  connectionCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  connectionStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  connectionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
  },
  connectionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButtonText: {
    color: '#ffffff',
  },
  adapterInfo: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
  },
  errorMessage: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 8,
  },
  healthScoreCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  healthScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthScoreTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  healthScoreMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  healthScoreValue: {
    fontSize: 72,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  healthScoreMax: {
    fontSize: 32,
    color: '#9ca3af',
    marginLeft: 4,
  },
  scoreBreakdown: {
    gap: 12,
  },
  scoreBarContainer: {
    gap: 4,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreBarLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  scoreBarValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  scoreBarTrack: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  recommendations: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  recommendationsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  milWarning: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
  },
  milIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  milContent: {
    flex: 1,
  },
  milTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  milText: {
    fontSize: 14,
    color: '#92400e',
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  clearAllButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  gaugesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-around',
  },
  gaugeContainer: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  noDtcCard: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDtcIcon: {
    fontSize: 48,
    color: '#10b981',
    marginBottom: 12,
  },
  noDtcTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  noDtcText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  readinessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  readinessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: '48%',
  },
  readinessComplete: {
    backgroundColor: '#d1fae5',
  },
  readinessIncomplete: {
    backgroundColor: '#fee2e2',
  },
  readinessIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  readinessName: {
    fontSize: 13,
    fontWeight: '500',
  },
  readinessNameComplete: {
    color: '#065f46',
  },
  readinessNameIncomplete: {
    color: '#991b1b',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginVertical: 20,
  },
});

// ============================================================================
// Export default
// ============================================================================

export default OBD2Dashboard;
