/**
 * Geospatial Query Type Definitions
 * For the geospatial functions created in the database
 */

export interface NearestVehicle {
  vehicle_id: string;
  vin: string;
  make: string;
  model: string;
  distance_meters: number;
  latitude: number;
  longitude: number;
}

export interface NearestFacility {
  facility_id: string;
  facility_name: string;
  facility_type: string;
  distance_meters: number;
  address: string;
  city: string;
  state: string;
}

export interface NearestChargingStation {
  station_id: string;
  station_name: string;
  station_type: string;
  distance_meters: number;
  is_operational: boolean;
  number_of_ports: number;
  power_output_kw: number;
  cost_per_kwh: number;
}

export interface VehicleInGeofence {
  vehicle_id: string;
  vin: string;
  make: string;
  model: string;
  latitude: number;
  longitude: number;
  distance_from_center: number;
}

export interface VehicleWithLocation {
  id: string;
  tenant_id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  status: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  odometer: number;
  last_update: Date;
  driver_license: string;
  driver_name: string;
}

export interface FindNearestVehiclesDto {
  latitude: number;
  longitude: number;
  max_distance_meters?: number;
  max_results?: number;
}

export interface FindNearestFacilityDto {
  latitude: number;
  longitude: number;
}

export interface PointInGeofenceDto {
  latitude: number;
  longitude: number;
  geofence_id: string;
}

export interface FindNearestChargingStationDto {
  latitude: number;
  longitude: number;
  station_type?: 'level_1' | 'level_2' | 'dc_fast_charge';
  max_results?: number;
}

export interface CalculateDistanceDto {
  lat1: number;
  lng1: number;
  lat2: number;
  lng2: number;
}
