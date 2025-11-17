/**
 * TripSummary Component
 *
 * Features:
 * - Trip details card
 * - Statistics (miles, duration, MPG)
 * - Driver score
 * - Events list
 * - Classification toggle (business/personal)
 * - Export options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, formatDuration, intervalToDuration } from 'date-fns';

// =====================================================
// Types
// =====================================================

interface Trip {
  id: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  vehicle_name?: string;
  driver_name?: string;

  // Times
  start_time: Date;
  end_time?: Date;
  duration_seconds?: number;

  // Locations
  start_location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  end_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  // Distance & Speed
  distance_miles?: number;
  avg_speed_mph?: number;
  max_speed_mph?: number;
  idle_time_seconds?: number;

  // Fuel
  fuel_consumed_gallons?: number;
  fuel_efficiency_mpg?: number;
  fuel_cost?: number;

  // Driver Score
  driver_score?: number;
  harsh_acceleration_count: number;
  harsh_braking_count: number;
  harsh_cornering_count: number;
  speeding_count: number;

  // Classification
  usage_type?: 'business' | 'personal' | 'mixed';
  business_purpose?: string;
  classification_status?: string;
}

interface TripEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description: string;
  speed_mph?: number;
  g_force?: number;
}

interface TripSummaryProps {
  trip: Trip;
  events?: TripEvent[];
  onClassify?: (usageType: 'business' | 'personal' | 'mixed', businessPurpose?: string) => Promise<void>;
  onExport?: (format: 'pdf' | 'csv') => Promise<void>;
  onViewMap?: () => void;
}

// =====================================================
// Helper Functions
// =====================================================

const formatDurationFromSeconds = (seconds: number): string => {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
  return formatDuration(duration, {
    format: ['hours', 'minutes'],
    delimiter: ', '
  });
};

const getDriverScoreColor = (score: number): string => {
  if (score >= 90) return '#10B981'; // Excellent - Green
  if (score >= 80) return '#3B82F6'; // Good - Blue
  if (score >= 70) return '#F59E0B'; // Fair - Orange
  return '#EF4444'; // Poor - Red
};

const getDriverScoreLabel = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  return 'Needs Improvement';
};

const getEventIcon = (eventType: string): string => {
  const iconMap: { [key: string]: string } = {
    harsh_acceleration: 'rocket-launch',
    harsh_braking: 'car-brake-alert',
    harsh_cornering: 'car-turbocharger',
    speeding: 'speedometer',
    rapid_lane_change: 'swap-horizontal',
    tailgating: 'car-multiple',
    idling_excessive: 'engine',
    engine_warning: 'alert-circle',
    low_fuel: 'gas-station',
    geofence_entry: 'map-marker-check',
    geofence_exit: 'map-marker-remove'
  };

  return iconMap[eventType] || 'alert';
};

const getEventColor = (severity: string): string => {
  const colorMap: { [key: string]: string } = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#7C3AED'
  };

  return colorMap[severity] || '#6B7280';
};

// =====================================================
// Component
// =====================================================

export const TripSummary: React.FC<TripSummaryProps> = ({
  trip,
  events = [],
  onClassify,
  onExport,
  onViewMap
}) => {
  const [showClassifyModal, setShowClassifyModal] = useState(false);
  const [selectedUsageType, setSelectedUsageType] = useState<'business' | 'personal' | 'mixed'>(
    trip.usage_type || 'business'
  );
  const [businessPurpose, setBusinessPurpose] = useState(trip.business_purpose || '');
  const [isClassifying, setIsClassifying] = useState(false);

  // =====================================================
  // Handlers
  // =====================================================

  const handleClassify = async () => {
    if (selectedUsageType === 'business' && !businessPurpose.trim()) {
      Alert.alert('Required', 'Business purpose is required for business trips');
      return;
    }

    try {
      setIsClassifying(true);
      if (onClassify) {
        await onClassify(selectedUsageType, businessPurpose);
      }
      setShowClassifyModal(false);
      Alert.alert('Success', 'Trip classified successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to classify trip');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleShare = async () => {
    try {
      const message = `
Trip Summary
📍 ${trip.start_location.address || 'Start location'}
📍 ${trip.end_location?.address || 'End location'}
📏 ${trip.distance_miles?.toFixed(1) || 0} miles
⏱️ ${trip.duration_seconds ? formatDurationFromSeconds(trip.duration_seconds) : 'N/A'}
⭐ Driver Score: ${trip.driver_score || 'N/A'}/100
⛽ ${trip.fuel_efficiency_mpg?.toFixed(1) || 'N/A'} MPG
      `.trim();

      await Share.share({
        message,
        title: 'Trip Summary'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      if (onExport) {
        await onExport(format);
        Alert.alert('Success', `Trip exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export trip');
    }
  };

  // Calculate event summary
  const criticalEvents = events.filter(e => e.severity === 'critical' || e.severity === 'high');
  const totalHarshEvents = trip.harsh_acceleration_count + trip.harsh_braking_count + trip.harsh_cornering_count;

  // =====================================================
  // Render
  // =====================================================

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.tripTitle}>Trip #{trip.id.slice(-6)}</Text>
            <Text style={styles.tripDate}>
              {format(new Date(trip.start_time), 'MMM dd, yyyy • h:mm a')}
            </Text>
          </View>

          <View style={[
            styles.statusBadge,
            { backgroundColor: trip.status === 'completed' ? '#10B981' : '#F59E0B' }
          ]}>
            <Text style={styles.statusText}>
              {trip.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Vehicle & Driver Info */}
        {(trip.vehicle_name || trip.driver_name) && (
          <View style={styles.infoRow}>
            {trip.vehicle_name && (
              <View style={styles.infoItem}>
                <Icon name="car" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{trip.vehicle_name}</Text>
              </View>
            )}
            {trip.driver_name && (
              <View style={styles.infoItem}>
                <Icon name="account" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{trip.driver_name}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Driver Score Card */}
      {trip.driver_score !== undefined && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Driver Score</Text>

          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={[
                styles.scoreValue,
                { color: getDriverScoreColor(trip.driver_score) }
              ]}>
                {trip.driver_score}
              </Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>

            <View style={styles.scoreDetails}>
              <Text style={[
                styles.scoreLabel,
                { color: getDriverScoreColor(trip.driver_score) }
              ]}>
                {getDriverScoreLabel(trip.driver_score)}
              </Text>

              <View style={styles.scoreBreakdown}>
                {trip.harsh_acceleration_count > 0 && (
                  <Text style={styles.scoreBreakdownItem}>
                    ⚡ {trip.harsh_acceleration_count} hard acceleration{trip.harsh_acceleration_count > 1 ? 's' : ''}
                  </Text>
                )}
                {trip.harsh_braking_count > 0 && (
                  <Text style={styles.scoreBreakdownItem}>
                    🛑 {trip.harsh_braking_count} hard brake{trip.harsh_braking_count > 1 ? 's' : ''}
                  </Text>
                )}
                {trip.harsh_cornering_count > 0 && (
                  <Text style={styles.scoreBreakdownItem}>
                    🔄 {trip.harsh_cornering_count} hard turn{trip.harsh_cornering_count > 1 ? 's' : ''}
                  </Text>
                )}
                {trip.speeding_count > 0 && (
                  <Text style={styles.scoreBreakdownItem}>
                    🚨 {trip.speeding_count} speeding event{trip.speeding_count > 1 ? 's' : ''}
                  </Text>
                )}
                {totalHarshEvents === 0 && (
                  <Text style={[styles.scoreBreakdownItem, { color: '#10B981' }]}>
                    ✓ No harsh driving events
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Trip Statistics */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Trip Statistics</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Icon name="map-marker-distance" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{trip.distance_miles?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Miles</Text>
          </View>

          <View style={styles.statItem}>
            <Icon name="clock-outline" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>
              {trip.duration_seconds ? formatDurationFromSeconds(trip.duration_seconds) : '--'}
            </Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>

          <View style={styles.statItem}>
            <Icon name="speedometer" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{trip.avg_speed_mph?.toFixed(0) || '0'}</Text>
            <Text style={styles.statLabel}>Avg Speed</Text>
          </View>

          <View style={styles.statItem}>
            <Icon name="gas-station" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{trip.fuel_efficiency_mpg?.toFixed(1) || '--'}</Text>
            <Text style={styles.statLabel}>MPG</Text>
          </View>
        </View>

        {/* Additional Stats */}
        <View style={styles.additionalStats}>
          {trip.max_speed_mph && (
            <View style={styles.additionalStatRow}>
              <Text style={styles.additionalStatLabel}>Max Speed</Text>
              <Text style={styles.additionalStatValue}>{trip.max_speed_mph.toFixed(0)} mph</Text>
            </View>
          )}

          {trip.fuel_consumed_gallons && (
            <View style={styles.additionalStatRow}>
              <Text style={styles.additionalStatLabel}>Fuel Consumed</Text>
              <Text style={styles.additionalStatValue}>{trip.fuel_consumed_gallons.toFixed(2)} gal</Text>
            </View>
          )}

          {trip.fuel_cost && (
            <View style={styles.additionalStatRow}>
              <Text style={styles.additionalStatLabel}>Estimated Fuel Cost</Text>
              <Text style={styles.additionalStatValue}>${trip.fuel_cost.toFixed(2)}</Text>
            </View>
          )}

          {trip.idle_time_seconds && trip.idle_time_seconds > 0 && (
            <View style={styles.additionalStatRow}>
              <Text style={styles.additionalStatLabel}>Idle Time</Text>
              <Text style={styles.additionalStatValue}>
                {Math.floor(trip.idle_time_seconds / 60)} min
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Route Information */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Route</Text>

        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <View style={[styles.routeMarker, { backgroundColor: '#10B981' }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>Start</Text>
              <Text style={styles.routeAddress}>
                {trip.start_location.address || `${trip.start_location.latitude.toFixed(4)}, ${trip.start_location.longitude.toFixed(4)}`}
              </Text>
              <Text style={styles.routeTime}>
                {format(new Date(trip.start_time), 'h:mm a')}
              </Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          {trip.end_location && (
            <View style={styles.routePoint}>
              <View style={[styles.routeMarker, { backgroundColor: '#EF4444' }]} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>End</Text>
                <Text style={styles.routeAddress}>
                  {trip.end_location.address || `${trip.end_location.latitude.toFixed(4)}, ${trip.end_location.longitude.toFixed(4)}`}
                </Text>
                {trip.end_time && (
                  <Text style={styles.routeTime}>
                    {format(new Date(trip.end_time), 'h:mm a')}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {onViewMap && (
          <TouchableOpacity style={styles.viewMapButton} onPress={onViewMap}>
            <Icon name="map" size={20} color="#3B82F6" />
            <Text style={styles.viewMapText}>View on Map</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Events */}
      {events.length > 0 && (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Events ({events.length})</Text>
            {criticalEvents.length > 0 && (
              <View style={styles.criticalBadge}>
                <Text style={styles.criticalText}>{criticalEvents.length} Critical</Text>
              </View>
            )}
          </View>

          {events.slice(0, 5).map((event, index) => (
            <View key={index} style={styles.eventItem}>
              <View style={[
                styles.eventIcon,
                { backgroundColor: getEventColor(event.severity) }
              ]}>
                <Icon
                  name={getEventIcon(event.type)}
                  size={20}
                  color="#FFFFFF"
                />
              </View>

              <View style={styles.eventDetails}>
                <Text style={styles.eventType}>
                  {event.type.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={styles.eventDescription}>{event.description}</Text>
                <Text style={styles.eventTime}>
                  {format(new Date(event.timestamp), 'h:mm a')}
                  {event.speed_mph && ` • ${event.speed_mph.toFixed(0)} mph`}
                </Text>
              </View>

              <View style={[
                styles.severityBadge,
                { backgroundColor: getEventColor(event.severity) }
              ]}>
                <Text style={styles.severityText}>{event.severity.toUpperCase()}</Text>
              </View>
            </View>
          ))}

          {events.length > 5 && (
            <Text style={styles.moreEvents}>
              + {events.length - 5} more events
            </Text>
          )}
        </View>
      )}

      {/* Classification */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Classification</Text>

        {trip.usage_type ? (
          <View>
            <View style={styles.classificationBadge}>
              <Icon
                name={trip.usage_type === 'business' ? 'briefcase' : 'home'}
                size={20}
                color="#3B82F6"
              />
              <Text style={styles.classificationText}>
                {trip.usage_type.toUpperCase()}
              </Text>
            </View>

            {trip.business_purpose && (
              <View style={styles.purposeContainer}>
                <Text style={styles.purposeLabel}>Purpose:</Text>
                <Text style={styles.purposeText}>{trip.business_purpose}</Text>
              </View>
            )}

            {onClassify && (
              <TouchableOpacity
                style={styles.reclassifyButton}
                onPress={() => setShowClassifyModal(true)}
              >
                <Text style={styles.reclassifyText}>Reclassify Trip</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.classifyButton}
            onPress={() => setShowClassifyModal(true)}
          >
            <Icon name="tag-outline" size={20} color="#FFFFFF" />
            <Text style={styles.classifyButtonText}>Classify Trip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsCard}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Icon name="share-variant" size={24} color="#3B82F6" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        {onExport && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleExport('pdf')}
            >
              <Icon name="file-pdf-box" size={24} color="#EF4444" />
              <Text style={styles.actionText}>Export PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleExport('csv')}
            >
              <Icon name="file-delimited" size={24} color="#10B981" />
              <Text style={styles.actionText}>Export CSV</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Classification Modal */}
      <Modal
        visible={showClassifyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowClassifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Classify Trip</Text>
              <TouchableOpacity onPress={() => setShowClassifyModal(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Select trip type and provide business purpose if applicable
            </Text>

            {/* Usage Type Selection */}
            <View style={styles.usageTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.usageTypeButton,
                  selectedUsageType === 'business' && styles.usageTypeButtonActive
                ]}
                onPress={() => setSelectedUsageType('business')}
              >
                <Icon
                  name="briefcase"
                  size={24}
                  color={selectedUsageType === 'business' ? '#FFFFFF' : '#6B7280'}
                />
                <Text style={[
                  styles.usageTypeText,
                  selectedUsageType === 'business' && styles.usageTypeTextActive
                ]}>
                  Business
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.usageTypeButton,
                  selectedUsageType === 'personal' && styles.usageTypeButtonActive
                ]}
                onPress={() => setSelectedUsageType('personal')}
              >
                <Icon
                  name="home"
                  size={24}
                  color={selectedUsageType === 'personal' ? '#FFFFFF' : '#6B7280'}
                />
                <Text style={[
                  styles.usageTypeText,
                  selectedUsageType === 'personal' && styles.usageTypeTextActive
                ]}>
                  Personal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.usageTypeButton,
                  selectedUsageType === 'mixed' && styles.usageTypeButtonActive
                ]}
                onPress={() => setSelectedUsageType('mixed')}
              >
                <Icon
                  name="swap-horizontal"
                  size={24}
                  color={selectedUsageType === 'mixed' ? '#FFFFFF' : '#6B7280'}
                />
                <Text style={[
                  styles.usageTypeText,
                  selectedUsageType === 'mixed' && styles.usageTypeTextActive
                ]}>
                  Mixed
                </Text>
              </TouchableOpacity>
            </View>

            {/* Business Purpose Input */}
            {(selectedUsageType === 'business' || selectedUsageType === 'mixed') && (
              <View style={styles.purposeInputContainer}>
                <Text style={styles.inputLabel}>
                  Business Purpose {selectedUsageType === 'business' && <Text style={styles.required}>*</Text>}
                </Text>
                <TextInput
                  style={styles.purposeInput}
                  placeholder="e.g., Client meeting, Site visit, Delivery"
                  value={businessPurpose}
                  onChangeText={setBusinessPurpose}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowClassifyModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  isClassifying && styles.modalSubmitButtonDisabled
                ]}
                onPress={handleClassify}
                disabled={isClassifying}
              >
                {isClassifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Classify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// =====================================================
// Styles
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  tripTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4
  },
  tripDate: {
    fontSize: 14,
    color: '#6B7280'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  criticalBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  criticalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444'
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E5E7EB'
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '700'
  },
  scoreMax: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: -4
  },
  scoreDetails: {
    flex: 1
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8
  },
  scoreBreakdown: {
    gap: 4
  },
  scoreBreakdownItem: {
    fontSize: 14,
    color: '#6B7280'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280'
  },
  additionalStats: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16
  },
  additionalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  additionalStatLabel: {
    fontSize: 14,
    color: '#6B7280'
  },
  additionalStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937'
  },
  routeContainer: {
    marginBottom: 16
  },
  routePoint: {
    flexDirection: 'row',
    gap: 12
  },
  routeMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#D1D5DB',
    marginLeft: 5,
    marginVertical: 4
  },
  routeInfo: {
    flex: 1
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4
  },
  routeAddress: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2
  },
  routeTime: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8
  },
  viewMapText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6'
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  eventDetails: {
    flex: 1
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2
  },
  eventDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2
  },
  eventTime: {
    fontSize: 11,
    color: '#9CA3AF'
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  moreEvents: {
    textAlign: 'center',
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 8
  },
  classificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginBottom: 12
  },
  classificationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6'
  },
  purposeContainer: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12
  },
  purposeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4
  },
  purposeText: {
    fontSize: 14,
    color: '#1F2937'
  },
  reclassifyButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8
  },
  reclassifyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6'
  },
  classifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#3B82F6',
    borderRadius: 8
  },
  classifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  actionsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  actionButton: {
    alignItems: 'center',
    gap: 4
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937'
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24
  },
  usageTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  usageTypeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    gap: 8
  },
  usageTypeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6'
  },
  usageTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280'
  },
  usageTypeTextActive: {
    color: '#FFFFFF'
  },
  purposeInputContainer: {
    marginBottom: 24
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8
  },
  required: {
    color: '#EF4444'
  },
  purposeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280'
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8
  },
  modalSubmitButtonDisabled: {
    opacity: 0.6
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  }
});

export default TripSummary;
