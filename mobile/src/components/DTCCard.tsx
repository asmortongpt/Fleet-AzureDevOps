/**
 * DTCCard Component
 * Display diagnostic trouble code with details and actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { DTCCode, DTCSeverity } from '../types/obd2';

// ============================================================================
// Types
// ============================================================================

export interface DTCCardProps {
  dtc: DTCCode;
  onCreateWorkOrder?: (dtcCode: string) => void;
  onClearCode?: (dtcCode: string) => void;
  onViewDetails?: (dtcCode: string) => void;
  showActions?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get severity color
 */
const getSeverityColor = (severity: DTCSeverity): string => {
  switch (severity) {
    case DTCSeverity.CRITICAL:
      return '#ef4444'; // red-500
    case DTCSeverity.WARNING:
      return '#f59e0b'; // amber-500
    case DTCSeverity.INFORMATIONAL:
      return '#3b82f6'; // blue-500
    default:
      return '#6b7280'; // gray-500
  }
};

/**
 * Get severity label
 */
const getSeverityLabel = (severity: DTCSeverity): string => {
  switch (severity) {
    case DTCSeverity.CRITICAL:
      return 'CRITICAL';
    case DTCSeverity.WARNING:
      return 'WARNING';
    case DTCSeverity.INFORMATIONAL:
      return 'INFO';
    default:
      return 'UNKNOWN';
  }
};

/**
 * Get severity background color
 */
const getSeverityBgColor = (severity: DTCSeverity): string => {
  switch (severity) {
    case DTCSeverity.CRITICAL:
      return '#fee2e2'; // red-100
    case DTCSeverity.WARNING:
      return '#fef3c7'; // amber-100
    case DTCSeverity.INFORMATIONAL:
      return '#dbeafe'; // blue-100
    default:
      return '#f3f4f6'; // gray-100
  }
};

/**
 * Format date for display
 */
const formatDate = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// ============================================================================
// DTCCard Component
// ============================================================================

export const DTCCard: React.FC<DTCCardProps> = ({
  dtc,
  onCreateWorkOrder,
  onClearCode,
  onViewDetails,
  showActions = true,
}) => {
  const severityColor = getSeverityColor(dtc.severity);
  const severityBgColor = getSeverityBgColor(dtc.severity);
  const severityLabel = getSeverityLabel(dtc.severity);

  /**
   * Handle create work order
   */
  const handleCreateWorkOrder = () => {
    if (onCreateWorkOrder) {
      onCreateWorkOrder(dtc.code);
    } else {
      Alert.alert(
        'Create Work Order',
        `Would you like to create a work order for DTC ${dtc.code}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create',
            onPress: () => {
              // Navigate to work order creation
              console.log('Create work order for:', dtc.code);
            },
          },
        ]
      );
    }
  };

  /**
   * Handle clear code
   */
  const handleClearCode = () => {
    Alert.alert(
      'Clear DTC Code',
      `Are you sure you want to clear ${dtc.code}?\n\nNote: This will only clear the code from memory. If the underlying issue is not fixed, the code will return.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            if (onClearCode) {
              onClearCode(dtc.code);
            }
          },
        },
      ]
    );
  };

  /**
   * Handle view details
   */
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(dtc.code);
    }
  };

  /**
   * Search DTC online
   */
  const handleSearchOnline = () => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(dtc.code + ' diagnostic trouble code')}`;
    Linking.openURL(searchUrl).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  return (
    <View style={[styles.card, { borderLeftColor: severityColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.severityBadge,
              {
                backgroundColor: severityBgColor,
              },
            ]}
          >
            <Text
              style={[
                styles.severityText,
                {
                  color: severityColor,
                },
              ]}
            >
              {severityLabel}
            </Text>
          </View>
          <Text style={styles.code}>{dtc.code}</Text>
        </View>
        <Text style={styles.timestamp}>{formatDate(dtc.detectedAt)}</Text>
      </View>

      {/* Description */}
      <Text style={styles.description}>{dtc.description}</Text>

      {/* Possible Causes */}
      {dtc.possibleCauses && dtc.possibleCauses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Possible Causes:</Text>
          {dtc.possibleCauses.slice(0, 3).map((cause, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{cause}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommended Actions */}
      {dtc.recommendedActions && dtc.recommendedActions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Actions:</Text>
          {dtc.recommendedActions.slice(0, 2).map((action, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{action}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Freeze Frame Info */}
      {dtc.freezeFrameData && (
        <View style={styles.freezeFrame}>
          <Text style={styles.freezeFrameTitle}>Freeze Frame Data</Text>
          <View style={styles.freezeFrameGrid}>
            <View style={styles.freezeFrameItem}>
              <Text style={styles.freezeFrameLabel}>RPM</Text>
              <Text style={styles.freezeFrameValue}>
                {dtc.freezeFrameData.rpm}
              </Text>
            </View>
            <View style={styles.freezeFrameItem}>
              <Text style={styles.freezeFrameLabel}>Speed</Text>
              <Text style={styles.freezeFrameValue}>
                {dtc.freezeFrameData.speed} mph
              </Text>
            </View>
            <View style={styles.freezeFrameItem}>
              <Text style={styles.freezeFrameLabel}>Temp</Text>
              <Text style={styles.freezeFrameValue}>
                {dtc.freezeFrameData.coolantTemp}°F
              </Text>
            </View>
            <View style={styles.freezeFrameItem}>
              <Text style={styles.freezeFrameLabel}>Load</Text>
              <Text style={styles.freezeFrameValue}>
                {dtc.freezeFrameData.engineLoad}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleCreateWorkOrder}
          >
            <Text style={styles.primaryButtonText}>Create Work Order</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            {onViewDetails && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleViewDetails}
              >
                <Text style={styles.secondaryButtonText}>Details</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleSearchOnline}
            >
              <Text style={styles.secondaryButtonText}>Search</Text>
            </TouchableOpacity>

            {onClearCode && (
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleClearCode}
              >
                <Text style={styles.dangerButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  code: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  description: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 13,
    color: '#6b7280',
    marginRight: 8,
    lineHeight: 20,
  },
  listText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    flex: 1,
  },
  freezeFrame: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  freezeFrameTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  freezeFrameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  freezeFrameItem: {
    flex: 1,
    minWidth: '45%',
  },
  freezeFrameLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  freezeFrameValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    marginTop: 12,
    gap: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#fee2e2',
    flex: 1,
  },
  dangerButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
});

// ============================================================================
// Export default
// ============================================================================

export default DTCCard;
