/**
 * Florida Traffic Cameras and Public Data Type Definitions
 * Florida 511 Traffic Cameras API Integration
 */

export interface TrafficCamera {
  /** Unique camera ID */
  id: number;
  /** Florida DOT camera identifier */
  fdotId: string;
  /** Camera name/description */
  name: string;
  /** Detailed description */
  description: string;
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
  /** Road/highway name */
  road: string;
  /** Direction (N, S, E, W, NB, SB, EB, WB) */
  direction: string;
  /** County name */
  county: string;
  /** Live feed URL */
  feedUrl: string;
  /** Thumbnail/snapshot URL */
  thumbnailUrl?: string;
  /** Last updated timestamp */
  lastUpdated: Date;
  /** Camera status (active, inactive, maintenance) */
  status: 'active' | 'inactive' | 'maintenance';
  /** Camera metadata */
  metadata?: {
    mileMarker?: string;
    roadwayId?: string;
    region?: string;
    district?: number;
  };
}

export interface TrafficIncident {
  /** Unique incident ID */
  id: number;
  /** External incident identifier */
  incidentId: string;
  /** Incident type */
  type: 'crash' | 'construction' | 'road_closure' | 'hazard' | 'weather' | 'other';
  /** Incident description */
  description: string;
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
  /** Road/highway name */
  road: string;
  /** County name */
  county: string;
  /** Start time */
  startTime: Date;
  /** End time (null if ongoing) */
  endTime?: Date;
  /** Severity level */
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  /** Impact description */
  impact?: string;
  /** Lanes affected */
  lanesAffected?: number;
  /** Delay in minutes */
  delayMinutes?: number;
}

export interface WeatherStation {
  /** Station ID */
  id: number;
  /** Station name */
  name: string;
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
  /** Current temperature (Fahrenheit) */
  temperature?: number;
  /** Current conditions */
  conditions?: string;
  /** Wind speed (mph) */
  windSpeed?: number;
  /** Visibility (miles) */
  visibility?: number;
  /** Road conditions */
  roadConditions?: 'dry' | 'wet' | 'icy' | 'snow' | 'unknown';
  /** Last updated */
  lastUpdated: Date;
}

export interface TollPlaza {
  /** Toll plaza ID */
  id: number;
  /** Plaza name */
  name: string;
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
  /** Road/highway */
  road: string;
  /** Direction */
  direction: string;
  /** Toll operator */
  operator: string;
  /** Accepts SunPass */
  sunPass: boolean;
  /** Accepts E-ZPass */
  eZPass: boolean;
  /** Number of lanes */
  lanes: number;
}

export interface EVChargingStation {
  /** Station ID */
  id: number;
  /** Station name */
  name: string;
  /** Address */
  address: string;
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
  /** Operator/network */
  operator: string;
  /** Number of charging ports */
  ports: number;
  /** Charging levels available */
  levels: ('level1' | 'level2' | 'dcfast')[];
  /** Maximum power (kW) */
  maxPower?: number;
  /** Pricing information */
  pricing?: string;
  /** Access type */
  access: 'public' | 'private' | 'restricted';
  /** 24/7 availability */
  available24x7: boolean;
}

export interface RestArea {
  /** Rest area ID */
  id: number;
  /** Facility name */
  name: string;
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
  /** Road/highway */
  road: string;
  /** Direction */
  direction: string;
  /** Mile marker */
  mileMarker: string;
  /** Amenities available */
  amenities: {
    restrooms?: boolean;
    picnicArea?: boolean;
    vendingMachines?: boolean;
    petArea?: boolean;
    wifi?: boolean;
    evCharging?: boolean;
  };
}

export interface WeighStation {
  /** Station ID */
  id: number;
  /** Station name */
  name: string;
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
  /** Road/highway */
  road: string;
  /** Direction */
  direction: string;
  /** Current status */
  status: 'open' | 'closed' | 'unknown';
  /** Hours of operation */
  hours?: string;
}

export type PublicDataLayerType =
  | 'traffic_cameras'
  | 'traffic_incidents'
  | 'weather_stations'
  | 'toll_plazas'
  | 'ev_charging'
  | 'rest_areas'
  | 'weigh_stations';

export interface PublicDataLayerConfig {
  /** Layer type */
  type: PublicDataLayerType;
  /** Layer display name */
  name: string;
  /** Layer description */
  description: string;
  /** Whether layer is enabled by default */
  defaultEnabled: boolean;
  /** Icon for map markers */
  icon: string;
  /** Marker color */
  color: string;
  /** Update frequency in minutes */
  updateFrequency: number;
  /** Zoom level to show layer */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
}
