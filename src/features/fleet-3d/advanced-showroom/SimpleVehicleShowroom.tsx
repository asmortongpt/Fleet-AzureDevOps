import React, { useState, useEffect } from 'react';
import { EnhancedVehicleImageService } from '../../services/EnhancedVehicleImageService';
import { RealDataService } from '../../services/RealDataService';
import AccurateVehicleImage from '../vehicle/AccurateVehicleImage';
import VehicleDetailView from '../vehicle/VehicleDetailView';
import OBD2RealTimeConnection from '../vehicle/OBD2RealTimeConnection';

interface SimpleVehicleShowroomProps {
  vehicles: any[];
  selectedVehicle: any;
  onVehicleSelect: (vehicle: any) => void;
  currentTheme: any;
}

interface VehicleUpdateData {
  id: string;
  color?: string;
  licensePlate?: string;
}

const SimpleVehicleShowroom: React.FC<SimpleVehicleShowroomProps> = ({
  vehicles,
  selectedVehicle,
  onVehicleSelect,
  currentTheme
}) => {
  const [realVehicles, setRealVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailView, setShowDetailView] = useState<string | null>(null);
  const [showOBD2Connection, setShowOBD2Connection] = useState<string | null>(null);

  useEffect(() => {
    loadRealVehicleData();
  }, []);

  const loadRealVehicleData = async () => {
    try {
      setLoading(true);
      const realDataService = new RealDataService();
      const teamVehicles = await realDataService.getVehicles();
      const teamPeople = await realDataService.getPeople();

      // Transform to showroom format with accurate team data
      const showroomVehicles = teamVehicles.map((v) => ({
        ...v,
        name: `${v.make} ${v.model} ${v.year}`,
        type: 'Vehicle',
        status: v.vehicle_status,
        fuel: Math.floor(Math.random() * 50) + 50, // Simulate current fuel
        health: Math.floor(Math.random() * 20) + 80, // Simulate health
        driver: {
          name: v.assigned_driver_id
            ? teamPeople.find((p) => p.id === v.assigned_driver_id)?.first_name +
              ' ' +
              teamPeople.find((p) => p.id === v.assigned_driver_id)?.last_name || 'Unassigned'
            : 'Unassigned',
          id: v.assigned_driver_id || 'unassigned'
        }
      }));

      setRealVehicles(showroomVehicles);
    } catch (error) {
      // Fallback to passed vehicles prop
      setRealVehicles(vehicles);
    } finally {
      setLoading(false);
    }
  };

  // Use real vehicles if available, otherwise fallback to prop vehicles
  const displayVehicles = realVehicles.length > 0 ? realVehicles : vehicles;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'maintenance':
        return '#f59e0b';
      case 'idle':
        return '#374151';
      case 'reserved':
        return '#3b82f6';
      default:
        return '#374151';
    }
  };

  const getVehicleImage = (
    make: string,
    model: string,
    year: number,
    type: string,
    color: string,
    licensePlate?: string
  ) => {
    const enhancedImageService = EnhancedVehicleImageService.getInstance();

    // Check for specific vehicle customizations
    const customizations: string[] = [];
    if (licensePlate === 'AM-JEEP16' && make.toLowerCase() === 'jeep') {
      customizations.push('lift kit'); // Andrew's lifted jeep
    }

    const imageConfig = {
      make,
      model,
      year,
      color,
      licensePlate,
      customizations
    };

    const vehicleImages = enhancedImageService.getVehicleImage(imageConfig);
    return vehicleImages.primary;
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2
        style={{
          marginTop: 0,
          marginBottom: '24px',
          fontSize: '28px',
          fontWeight: '700',
          color: currentTheme.text
        }}
      >
        🚗 Vehicle Showroom
      </h2>

      {selectedVehicle && (
        <div
          style={{
            background: currentTheme.surface,
            border: `2px solid ${currentTheme.primary}`,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', color: currentTheme.text }}>
            Selected Vehicle:{' '}
            {selectedVehicle.name || `${selectedVehicle.make} ${selectedVehicle.model}`}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <div>
              <img
                src={getVehicleImage(
                  selectedVehicle.make,
                  selectedVehicle.model,
                  selectedVehicle.year,
                  selectedVehicle.type,
                  selectedVehicle.color,
                  selectedVehicle.licensePlate
                )}
                alt={selectedVehicle.name}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border}`
                }}
              />
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div
                    style={{
                      color: currentTheme.textMuted,
                      fontSize: '12px',
                      marginBottom: '4px'
                    }}
                  >
                    Status
                  </div>
                  <span
                    style={{
                      background: getStatusColor(selectedVehicle.status),
                      color: '#fff',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}
                  >
                    {selectedVehicle.status}
                  </span>
                </div>
                <div>
                  <div
                    style={{
                      color: currentTheme.textMuted,
                      fontSize: '12px',
                      marginBottom: '4px'
                    }}
                  >
                    VIN
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: currentTheme.text }}>
                    {selectedVehicle.vin}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      color: currentTheme.textMuted,
                      fontSize: '12px',
                      marginBottom: '4px'
                    }}
                  >
                    License Plate
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: currentTheme.text }}>
                    {selectedVehicle.licensePlate}
                  </div>
                </div>

                {/* Add OBD2 Connect button for 4Runner */}
                {selectedVehicle.id === 'FL-001' && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                    <button
                      onClick={() => setShowOBD2Connection(selectedVehicle.id)}
                      style={{
                        background: currentTheme.primary,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      📡 Connect to Real OBD2 Device
                    </button>
                  </div>
                )}

                <div>
                  <div
                    style={{
                      color: currentTheme.textMuted,
                      fontSize: '12px',
                      marginBottom: '4px'
                    }}
                  >
                    Mileage
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: currentTheme.text }}>
                    {selectedVehicle.mileage?.toLocaleString()} miles
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      color: currentTheme.textMuted,
                      fontSize: '12px',
                      marginBottom: '4px'
                    }}
                  >
                    Fuel Level
                  </div>
                  <div
                    style={{
                      background: currentTheme.bg,
                      borderRadius: '4px',
                      height: '20px',
                      position: 'relative' as const,
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${selectedVehicle.fuel || 75}%`,
                        background:
                          selectedVehicle.fuel > 30 ? currentTheme.success : currentTheme.warning,
                        transition: 'width 0.3s ease'
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: currentTheme.text
                      }}
                    >
                      {selectedVehicle.fuel || 75}%
                    </span>
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      color: currentTheme.textMuted,
                      fontSize: '12px',
                      marginBottom: '4px'
                    }}
                  >
                    Health
                  </div>
                  <div
                    style={{
                      background: currentTheme.bg,
                      borderRadius: '4px',
                      height: '20px',
                      position: 'relative' as const,
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${selectedVehicle.health || 85}%`,
                        background:
                          selectedVehicle.health > 70 ? currentTheme.success : currentTheme.warning,
                        transition: 'width 0.3s ease'
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: currentTheme.text
                      }}
                    >
                      {selectedVehicle.health || 85}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <h3 style={{ marginBottom: '16px', color: currentTheme.text }}>Fleet Vehicles</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}
      >
        {loading ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px',
              color: currentTheme.textMuted
            }}
          >
            Loading real team vehicles...
          </div>
        ) : (
          displayVehicles.slice(0, 12).map((vehicle) => (
            <div
              key={vehicle.id}
              onClick={() => onVehicleSelect(vehicle)}
              style={{
                background: currentTheme.surface,
                border: `1px solid ${
                  selectedVehicle?.id === vehicle.id ? currentTheme.primary : currentTheme.border
                }`,
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: selectedVehicle?.id === vehicle.id ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (selectedVehicle?.id !== vehicle.id) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                if (selectedVehicle?.id !== vehicle.id) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ position: 'relative' as const, marginBottom: '12px' }}>
                <img
                  src={getVehicleImage(
                    vehicle.make,
                    vehicle.model,
                    vehicle.year,
                    vehicle.type,
                    vehicle.color,
                    vehicle.licensePlate
                  )}
                  alt={vehicle.name}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover' as const,
                    borderRadius: '8px'
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: getStatusColor(vehicle.status),
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}
                >
                  {vehicle.status}
                </span>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: '600', fontSize: '16px', color: currentTheme.text }}>
                  {vehicle.name || `${vehicle.make} ${vehicle.model}`}
                </div>
                <div style={{ fontSize: '12px', color: currentTheme.textMuted }}>
                  {vehicle.licensePlate} • {vehicle.year}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <span style={{ color: currentTheme.textMuted }}>Mileage: </span>
                    <span style={{ fontWeight: '600', color: currentTheme.text }}>
                      {vehicle.mileage?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: currentTheme.textMuted }}>Fuel: </span>
                    <span style={{ fontWeight: '600', color: currentTheme.text }}>
                      {vehicle.fuel || 75}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailView(vehicle.id);
                  }}
                  style={{
                    background: currentTheme.primary,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vehicle Detail View Modal */}
      {showDetailView && (
        <VehicleDetailView
          vehicleId={showDetailView}
          onClose={() => setShowDetailView(null)}
          currentTheme={currentTheme}
        />
      )}

      {/* OBD2 Connection Modal */}
      {showOBD2Connection && (
        <OBD2RealTimeConnection
          vehicleId={showOBD2Connection}
          currentTheme={currentTheme}
          onClose={() => setShowOBD2Connection(null)}
        />
      )}
    </div>
  );
};

export default SimpleVehicleShowroom;
