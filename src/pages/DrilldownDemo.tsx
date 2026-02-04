/**
 * Drilldown Demo Page - Shows DataDrilldown in action
 * Demonstrates Summary → Detail → Edit flow for vehicles
 */

import { useMemo } from 'react';
import useSWR from 'swr';

import { DataDrilldown, DrilldownRecord, DrilldownPermissions } from '@/components/common/DataDrilldown';
import { swrFetcher } from '@/lib/fetcher';

const PERMISSIONS: DrilldownPermissions = {
  canView: true,
  canEdit: true,
  canDelete: true,
  canViewChildren: true
};

export default function DrilldownDemo() {
  const { data: vehiclesPayload, isLoading: isLoadingVehicles } = useSWR<any>(
    '/api/vehicles?limit=50',
    swrFetcher,
    { revalidateOnFocus: false }
  )

  const records = useMemo<DrilldownRecord[]>(() => {
    const raw =
      (Array.isArray(vehiclesPayload?.data) && vehiclesPayload.data) ||
      (Array.isArray(vehiclesPayload?.data?.data) && vehiclesPayload.data.data) ||
      []

    return raw.map((v: any) => ({
      id: String(v.id),
      type: 'vehicle',
      title: String(v.name || v.number || v.unit_number || v.vehicle_number || v.id),
      subtitle: v.vin ? `VIN: ${v.vin}` : undefined,
      status: String(v.status || ''),
      metadata: {
        make: v.make,
        model: v.model,
        year: v.year,
        mileage: v.odometer,
        fuelType: v.fuel_type,
        licensePlate: v.license_plate,
      },
    }))
  }, [vehiclesPayload])

  const handleView = (record: DrilldownRecord) => {
    console.log('View record:', record);
  };

  const handleEdit = (record: DrilldownRecord) => {
    console.log('Edit record:', record);
    alert(`Saved changes to ${record.title}`);
  };

  const handleDelete = (record: DrilldownRecord) => {
    console.log('Delete record:', record);
    alert(`Deleted ${record.title}`);
  };

  const handleNavigate = (type: string, id: string) => {
    console.log('Navigate to:', type, id);
    alert(`Navigating to ${type} ${id}`);
  };

  return (
    <div className="container mx-auto p-3">
      <div className="mb-3">
        <h1 className="text-base font-bold">Universal Drilldown Demo</h1>
        <p className="text-muted-foreground mt-2">
          This demonstrates the Summary → Detail → Edit flow with RBAC permissions.
          Try clicking on a vehicle to see details, then drill into maintenance records.
        </p>
      </div>

      <DataDrilldown
        records={records}
        entityType="Vehicles"
        permissions={PERMISSIONS}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNavigate={handleNavigate}
      />
      {isLoadingVehicles && (
        <p className="text-xs text-muted-foreground mt-2">Loading vehicles…</p>
      )}
    </div>
  );
}
