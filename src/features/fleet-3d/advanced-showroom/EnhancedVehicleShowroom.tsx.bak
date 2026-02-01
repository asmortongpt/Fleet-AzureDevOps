import { ChevronLeft, ChevronRight, Lock, Fuel, MapPin, Users, Gauge } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import './showroom.css';

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  plate: string;
  vin: string;
  seatingCapacity: number;
  odometerMiles: number;
  fuelLevel: number;
  parkingLocation: {
    name: string;
    lat: number;
    lng: number;
    address: string;
  };
  status: 'available' | 'maintenance' | 'reserved' | 'out-of-position';
  lockReason?: string;
  image: string;
}
const fleetVehicles: Vehicle[] = [
  {
    id: 'toyota-camry-001',
    year: 2024,
    make: 'Toyota',
    model: 'Camry Hybrid',
    trim: 'LE',
    plate: 'DCF-001',
    vin: '4T1G11AK8MU123456',
    seatingCapacity: 5,
    odometerMiles: 12521,
    fuelLevel: 78,
    parkingLocation: {
      name: 'DCF Headquarters',
      lat: 30.4383,
      lng: -84.2807,
      address: '1317 Winewood Blvd, Tallahassee, FL 32399'
    },
    status: 'available',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'ford-explorer-002',
    year: 2023,
    make: 'Ford',
    model: 'Explorer',
    trim: 'Limited',
    plate: 'DCF-002',
    vin: '1FM5K8D86LGA12345',
    seatingCapacity: 7,
    odometerMiles: 24891,
    fuelLevel: 42,
    parkingLocation: {
      name: 'DCF North Region',
      lat: 30.5052,
      lng: -84.2533,
      address: '2383 Phillips Rd, Tallahassee, FL 32308'
    },
    status: 'maintenance',
    lockReason: 'Scheduled maintenance - Work order #WO-4812',
    image: 'https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'chevrolet-tahoe-003',
    year: 2024,
    make: 'Chevrolet',
    model: 'Tahoe',
    trim: 'LT',
    plate: 'DCF-003',
    vin: '1GNSKCKD5PR123456',
    seatingCapacity: 8,
    odometerMiles: 8750,
    fuelLevel: 89,
    parkingLocation: {
      name: 'DCF Central Office',
      lat: 30.4518,
      lng: -84.2721,
      address: '2415 N Monroe St, Tallahassee, FL 32303'
    },
    status: 'available',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'honda-accord-004',
    year: 2023,
    make: 'Honda',
    model: 'Accord',
    trim: 'Sport',
    plate: 'DCF-004',
    vin: '1HGCV1F31PA123456',
    seatingCapacity: 5,
    odometerMiles: 15632,
    fuelLevel: 23,
    parkingLocation: {
      name: 'DCF Suncoast Region',
      lat: 27.9659,
      lng: -82.8001,
      address: '9393 N Florida Ave, Tampa, FL 33612'
    },
    status: 'reserved',
    lockReason: 'Reserved for regional Director meeting',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'nissan-altima-005',
    year: 2024,
    make: 'Nissan',
    model: 'Altima',
    trim: 'SR',
    plate: 'DCF-005',
    vin: '1N4BL4DV0PC123456',
    seatingCapacity: 5,
    odometerMiles: 9234,
    fuelLevel: 95,
    parkingLocation: {
      name: 'DCF Southeast Region',
      lat: 25.7617,
      lng: -80.1918,
      address: '401 NW 2nd Ave, Miami, FL 33128'
    },
    status: 'available',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80'
  }
];

