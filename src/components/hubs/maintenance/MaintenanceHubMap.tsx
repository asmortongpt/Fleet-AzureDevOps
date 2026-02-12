import { Wrench, MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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
  const [_map, setMap] = useState<google.maps.Map | null>(null);

  const displayWorkOrders = workOrders;
  const displayLocations = serviceLocations;
  const hasMapData = displayWorkOrders.length > 0 || displayLocations.length > 0;

  // Calculate center point from all markers
  const center = useMemo(() => {
    const allPoints = [
      ...displayWorkOrders.map(wo => wo.location),
      ...displayLocations.map(sl => sl.location)
    ];

    if (allPoints.length === 0) {
      return null;
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
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'active': return <Wrench className="w-4 h-4 text-blue-800" />;
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
      {!hasMapData ? (
        <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
          No maintenance map data available.
        </div>
      ) : (
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center || { lat: 0, lng: 0 }}
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
                  <p className="text-xs text-slate-700 mt-1">{selectedWorkOrder.description}</p>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-700">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedWorkOrder.location.address}</span>
                </div>

                {selectedWorkOrder.estimatedCompletion && (
                  <div className="flex items-center gap-1 text-xs text-gray-700">
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

                <div className="flex items-center gap-1 text-xs text-gray-700">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedLocation.location.address}</span>
                </div>

                {selectedLocation.phone && (
                  <p className="text-xs text-slate-700">📞 {selectedLocation.phone}</p>
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
      )}
    </div>
  );
}
