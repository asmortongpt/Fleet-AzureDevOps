import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useFleetMetrics } from '../useFleetMetrics';

describe('useFleetMetrics', () => {
  it('should calculate metrics for empty vehicle array', () => {
    const { result } = renderHook(() => useFleetMetrics([]));

    expect(result.current).toEqual({
      total: 0,
      active: 0,
      inMaintenance: 0,
      outOfService: 0,
      utilizationRate: 0
    });
  });

  it('should calculate metrics for vehicles with all active status', () => {
    const vehicles = [
      { status: 'active' },
      { status: 'active' },
      { status: 'active' }
    ];

    const { result } = renderHook(() => useFleetMetrics(vehicles));

    expect(result.current).toEqual({
      total: 3,
      active: 3,
      inMaintenance: 0,
      outOfService: 0,
      utilizationRate: 100
    });
  });

  it('should calculate metrics for mixed vehicle statuses', () => {
    const vehicles = [
      { status: 'active' },
      { status: 'active' },
      { status: 'maintenance' },
      { status: 'out-of-service' },
      { status: 'active' }
    ];

    const { result } = renderHook(() => useFleetMetrics(vehicles));

    expect(result.current).toEqual({
      total: 5,
      active: 3,
      inMaintenance: 1,
      outOfService: 1,
      utilizationRate: 60
    });
  });

  it('should calculate 50% utilization rate', () => {
    const vehicles = [
      { status: 'active' },
      { status: 'active' },
      { status: 'maintenance' },
      { status: 'out-of-service' }
    ];

    const { result } = renderHook(() => useFleetMetrics(vehicles));

    expect(result.current.utilizationRate).toBe(50);
  });

  it('should handle vehicles with no active status', () => {
    const vehicles = [
      { status: 'maintenance' },
      { status: 'out-of-service' },
      { status: 'out-of-service' }
    ];

    const { result } = renderHook(() => useFleetMetrics(vehicles));

    expect(result.current).toEqual({
      total: 3,
      active: 0,
      inMaintenance: 1,
      outOfService: 2,
      utilizationRate: 0
    });
  });

  it('should handle single vehicle', () => {
    const vehicles = [{ status: 'active' }];

    const { result } = renderHook(() => useFleetMetrics(vehicles));

    expect(result.current).toEqual({
      total: 1,
      active: 1,
      inMaintenance: 0,
      outOfService: 0,
      utilizationRate: 100
    });
  });

  it('should recalculate when vehicles change', () => {
    const initialVehicles = [{ status: 'active' }, { status: 'active' }];

    const { result, rerender } = renderHook(
      ({ vehicles }) => useFleetMetrics(vehicles),
      { initialProps: { vehicles: initialVehicles } }
    );

    expect(result.current.total).toBe(2);
    expect(result.current.active).toBe(2);

    const newVehicles = [
      { status: 'active' },
      { status: 'maintenance' },
      { status: 'active' }
    ];

    rerender({ vehicles: newVehicles });

    expect(result.current.total).toBe(3);
    expect(result.current.active).toBe(2);
    expect(result.current.inMaintenance).toBe(1);
  });

  it('should handle large fleet', () => {
    const vehicles = Array(1000).fill(null).map((_, i) => ({
      status: i % 2 === 0 ? 'active' : 'maintenance'
    }));

    const { result } = renderHook(() => useFleetMetrics(vehicles));

    expect(result.current).toEqual({
      total: 1000,
      active: 500,
      inMaintenance: 500,
      outOfService: 0,
      utilizationRate: 50
    });
  });

  it('should handle vehicles with additional properties', () => {
    const vehicles = [
      { id: '1', name: 'Vehicle 1', status: 'active', type: 'truck' },
      { id: '2', name: 'Vehicle 2', status: 'maintenance', type: 'van' },
      { id: '3', name: 'Vehicle 3', status: 'active', type: 'sedan' }
    ];

    const { result } = renderHook(() => useFleetMetrics(vehicles));

    expect(result.current).toEqual({
      total: 3,
      active: 2,
      inMaintenance: 1,
      outOfService: 0,
      utilizationRate: 66.66666666666666
    });
  });

  it('should round utilization rate correctly', () => {
    const vehicles = [
      { status: 'active' },
      { status: 'maintenance' },
      { status: 'maintenance' }
    ];

    const { result } = renderHook(() => useFleetMetrics(vehicles));

    expect(result.current.utilizationRate).toBeCloseTo(33.33, 2);
  });
});
