/**
 * Drilldown Helpers - Convenience functions for triggering drilldowns
 * Provides type-safe methods to open drilldown panels from anywhere
 */

import { useDrilldown } from '@/contexts/DrilldownContext'

export function useDrilldownHelpers() {
  const { push } = useDrilldown()

  return {
    // Vehicle drilldowns
    openVehicleDetail: (vehicleId: string, vehicleName: string) => {
      push({
        id: `vehicle-detail-${vehicleId}`,
        type: 'vehicle-detail',
        label: vehicleName,
        data: { vehicleId, vehicleName },
      })
    },

    openVehicleTrips: (vehicleId: string, vehicleName: string) => {
      push({
        id: `vehicle-trips-${vehicleId}`,
        type: 'vehicle-trips',
        label: 'Trip History',
        data: { vehicleId, vehicleName },
      })
    },

    // Driver drilldowns
    openDriverDetail: (driverId: string, driverName: string) => {
      push({
        id: `driver-detail-${driverId}`,
        type: 'driver-detail',
        label: driverName,
        data: { driverId, driverName },
      })
    },

    openDriverPerformance: (driverId: string, driverName: string) => {
      push({
        id: `driver-performance-${driverId}`,
        type: 'driver-performance',
        label: 'Performance',
        data: { driverId, driverName },
      })
    },

    openDriverTrips: (driverId: string, driverName: string) => {
      push({
        id: `driver-trips-${driverId}`,
        type: 'driver-trips',
        label: 'Trip History',
        data: { driverId, driverName },
      })
    },

    // Maintenance drilldowns
    openWorkOrderDetail: (workOrderId: string, workOrderNumber: string) => {
      push({
        id: `work-order-detail-${workOrderId}`,
        type: 'work-order-detail',
        label: `WO #${workOrderNumber}`,
        data: { workOrderId, workOrderNumber },
      })
    },

    openWorkOrderParts: (workOrderId: string, workOrderNumber: string) => {
      push({
        id: `work-order-parts-${workOrderId}`,
        type: 'work-order-parts',
        label: 'Parts',
        data: { workOrderId, workOrderNumber },
      })
    },

    openWorkOrderLabor: (workOrderId: string, workOrderNumber: string) => {
      push({
        id: `work-order-labor-${workOrderId}`,
        type: 'work-order-labor',
        label: 'Labor',
        data: { workOrderId, workOrderNumber },
      })
    },

    // Facility drilldowns
    openFacilityDetail: (facilityId: string, facilityName: string) => {
      push({
        id: `facility-detail-${facilityId}`,
        type: 'facility-detail',
        label: facilityName,
        data: { facilityId, facilityName },
      })
    },

    openFacilityVehicles: (facilityId: string, facilityName: string) => {
      push({
        id: `facility-vehicles-${facilityId}`,
        type: 'facility-vehicles',
        label: 'Vehicles',
        data: { facilityId, facilityName },
      })
    },

    // Trip drilldown
    openTripTelemetry: (tripId: string, trip?: any) => {
      push({
        id: `trip-telemetry-${tripId}`,
        type: 'trip-telemetry',
        label: `Trip ${tripId.slice(0, 8)}`,
        data: { tripId, trip },
      })
    },
  }
}
