/**
 * TripMapView Component
 *
 * Features:
 * - Display trip route on map
 * - Show start/end markers
 * - Color-coded path by speed
 * - Event markers (harsh braking, speeding, etc.)
 * - Playback mode with timeline
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Animated,
  Platform
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';

// =====================================================
// Types
// =====================================================

interface Location {
  latitude: number;
  longitude: number;
}

interface Breadcrumb extends Location {
  timestamp: Date;
  speed_mph: number;
  heading_degrees?: number;
}

interface TripEvent extends Location {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description: string;
  speed_mph?: number;
  g_force?: number;
}

interface TripMapViewProps {
  tripId?: string;
  startLocation: Location;
  endLocation?: Location;
  breadcrumbs: Breadcrumb[];
  events: TripEvent[];
  showPlayback?: boolean;
  showSpeedColors?: boolean;
  showEvents?: boolean;
  onEventPress?: (event: TripEvent) => void;
}

// =====================================================
// Helper Functions
// =====================================================

const getSpeedColor = (speed: number): string => {
  // Color code based on speed
  if (speed >= 70) return '#EF4444'; // Red - High speed
  if (speed >= 50) return '#F59E0B'; // Orange - Medium speed
  if (speed >= 30) return '#FCD34D'; // Yellow - Moderate speed
  if (speed >= 10) return '#10B981'; // Green - Low speed
  return '#6B7280'; // Gray - Very low/stopped
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

// Split breadcrumbs into segments by speed for color coding
const getSpeedSegments = (breadcrumbs: Breadcrumb[]): Array<{ coordinates: Location[], color: string }> => {
  if (breadcrumbs.length === 0) return [];

  const segments: Array<{ coordinates: Location[], color: string }> = [];
  let currentSegment: Location[] = [];
  let currentColor = getSpeedColor(breadcrumbs[0].speed_mph);

  breadcrumbs.forEach((breadcrumb, index) => {
    const color = getSpeedColor(breadcrumb.speed_mph);

    if (color === currentColor) {
      currentSegment.push({
        latitude: breadcrumb.latitude,
        longitude: breadcrumb.longitude
      });
    } else {
      // Finish current segment
      if (currentSegment.length > 0) {
        segments.push({ coordinates: [...currentSegment], color: currentColor });
      }

      // Start new segment (include last point for continuity)
      currentSegment = [
        currentSegment[currentSegment.length - 1],
        {
          latitude: breadcrumb.latitude,
          longitude: breadcrumb.longitude
        }
      ];
      currentColor = color;
    }

    // Last breadcrumb - close segment
    if (index === breadcrumbs.length - 1 && currentSegment.length > 0) {
      segments.push({ coordinates: currentSegment, color: currentColor });
    }
  });

  return segments;
};

// Calculate map region to fit all points
const getMapRegion = (points: Location[]) => {
  if (points.length === 0) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421
    };
  }

  const latitudes = points.map(p => p.latitude);
  const longitudes = points.map(p => p.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const latDelta = (maxLat - minLat) * 1.3; // Add 30% padding
  const lngDelta = (maxLng - minLng) * 1.3;

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom level
    longitudeDelta: Math.max(lngDelta, 0.01)
  };
};

// =====================================================
// Component
// =====================================================

export const TripMapView: React.FC<TripMapViewProps> = ({
  tripId,
  startLocation,
  endLocation,
  breadcrumbs,
  events,
  showPlayback = true,
  showSpeedColors = true,
  showEvents = true,
  onEventPress
}) => {
  const mapRef = useRef<MapView>(null);
  const [playbackIndex, setPlaybackIndex] = useState(breadcrumbs.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TripEvent | null>(null);

  const playbackInterval = useRef<NodeJS.Timeout | null>(null);
  const markerOpacity = useRef(new Animated.Value(1)).current;

  // Calculate map region
  const allPoints = [
    startLocation,
    ...(endLocation ? [endLocation] : []),
    ...breadcrumbs.map(b => ({ latitude: b.latitude, longitude: b.longitude }))
  ];
  const initialRegion = getMapRegion(allPoints);

  // Get speed segments for colored path
  const speedSegments = showSpeedColors ? getSpeedSegments(breadcrumbs) : [];

  // Get visible breadcrumbs for playback mode
  const visibleBreadcrumbs = showPlayback
    ? breadcrumbs.slice(0, playbackIndex + 1)
    : breadcrumbs;

  // =====================================================
  // Playback Controls
  // =====================================================

  useEffect(() => {
    if (isPlaying) {
      playbackInterval.current = setInterval(() => {
        setPlaybackIndex((prevIndex) => {
          if (prevIndex >= breadcrumbs.length - 1) {
            setIsPlaying(false);
            return prevIndex;
          }
          return prevIndex + 1;
        });
      }, 200); // Update every 200ms for smooth playback

      return () => {
        if (playbackInterval.current) {
          clearInterval(playbackInterval.current);
        }
      };
    }
  }, [isPlaying, breadcrumbs.length]);

  const handlePlayPause = () => {
    if (playbackIndex >= breadcrumbs.length - 1) {
      setPlaybackIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPlaybackIndex(breadcrumbs.length - 1);
  };

  const handleSliderChange = (value: number) => {
    setIsPlaying(false);
    setPlaybackIndex(Math.floor(value));
  };

  // Animate current position marker
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(markerOpacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(markerOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        })
      ])
    ).start();
  }, [markerOpacity]);

  // Center map on current playback position
  const handleCenterOnPosition = () => {
    if (breadcrumbs[playbackIndex] && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: breadcrumbs[playbackIndex].latitude,
        longitude: breadcrumbs[playbackIndex].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 500);
    }
  };

  // =====================================================
  // Event Handlers
  // =====================================================

  const handleEventMarkerPress = (event: TripEvent) => {
    setSelectedEvent(event);
    if (onEventPress) {
      onEventPress(event);
    }

    // Center map on event
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: event.latitude,
        longitude: event.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 500);
    }
  };

  // =====================================================
  // Render
  // =====================================================

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Start marker */}
        <Marker
          coordinate={startLocation}
          title="Start"
          description="Trip start location"
          pinColor="green"
        >
          <View style={styles.startMarker}>
            <Icon name="flag-checkered" size={24} color="#10B981" />
          </View>
        </Marker>

        {/* End marker */}
        {endLocation && (
          <Marker
            coordinate={endLocation}
            title="End"
            description="Trip end location"
            pinColor="red"
          >
            <View style={styles.endMarker}>
              <Icon name="flag" size={24} color="#EF4444" />
            </View>
          </Marker>
        )}

        {/* Route path with speed colors */}
        {showSpeedColors && speedSegments.map((segment, index) => (
          <Polyline
            key={`segment-${index}`}
            coordinates={segment.coordinates}
            strokeColor={segment.color}
            strokeWidth={4}
          />
        ))}

        {/* Simple route path (if speed colors disabled) */}
        {!showSpeedColors && visibleBreadcrumbs.length > 0 && (
          <Polyline
            coordinates={visibleBreadcrumbs.map(b => ({
              latitude: b.latitude,
              longitude: b.longitude
            }))}
            strokeColor="#3B82F6"
            strokeWidth={4}
          />
        )}

        {/* Event markers */}
        {showEvents && events.map((event, index) => (
          <Marker
            key={`event-${index}`}
            coordinate={{
              latitude: event.latitude,
              longitude: event.longitude
            }}
            title={event.type.replace(/_/g, ' ')}
            description={event.description}
            onPress={() => handleEventMarkerPress(event)}
          >
            <View style={[
              styles.eventMarker,
              { backgroundColor: getEventColor(event.severity) }
            ]}>
              <Icon
                name={getEventIcon(event.type)}
                size={16}
                color="#FFFFFF"
              />
            </View>
          </Marker>
        ))}

        {/* Current position marker (playback mode) */}
        {showPlayback && breadcrumbs[playbackIndex] && (
          <Marker
            coordinate={{
              latitude: breadcrumbs[playbackIndex].latitude,
              longitude: breadcrumbs[playbackIndex].longitude
            }}
          >
            <Animated.View style={[styles.currentMarker, { opacity: markerOpacity }]}>
              <Icon name="circle" size={20} color="#3B82F6" />
            </Animated.View>
          </Marker>
        )}
      </MapView>

      {/* Map controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowLegend(!showLegend)}
        >
          <Icon name="information" size={24} color="#3B82F6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleCenterOnPosition}
        >
          <Icon name="crosshairs-gps" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Speed legend */}
      {showLegend && showSpeedColors && (
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Speed</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>70+ mph</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>50-70 mph</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FCD34D' }]} />
            <Text style={styles.legendText}>30-50 mph</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>10-30 mph</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#6B7280' }]} />
            <Text style={styles.legendText}>0-10 mph</Text>
          </View>
        </View>
      )}

      {/* Playback controls */}
      {showPlayback && breadcrumbs.length > 0 && (
        <View style={styles.playbackContainer}>
          <View style={styles.playbackInfo}>
            <Text style={styles.playbackTime}>
              {breadcrumbs[playbackIndex]?.timestamp
                ? new Date(breadcrumbs[playbackIndex].timestamp).toLocaleTimeString()
                : '--:--:--'}
            </Text>
            <Text style={styles.playbackSpeed}>
              {breadcrumbs[playbackIndex]?.speed_mph?.toFixed(0) || 0} mph
            </Text>
          </View>

          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={breadcrumbs.length - 1}
              value={playbackIndex}
              onValueChange={handleSliderChange}
              minimumTrackTintColor="#3B82F6"
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor="#3B82F6"
              step={1}
            />
          </View>

          <View style={styles.playbackButtons}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={handleReset}
            >
              <Icon name="skip-backward" size={24} color="#3B82F6" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
            >
              <Icon
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="#3B82F6"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playButton}
              onPress={handleCenterOnPosition}
            >
              <Icon name="target" size={24} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Selected event info */}
      {selectedEvent && (
        <View style={styles.eventInfo}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedEvent(null)}
          >
            <Icon name="close" size={20} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.eventInfoHeader}>
            <Icon
              name={getEventIcon(selectedEvent.type)}
              size={24}
              color={getEventColor(selectedEvent.severity)}
            />
            <Text style={styles.eventInfoTitle}>
              {selectedEvent.type.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>

          <Text style={styles.eventInfoDescription}>
            {selectedEvent.description}
          </Text>

          {selectedEvent.speed_mph && (
            <Text style={styles.eventInfoDetail}>
              Speed: {selectedEvent.speed_mph.toFixed(0)} mph
            </Text>
          )}

          {selectedEvent.g_force && (
            <Text style={styles.eventInfoDetail}>
              G-Force: {selectedEvent.g_force.toFixed(2)}g
            </Text>
          )}

          <Text style={styles.eventInfoTime}>
            {new Date(selectedEvent.timestamp).toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
};

// =====================================================
// Styles
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  startMarker: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  endMarker: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  eventMarker: {
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  currentMarker: {
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8
  },
  controlButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  legend: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  legendColor: {
    width: 24,
    height: 4,
    borderRadius: 2,
    marginRight: 8
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280'
  },
  playbackContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8
  },
  playbackInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  playbackTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937'
  },
  playbackSpeed: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6'
  },
  sliderContainer: {
    marginVertical: 8
  },
  slider: {
    width: '100%',
    height: 40
  },
  playbackButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 8
  },
  playButton: {
    padding: 8
  },
  eventInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: '40%'
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4
  },
  eventInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  eventInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937'
  },
  eventInfoDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12
  },
  eventInfoDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4
  },
  eventInfoTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8
  }
});

export default TripMapView;
