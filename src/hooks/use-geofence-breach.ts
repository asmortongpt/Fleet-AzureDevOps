import { useMemo } from 'react';
import { Geofence } from '@/lib/types';

interface Vehicle {
    id: string;
    latitude?: number;
    longitude?: number;
    location?: { lat: number; lng: number };
    [key: string]: any;
}

export interface BreachEvent {
    id: string;
    vehicleId: string;
    geofenceId: string;
    timestamp: string;
    type: 'enter' | 'exit' | 'dwell';
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export function useGeofenceBreachDetector(vehicles: Vehicle[], geofences: Geofence[]) {
    const breaches = useMemo(() => {
        const activeBreaches: BreachEvent[] = [];
        const breachesByGeofence: Record<string, string[]> = {};

        geofences.forEach(geofence => {
            if (!geofence.active || !geofence.center || !geofence.radius) return;

            vehicles.forEach(vehicle => {
                const vLat = vehicle.latitude || vehicle.location?.lat;
                const vLng = vehicle.longitude || vehicle.location?.lng;

                if (vLat == null || vLng == null) return;

                const distance = getDistance(geofence.center!.lat, geofence.center!.lng, vLat, vLng);

                if (distance <= geofence.radius!) {
                    activeBreaches.push({
                        id: `${geofence.id}-${vehicle.id}-${Date.now()}`,
                        vehicleId: vehicle.id,
                        geofenceId: geofence.id,
                        timestamp: new Date().toISOString(),
                        type: 'enter' // Simplified for demo
                    });

                    if (!breachesByGeofence[geofence.id]) {
                        breachesByGeofence[geofence.id] = [];
                    }
                    breachesByGeofence[geofence.id]?.push(vehicle.id);
                }
            });
        });

        return { activeBreaches, breachesByGeofence };
    }, [vehicles, geofences]);

    return breaches;
}
