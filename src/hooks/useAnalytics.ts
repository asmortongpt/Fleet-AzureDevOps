import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics/provider';

/**
 * Custom hook for analytics tracking
 *
 * Provides convenient methods for tracking user events and behaviors.
 * Automatically tracks page views on route changes.
 *
 * @example
 * ```tsx
 * function VehicleForm() {
 *   const { trackVehicleCreated, trackUserAction } = useAnalytics();
 *
 *   const handleSubmit = async (data) => {
 *     const vehicle = await createVehicle(data);
 *     trackVehicleCreated(vehicle.id, vehicle.make, vehicle.model);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useAnalytics() {
  const location = useLocation();
  const previousPathRef = useRef<string | null>(null);

  // Track page views automatically
  useEffect(() => {
    // Only track if path actually changed
    if (location.pathname !== previousPathRef.current) {
      previousPathRef.current = location.pathname;

      analytics.page(location.pathname, {
        path: location.pathname,
        search: location.search,
        hash: location.hash,
        referrer: document.referrer,
      });
    }
  }, [location]);

  /**
   * Track a custom event
   */
  const trackEvent = useCallback(
    (event: string, properties?: Record<string, any>) => {
      analytics.track(event, {
        ...properties,
        path: location.pathname,
        timestamp: new Date().toISOString(),
      });
    },
    [location]
  );

  /**
   * Track when a vehicle is created
   */
  const trackVehicleCreated = useCallback(
    (vehicleId: string, make: string, model: string) => {
      trackEvent('Vehicle Created', {
        vehicle_id: vehicleId,
        make,
        model,
        category: 'vehicle_management',
      });
    },
    [trackEvent]
  );

  /**
   * Track when a vehicle is updated
   */
  const trackVehicleUpdated = useCallback(
    (vehicleId: string, changes: Record<string, any>) => {
      trackEvent('Vehicle Updated', {
        vehicle_id: vehicleId,
        changes: Object.keys(changes),
        category: 'vehicle_management',
      });
    },
    [trackEvent]
  );

  /**
   * Track when a vehicle is deleted
   */
  const trackVehicleDeleted = useCallback(
    (vehicleId: string) => {
      trackEvent('Vehicle Deleted', {
        vehicle_id: vehicleId,
        category: 'vehicle_management',
      });
    },
    [trackEvent]
  );

  /**
   * Track when a driver is created
   */
  const trackDriverCreated = useCallback(
    (driverId: string, name: string) => {
      trackEvent('Driver Created', {
        driver_id: driverId,
        name,
        category: 'driver_management',
      });
    },
    [trackEvent]
  );

  /**
   * Track when a driver is assigned to a vehicle
   */
  const trackDriverAssigned = useCallback(
    (driverId: string, vehicleId: string) => {
      trackEvent('Driver Assigned', {
        driver_id: driverId,
        vehicle_id: vehicleId,
        category: 'driver_management',
      });
    },
    [trackEvent]
  );

  /**
   * Track when maintenance is scheduled
   */
  const trackMaintenanceScheduled = useCallback(
    (vehicleId: string, serviceType: string, date: string) => {
      trackEvent('Maintenance Scheduled', {
        vehicle_id: vehicleId,
        service_type: serviceType,
        scheduled_date: date,
        category: 'maintenance',
      });
    },
    [trackEvent]
  );

  /**
   * Track when maintenance is completed
   */
  const trackMaintenanceCompleted = useCallback(
    (vehicleId: string, serviceType: string, cost: number) => {
      trackEvent('Maintenance Completed', {
        vehicle_id: vehicleId,
        service_type: serviceType,
        cost,
        category: 'maintenance',
      });
    },
    [trackEvent]
  );

  /**
   * Track when fuel is added
   */
  const trackFuelAdded = useCallback(
    (vehicleId: string, amount: number, cost: number) => {
      trackEvent('Fuel Added', {
        vehicle_id: vehicleId,
        amount,
        cost,
        price_per_unit: cost / amount,
        category: 'fuel_tracking',
      });
    },
    [trackEvent]
  );

  /**
   * Track when a report is generated
   */
  const trackReportGenerated = useCallback(
    (reportType: string, filters: any) => {
      trackEvent('Report Generated', {
        report_type: reportType,
        filters: JSON.stringify(filters),
        category: 'reports',
      });
    },
    [trackEvent]
  );

  /**
   * Track when a report is exported
   */
  const trackReportExported = useCallback(
    (reportType: string, format: string) => {
      trackEvent('Report Exported', {
        report_type: reportType,
        format,
        category: 'reports',
      });
    },
    [trackEvent]
  );

  /**
   * Track generic user actions (clicks, form submissions, etc.)
   */
  const trackUserAction = useCallback(
    (action: string, target: string, metadata?: Record<string, any>) => {
      trackEvent('User Action', {
        action,
        target,
        ...metadata,
        category: 'user_interaction',
      });
    },
    [trackEvent]
  );

  /**
   * Track form submissions
   */
  const trackFormSubmitted = useCallback(
    (formName: string, success: boolean, errors?: string[]) => {
      trackEvent('Form Submitted', {
        form_name: formName,
        success,
        errors: errors?.join(', '),
        category: 'forms',
      });
    },
    [trackEvent]
  );

  /**
   * Track search queries
   */
  const trackSearch = useCallback(
    (query: string, resultsCount: number) => {
      trackEvent('Search Performed', {
        query,
        results_count: resultsCount,
        category: 'search',
      });
    },
    [trackEvent]
  );

  /**
   * Track filter usage
   */
  const trackFilter = useCallback(
    (filterType: string, filterValue: any) => {
      trackEvent('Filter Applied', {
        filter_type: filterType,
        filter_value: filterValue,
        category: 'filtering',
      });
    },
    [trackEvent]
  );

  /**
   * Track errors with context
   */
  const trackError = useCallback(
    (error: Error, context?: Record<string, any>) => {
      trackEvent('Error Occurred', {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        ...context,
        category: 'errors',
      });
    },
    [trackEvent]
  );

  /**
   * Track API call performance
   */
  const trackApiCall = useCallback(
    (
      endpoint: string,
      method: string,
      duration: number,
      status: number,
      success: boolean
    ) => {
      trackEvent('API Call', {
        endpoint,
        method,
        duration,
        status,
        success,
        category: 'performance',
      });
    },
    [trackEvent]
  );

  /**
   * Track feature usage
   */
  const trackFeatureUsed = useCallback(
    (featureName: string, metadata?: Record<string, any>) => {
      trackEvent('Feature Used', {
        feature_name: featureName,
        ...metadata,
        category: 'features',
      });
    },
    [trackEvent]
  );

  /**
   * Track user engagement time
   */
  const trackEngagement = useCallback(
    (section: string, duration: number) => {
      trackEvent('User Engagement', {
        section,
        duration,
        category: 'engagement',
      });
    },
    [trackEvent]
  );

  /**
   * Track notification interactions
   */
  const trackNotification = useCallback(
    (action: 'shown' | 'clicked' | 'dismissed', type: string) => {
      trackEvent('Notification Interaction', {
        action,
        notification_type: type,
        category: 'notifications',
      });
    },
    [trackEvent]
  );

  /**
   * Track settings changes
   */
  const trackSettingChanged = useCallback(
    (setting: string, oldValue: any, newValue: any) => {
      trackEvent('Setting Changed', {
        setting,
        old_value: oldValue,
        new_value: newValue,
        category: 'settings',
      });
    },
    [trackEvent]
  );

  return {
    // Core tracking
    trackEvent,
    trackUserAction,
    trackError,

    // Vehicle tracking
    trackVehicleCreated,
    trackVehicleUpdated,
    trackVehicleDeleted,

    // Driver tracking
    trackDriverCreated,
    trackDriverAssigned,

    // Maintenance tracking
    trackMaintenanceScheduled,
    trackMaintenanceCompleted,

    // Fuel tracking
    trackFuelAdded,

    // Report tracking
    trackReportGenerated,
    trackReportExported,

    // Form tracking
    trackFormSubmitted,

    // Search and filter
    trackSearch,
    trackFilter,

    // Performance
    trackApiCall,

    // Feature usage
    trackFeatureUsed,

    // Engagement
    trackEngagement,

    // Notifications
    trackNotification,

    // Settings
    trackSettingChanged,
  };
}

/**
 * Hook to track component mount/unmount
 */
export function useComponentTracking(componentName: string) {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent('Component Mounted', {
      component: componentName,
      category: 'component_lifecycle',
    });

    return () => {
      trackEvent('Component Unmounted', {
        component: componentName,
        category: 'component_lifecycle',
      });
    };
  }, [componentName, trackEvent]);
}

/**
 * Hook to track time spent on a component
 */
export function useTimeTracking(sectionName: string) {
  const { trackEngagement } = useAnalytics();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      const duration = Date.now() - startTimeRef.current;
      trackEngagement(sectionName, duration);
    };
  }, [sectionName, trackEngagement]);
}