const EnhancedVehicleShowroom: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const currentVehicle = fleetVehicles[currentIndex];

  const nextVehicle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % fleetVehicles.length);
      setIsAnimating(false);
    }, 300);
  };

  const prevVehicle = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + fleetVehicles.length) % fleetVehicles.length);
      setIsAnimating(false);
    }, 300);
  };

  const selectVehicle = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 300);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') prevVehicle();
      if (event.key === 'ArrowRight') nextVehicle();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, isAnimating]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'status-available';
      case 'maintenance':
        return 'status-maintenance';
      case 'reserved':
        return 'status-reserved';
      case 'out-of-position':
        return 'status-out';
      default:
        return '';
    }
  };

  return (
    <div className="vehicle-showroom">
      {/* Background overlay */}
      <div className="showroom-overlay" />

      {/* Content */}
      <div className="showroom-content">
        {/* Header */}
        <div className="showroom-header">
          <h1 className="showroom-title">DCF Fleet Management</h1>
          <p className="showroom-subtitle">
            Select a vehicle from the state fleet, check availability and operational status before checkout.
          </p>
        </div>

        {/* Navigation controls */}
        <div className="nav-controls">
          <button onClick={prevVehicle} className="nav-button" aria-label="Previous vehicle">
            <ChevronLeft className="nav-icon" />
          </button>

          {/* Vehicle indicators */}
          <div className="vehicle-indicators">
            {fleetVehicles.map((vehicle, index) => (
              <button
                key={vehicle.id}
                onClick={() => selectVehicle(index)}
                className={`indicator ${index === currentIndex ? 'indicator-active' : ''}`}
                title={`${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.plate}`}
                aria-label={`Select ${vehicle.make} ${vehicle.model}`}
              />
            ))}
          </div>

          <button onClick={nextVehicle} className="nav-button" aria-label="Next vehicle">
            <ChevronRight className="nav-icon" />
          </button>
        </div>
        {/* Main vehicle display */}
        <div className="vehicle-display">
          {/* Vehicle card */}
          <div className={`vehicle-card ${isAnimating ? 'card-animating' : ''}`}>
            {/* Status badge */}
            {currentVehicle.status !== 'available' && (
              <div className={`status-badge ${getStatusColor(currentVehicle.status)}`}>
                <Lock className="status-icon" />
                {currentVehicle.status.charAt(0).toUpperCase() +
                  currentVehicle.status.slice(1).replace('-', ' ')}
              </div>
            )}
            {/* Vehicle image */}
            <div className="vehicle-image-container">
              <img
                src={currentVehicle.image}
                alt={`${currentVehicle.year} ${currentVehicle.make} ${currentVehicle.model}`}
                className={`vehicle-image ${currentVehicle.status !== 'available' ? 'image-locked' : ''}`}
              />

              {/* Glow effect */}
              {currentVehicle.status === 'available' && <div className="image-glow" />}
            </div>

            {/* Vehicle info */}
            <div className="vehicle-info">
              <h2 className="vehicle-name">
                {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
              </h2>
              <p className="vehicle-trim">{currentVehicle.trim}</p>

              {/* Stats grid */}
              <div className="stats-grid">
                <div className="stat-item">
                  <Gauge className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">
                      {currentVehicle.odometerMiles.toLocaleString()}
                    </span>
                    <span className="stat-label">Miles</span>
                  </div>
                </div>

                <div className="stat-item">
                  <Fuel className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{currentVehicle.fuelLevel}%</span>
                    <span className="stat-label">Fuel</span>
                  </div>
                </div>

                <div className="stat-item">
                  <Users className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{currentVehicle.seatingCapacity}</span>
                    <span className="stat-label">Seats</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="location-info">
                <MapPin className="location-icon" />
                <div className="location-content">
                  <p className="location-name">{currentVehicle.parkingLocation.name}</p>
                  <p className="location-address">{currentVehicle.parkingLocation.address}</p>
                </div>
              </div>
              {/* Vehicle details */}
              <div className="vehicle-details">
                <div className="detail-row">
                  <span className="detail-label">License Plate:</span>
                  <span className="detail-value">{currentVehicle.plate}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">VIN:</span>
                  <span className="detail-value">{currentVehicle.vin}</span>
                </div>
              </div>
              {/* Action button */}
              <button
                className={`action-button ${
                  currentVehicle.status === 'available' ? 'button-available' : 'button-locked'
                }`}
                disabled={currentVehicle.status !== 'available'}
              >
                {currentVehicle.status === 'available'
                  ? 'Check Out Vehicle'
                  : currentVehicle.lockReason || 'Unavailable'}
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="keyboard-hint">Use ← → arrow keys to navigate</div>
      </div>
    </div>
  );
};

export default EnhancedVehicleShowroom;