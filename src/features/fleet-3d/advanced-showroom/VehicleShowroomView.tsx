import React from "react";

import VehicleShowroomSelector from "./VehicleShowroomSelector";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  status: string;
  reserved: boolean;
}
interface VehicleShowroomViewProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  currentTheme: any;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  setShowReservationModal: (show: boolean) => void;
}
const VehicleShowroomView: React.FC<VehicleShowroomViewProps> = ({
  vehicles,
  selectedVehicle,
  currentTheme,
  setSelectedVehicle,
  setShowReservationModal
}) => {
  const availableVehicles = vehicles.filter(
    (v) => (v.status === 'active' || v.status === 'idle') && !v.reserved
  );
  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);
    } else {
      setSelectedVehicle(null);
    }
  };

  const handleReservation = () => {
    if (selectedVehicle) {
      setShowReservationModal(true);
    } else {
      alert('Please select a vehicle first');
    }
  };

  return (
    <div
      style={{
        height: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Compact header */}
      <div style={{ flexShrink: 0, marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', color: currentTheme.text }}>
          Vehicle Showroom
        </h2>
      </div>

      {/* Compact vehicle selector */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          padding: '12px',
          background: currentTheme.surface,
          borderRadius: '8px',
          border: `1px solid ${currentTheme.border}`
        }}
      >
        <label
          style={{
            fontWeight: '600',
            color: currentTheme.text,
            fontSize: '14px',
            minWidth: 'fit-content'
          }}
        >
          Vehicle:
        </label>
        <select
          value={selectedVehicle?.id || ''}
          onChange={(e) => handleVehicleSelect(e.target.value)}
          aria-label="Select vehicle for detailed view"
          style={{
            flex: 1,
            padding: '8px',
            background: currentTheme.bg,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="">Choose a vehicle</option>
          {availableVehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.id} - {vehicle.make} {vehicle.model} ({vehicle.year})
            </option>
          ))}
        </select>

        {selectedVehicle && (
          <button
            onClick={handleReservation}
            style={{
              padding: '8px 16px',
              background: currentTheme.primary,
              color: currentTheme.primaryText,
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Reserve Vehicle
          </button>
        )}
      </div>

      {/* Vehicle showroom content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <VehicleShowroomSelector
          vehicles={availableVehicles}
          selectedVehicle={selectedVehicle}
          onSelectVehicle={handleVehicleSelect}
          theme={currentTheme}
        />
      </div>
    </div>
  );
};

export default VehicleShowroomView;