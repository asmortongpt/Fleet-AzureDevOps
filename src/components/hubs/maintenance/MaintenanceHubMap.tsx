import React, { useMemo, useState } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Wrench,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  Warning
} from '@phosphor-icons/react';

interface WorkOrder {
  id: string;
  vehicleId: string;
  vehicleUnit: string;
  type: 'scheduled' | 'active' | 'urgent' | 'completed';
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  scheduledDate?: string;
  estimatedCompletion?: string;
}

interface ServiceLocation {
  id: string;
  name: string;
  type: 'service_center' | 'parts_warehouse' | 'vendor';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  services: string[];
  phone?: string;
}

interface MaintenanceHubMapProps {
  workOrders?: WorkOrder[];
  serviceLocations?: ServiceLocation[];
  onWorkOrderClick?: (workOrder: WorkOrder) => void;
  onServiceLocationClick?: (location: ServiceLocation) => void;
  height?: string;
}

export function MaintenanceHubMap({
  workOrders = [],
  serviceLocations = [],
  onWorkOrderClick,
  onServiceLocationClick,
  height = '100%'
}: MaintenanceHubMapProps) {
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<ServiceLocation | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Sample work orders - would come from props/API in production
  const sampleWorkOrders: WorkOrder[] = useMemo(() => [
    {
      id: 'WO-001',
      vehicleId: 'V-45',
      vehicleUnit: 'Unit 45',
      type: 'active',
      description: 'Oil change and tire rotation',
      location: {
        lat: 28.5383,
        lng: -81.3792,
        address: '123 Service Way, Orlando, FL'
      },
      estimatedCompletion: '2:00 PM'
    },
    {
      id: 'WO-002',
      vehicleId: 'V-23',
      vehicleUnit: 'Unit 23',
      type: 'urgent',
      description: 'Brake repair - urgent',
      location: {
        lat: 28.5500,
        lng: -81.3700,
        address: '456 Repair Blvd, Orlando, FL'
      },
      estimatedCompletion: 'ASAP'
    },
    {
      id: 'WO-003',
      vehicleId: 'V-67',
      vehicleUnit: 'Unit 67',
      type: 'scheduled',
      description: 'Preventive maintenance inspection',
      location: {
        lat: 28.5200,
        lng: -81.3900,
        address: '789 Fleet St, Orlando, FL'
      },
      scheduledDate: 'Tomorrow 9:00 AM'
    }
  ], []);

  // Sample service locations
  const sampleServiceLocations: ServiceLocation[] = useMemo(() => [
    {
      id: 'SL-001',
      name: 'Main Service Center',
      type: 'service_center',
      location: {
        lat: 28.5383,
        lng: -81.3792,
        address: '123 Service Way, Orlando, FL'
      },
      services: ['Oil Change', 'Tire Service', 'Brake Repair', 'Engine Diagnostics'],
      phone: '(407) 555-0100'
    },
    {
      id: 'SL-002',
      name: 'Parts Warehouse North',
      type: 'parts_warehouse',
      location: {
        lat: 28.5600,
        lng: -81.3600,
        address: '456 Industrial Pkwy, Orlando, FL'
      },
      services: ['Parts Inventory', 'Emergency Parts'],
      phone: '(407) 555-0200'
    },
    {
      id: 'SL-003',
      name: 'Certified Vendor - AutoCare',
      type: 'vendor',
      location: {
        lat: 28.5100,
        lng: -81.4000,
        address: '789 Vendor Lane, Orlando, FL'
      },
      services: ['Transmission Repair', 'AC Service', 'Electrical'],
      phone: '(407) 555-0300'
    }
  ], []);

  const displayWorkOrders = workOrders.length > 0 ? workOrders : sampleWorkOrders;
  const displayLocations = serviceLocations.length > 0 ? serviceLocations : sampleServiceLocations;

  // Calculate center point from all markers
  const center = useMemo(() => {
    const allPoints = [
      ...displayWorkOrders.map(wo => wo.location),
      ...displayLocations.map(sl => sl.location)
    ];

    if (allPoints.length === 0) {
      return { lat: 28.5383, lng: -81.3792 }; // Orlando, FL default
    }

    const avgLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length;
    const avgLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length;

    return { lat: avgLat, lng: avgLng };
  }, [displayWorkOrders, displayLocations]);

  const getWorkOrderColor = (type: WorkOrder['type']) => {
    switch (type) {
      case 'urgent': return '#EF4444'; // red
      case 'active': return '#3B82F6'; // blue
      case 'scheduled': return '#F59E0B'; // amber
      case 'completed': return '#10B981'; // green
      default: return '#6B7280'; // gray
    }
  };

  const getLocationIcon = (type: ServiceLocation['type']) => {
    switch (type) {
      case 'service_center': return '🔧';
      case 'parts_warehouse': return '📦';
      case 'vendor': return '🏪';
      default: return '📍';
    }
  };

  const getWorkOrderIcon = (type: WorkOrder['type']) => {
    switch (type) {
      case 'urgent': return <Warning className="w-4 h-4 text-red-500" />;
      case 'active': return <Wrench className="w-4 h-4 text-blue-500" />;
      case 'scheduled': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  const getWorkOrderBadgeVariant = (type: WorkOrder['type']): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'urgent': return 'destructive';
      case 'active': return 'default';
      case 'scheduled': return 'secondary';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div style={{ height, width: '100%' }} data-testid="maintenance-hub-map">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={12}
        onLoad={(mapInstance) => setMap(mapInstance)}
        options={{
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {/* Work Order Markers */}
        {displayWorkOrders.map((workOrder) => (
          <Marker
            key={workOrder.id}
            position={workOrder.location}
            onClick={() => {
              setSelectedWorkOrder(workOrder);
              setSelectedLocation(null);
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: getWorkOrderColor(workOrder.type),
              fillOpacity: 0.9,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            }}
          />
        ))}

        {/* Service Location Markers */}
        {displayLocations.map((location) => (
          <Marker
            key={location.id}
            position={location.location}
            onClick={() => {
              setSelectedLocation(location);
              setSelectedWorkOrder(null);
            }}
            label={{
              text: getLocationIcon(location.type),
              fontSize: '20px',
            }}
          />
        ))}

        {/* Work Order Info Window */}
        {selectedWorkOrder && (
          <InfoWindow
            position={selectedWorkOrder.location}
            onCloseClick={() => setSelectedWorkOrder(null)}
          >
            <Card className="border-0 shadow-none">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getWorkOrderIcon(selectedWorkOrder.type)}
                    <span className="font-semibold text-sm">{selectedWorkOrder.id}</span>
                  </div>
                  <Badge variant={getWorkOrderBadgeVariant(selectedWorkOrder.type)}>
                    {selectedWorkOrder.type}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium">{selectedWorkOrder.vehicleUnit}</p>
                  <p className="text-xs text-gray-600 mt-1">{selectedWorkOrder.description}</p>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedWorkOrder.location.address}</span>
                </div>

                {selectedWorkOrder.estimatedCompletion && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>ETA: {selectedWorkOrder.estimatedCompletion}</span>
                  </div>
                )}

                {onWorkOrderClick && (
                  <button
                    onClick={() => onWorkOrderClick(selectedWorkOrder)}
                    className="w-full mt-2 px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    View Details
                  </button>
                )}
              </CardContent>
            </Card>
          </InfoWindow>
        )}

        {/* Service Location Info Window */}
        {selectedLocation && (
          <InfoWindow
            position={selectedLocation.location}
            onCloseClick={() => setSelectedLocation(null)}
          >
            <Card className="border-0 shadow-none">
              <CardContent className="p-3 space-y-2">
                <div>
                  <h4 className="font-semibold text-sm">{selectedLocation.name}</h4>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {selectedLocation.type.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedLocation.location.address}</span>
                </div>

                {selectedLocation.phone && (
                  <p className="text-xs text-gray-600">📞 {selectedLocation.phone}</p>
                )}

                <div className="mt-2">
                  <p className="text-xs font-medium mb-1">Services:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedLocation.services.map((service, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                {onServiceLocationClick && (
                  <button
                    onClick={() => onServiceLocationClick(selectedLocation)}
                    className="w-full mt-2 px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    View Details
                  </button>
                )}
              </CardContent>
            </Card>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
