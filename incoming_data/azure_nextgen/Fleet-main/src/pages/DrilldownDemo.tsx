/**
 * Drilldown Demo Page - Shows DataDrilldown in action
 * Demonstrates Summary → Detail → Edit flow for vehicles
 */

import React from 'react';

import { DataDrilldown, DrilldownRecord, DrilldownPermissions } from '@/components/common/DataDrilldown';

const DEMO_VEHICLES: DrilldownRecord[] = [
  {
    id: 'VEH-001',
    type: 'vehicle',
    title: '2024 Ford F-150',
    subtitle: 'VIN: 1FTFW1E50PFA12345',
    status: 'Active',
    metadata: {
      make: 'Ford',
      model: 'F-150',
      year: 2024,
      mileage: 12450,
      fuelType: 'Gasoline',
      licensePlate: 'ABC-1234',
      assignedDriver: 'John Doe',
      department: 'Operations'
    },
    children: [
      {
        id: 'MAINT-001',
        type: 'maintenance',
        title: 'Oil Change',
        subtitle: 'Scheduled Maintenance',
        status: 'Completed',
        metadata: {
          date: '2025-12-15',
          cost: '$89.99',
          vendor: 'QuickLube Auto',
          mileage: 12000
        },
        auditTrail: [
          {
            timestamp: new Date('2025-12-15T10:00:00'),
            user: 'mechanic@fleet.com',
            action: 'COMPLETED',
            details: 'Oil change completed, used synthetic 5W-30'
          },
          {
            timestamp: new Date('2025-12-14T14:00:00'),
            user: 'scheduler@fleet.com',
            action: 'SCHEDULED',
            details: 'Scheduled maintenance appointment'
          }
        ]
      },
      {
        id: 'MAINT-002',
        type: 'maintenance',
        title: 'Tire Rotation',
        subtitle: 'Scheduled Maintenance',
        status: 'Pending',
        metadata: {
          date: '2026-01-05',
          estimatedCost: '$75.00',
          vendor: 'Tire Center',
          mileage: 15000
        }
      }
    ],
    relatedEntities: [
      { type: 'Driver', id: 'DRV-101', label: 'John Doe' },
      { type: 'Department', id: 'DEPT-OPS', label: 'Operations' }
    ],
    auditTrail: [
      {
        timestamp: new Date('2025-12-31T09:00:00'),
        user: 'admin@fleet.com',
        action: 'UPDATED',
        details: 'Updated mileage from 12400 to 12450'
      },
      {
        timestamp: new Date('2025-12-01T08:00:00'),
        user: 'admin@fleet.com',
        action: 'ASSIGNED',
        details: 'Assigned to driver John Doe'
      },
      {
        timestamp: new Date('2025-11-15T10:00:00'),
        user: 'admin@fleet.com',
        action: 'CREATED',
        details: 'Vehicle added to fleet'
      }
    ]
  },
  {
    id: 'VEH-002',
    type: 'vehicle',
    title: '2023 Chevrolet Silverado',
    subtitle: 'VIN: 1GCVKREC8PZ123456',
    status: 'Maintenance',
    metadata: {
      make: 'Chevrolet',
      model: 'Silverado',
      year: 2023,
      mileage: 28900,
      fuelType: 'Diesel',
      licensePlate: 'XYZ-5678',
      assignedDriver: 'Jane Smith',
      department: 'Logistics'
    },
    children: [
      {
        id: 'MAINT-003',
        type: 'maintenance',
        title: 'Brake Inspection',
        subtitle: 'Safety Check',
        status: 'In Progress',
        metadata: {
          date: '2025-12-31',
          estimatedCost: '$250.00',
          vendor: 'Auto Service Center',
          mileage: 28900
        }
      }
    ],
    relatedEntities: [
      { type: 'Driver', id: 'DRV-102', label: 'Jane Smith' },
      { type: 'Department', id: 'DEPT-LOG', label: 'Logistics' }
    ]
  },
  {
    id: 'VEH-003',
    type: 'vehicle',
    title: '2024 Toyota Tacoma',
    subtitle: 'VIN: 3TMCZ5AN9PM123789',
    status: 'Active',
    metadata: {
      make: 'Toyota',
      model: 'Tacoma',
      year: 2024,
      mileage: 8500,
      fuelType: 'Gasoline',
      licensePlate: 'DEF-9012',
      assignedDriver: 'Bob Johnson',
      department: 'Field Services'
    }
  }
];

const PERMISSIONS: DrilldownPermissions = {
  canView: true,
  canEdit: true,
  canDelete: true,
  canViewChildren: true
};

export default function DrilldownDemo() {
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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Universal Drilldown Demo</h1>
        <p className="text-muted-foreground mt-2">
          This demonstrates the Summary → Detail → Edit flow with RBAC permissions.
          Try clicking on a vehicle to see details, then drill into maintenance records.
        </p>
      </div>

      <DataDrilldown
        records={DEMO_VEHICLES}
        entityType="Vehicles"
        permissions={PERMISSIONS}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
