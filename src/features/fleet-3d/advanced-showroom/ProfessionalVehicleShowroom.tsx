import React, { useState, useEffect, useCallback } from 'react';
import './ProfessionalShowroom.css';

interface ParkingLocation {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
}

export type VehicleStatus = 'available' | 'locked' | 'maintenance' | 'out-of-position' | 'reserved' | 'active' | 'idle' | 'emergency' | 'charging' | 'offline';

interface ShowroomVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  plate: string;
  vin?: string;
  seatingCapacity: number;
  odometerMiles: number;
  fuelLevel: number;
  parkingLocation: ParkingLocation;
  status: VehicleStatus;
  lockReason?: string;
  image?: string;
  type: 'Sedan' | 'SUV' | 'Truck' | 'Van' | 'Electric' | 'Hybrid' | 'Bus' | 'Emergency' | 'Specialty';
  features?: string[];
  mpgCity?: number;
  mpgHighway?: number;
  color?: string;
  lastService?: string;
  nextServiceDue?: string;
  realImage?: string;
}

interface ProfessionalVehicleShowroomProps {
  vehicles?: ShowroomVehicle[];
  currentTheme?: any;
  onVehicleSelect?: (vehicle: ShowroomVehicle) => void;
  onVehicleCheckout?: (vehicle: ShowroomVehicle) => void;
  userRole?: 'driver' | 'admin';
}

// Real vehicle images from public sources
const vehicleImages: { [key: string]: string } = {
  "Ford F-150": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop",
  "Chevrolet Tahoe": "https://images.unsplash.com/photo-1519641766812-1c2e5e1c95e4?w=800&h=600&fit=crop",
  "Honda Accord": "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?w=800&h=600&fit=crop",
  "Toyota Camry": "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop",
  "Dodge Charger": "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=600&fit=crop",
  "Jeep Wrangler": "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&h=600&fit=crop",
  "Tesla Model 3": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop",
  "Mercedes-Benz Sprinter": "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&h=600&fit=crop",
  "GMC Sierra": "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&h=600&fit=crop",
  "default": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop"
};

// Enhanced sample vehicles with real images
const defaultVehicles: ShowroomVehicle[] = [
  {
    id: 'FL-001',
    year: 2023,
    make: 'Ford',
    model: 'F-150',
    trim: 'XLT',
    plate: 'FLT-2301',
    vin: '1FTFW1ET5DFC10312',
    seatingCapacity: 5,
    odometerMiles: 15234,
    fuelLevel: 85,
    parkingLocation: {
      name: 'Tallahassee Motor Pool',
      lat: 30.4383,
      lng: -84.2807,
      address: '2540 Shumard Oak Blvd',
      city: 'Tallahassee',
      state: 'FL'
    },
    status: 'available',
    type: 'Truck',
    features: ['4WD', 'Towing Package', 'Bluetooth', 'Backup Camera', 'Apple CarPlay'],
    mpgCity: 20,
    mpgHighway: 24,
    color: 'Oxford White',
    lastService: '2024-01-15',
    nextServiceDue: '2024-04-15',
    realImage: vehicleImages['Ford F-150']
  },
  {
    id: 'FL-002',
    year: 2023,
    make: 'Chevrolet',
    model: 'Tahoe',
    trim: 'LT',
    plate: 'FLT-2302',
    vin: '1GNSKCKC4NR226128',
    seatingCapacity: 8,
    odometerMiles: 22156,
    fuelLevel: 62,
    parkingLocation: {
      name: 'Miami Field Office',
      lat: 25.7617,
      lng: -80.1918,
      address: '111 NW 1st Street',
      city: 'Miami',
      state: 'FL'
    },
    status: 'available',
    type: 'SUV',
    features: ['3rd Row Seating', '4WD', 'Navigation', 'Leather Seats', 'Rear Entertainment'],
    mpgCity: 16,
    mpgHighway: 20,
    color: 'Summit White',
    lastService: '2024-01-20',
    nextServiceDue: '2024-04-20',
    realImage: vehicleImages['Chevrolet Tahoe']
  },
  {
    id: 'FL-003',
    year: 2024,
    make: 'Honda',
    model: 'Accord',
    trim: 'Hybrid',
    plate: 'FLT-2403',
    vin: '1HGCV1F94NA012649',
    seatingCapacity: 5,
    odometerMiles: 8432,
    fuelLevel: 95,
    parkingLocation: {
      name: 'Orlando Regional Hub',
      lat: 28.5383,
      lng: -81.3792,
      address: '400 S Orange Ave',
      city: 'Orlando',
      state: 'FL'
    },
    status: 'available',
    type: 'Hybrid',
    features: ['Honda Sensing', 'Wireless Charging', 'Bose Audio', 'Sunroof', 'Lane Keeping Assist'],
    mpgCity: 48,
    mpgHighway: 47,
    color: 'Platinum White Pearl',
    lastService: '2024-01-10',
    nextServiceDue: '2024-07-10',
    realImage: vehicleImages['Honda Accord']
  },
  {
    id: 'FL-004',
    year: 2023,
    make: 'Toyota',
    model: 'Camry',
    plate: 'FLT-2304',
    vin: '4T1B11HK5JU588742',
    seatingCapacity: 5,
    odometerMiles: 18765,
    fuelLevel: 45,
    parkingLocation: {
      name: 'Jacksonville Branch',
      lat: 30.3322,
      lng: -81.6557,
      address: '214 N Hogan St',
      city: 'Jacksonville',
      state: 'FL'
    },
    status: 'maintenance',
    lockReason: 'Scheduled oil change and tire rotation',
    type: 'Sedan',
    features: ['Toyota Safety Sense', 'JBL Audio', 'Wireless CarPlay', 'Blind Spot Monitor'],
    mpgCity: 28,
    mpgHighway: 39,
    color: 'Celestial Silver Metallic',
    lastService: '2023-11-15',
    nextServiceDue: '2024-02-15',
    realImage: vehicleImages['Toyota Camry']
  },
  {
    id: 'FL-005',
    year: 2023,
    make: 'Dodge',
    model: 'Charger',
    trim: 'Pursuit',
    plate: 'FHP-001',
    vin: '2C3CDXKT8NH113276',
    seatingCapacity: 5,
    odometerMiles: 42318,
    fuelLevel: 72,
    parkingLocation: {
      name: 'Highway Patrol Station',
      lat: 27.9506,
      lng: -82.4572,
      address: '4115 N Lois Ave',
      city: 'Tampa',
      state: 'FL'
    },
    status: 'emergency',
    type: 'Emergency',
    features: ['Police Package', 'Heavy Duty Brakes', 'Spotlight', 'Push Bar', 'Emergency Lights'],
    mpgCity: 19,
    mpgHighway: 31,
    color: 'Black',
    lastService: '2024-01-25',
    nextServiceDue: '2024-03-25',
    realImage: vehicleImages['Dodge Charger']
  },
  {
    id: 'FL-006',
    year: 2024,
    make: 'Tesla',
    model: 'Model 3',
    trim: 'Long Range',
    plate: 'FLT-2406',
    vin: '5YJ3E1EA6NF123456',
    seatingCapacity: 5,
    odometerMiles: 3421,
    fuelLevel: 88,
    parkingLocation: {
      name: 'Sustainable Fleet Center',
      lat: 26.1224,
      lng: -80.1373,
      address: '301 E Las Olas Blvd',
      city: 'Fort Lauderdale',
      state: 'FL'
    },
    status: 'charging',
    lockReason: 'Charging - 88% complete',
    type: 'Electric',
    features: ['Autopilot', 'Premium Audio', 'Glass Roof', 'Full Self-Driving Capability'],
    mpgCity: 142,
    mpgHighway: 123,
    color: 'Pearl White',
    lastService: '2024-01-05',
    nextServiceDue: '2025-01-05',
    realImage: vehicleImages['Tesla Model 3']
  }
];

const ProfessionalVehicleShowroom: React.FC<ProfessionalVehicleShowroomProps> = ({
  vehicles = defaultVehicles,
  currentTheme = {
    primary: '#1e40af',
    secondary: '#3b82f6',
    surface: '#ffffff',
    bg: '#f9fafb',
    text: '#111827',
    textMuted: '#1f2937',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4'
  },
  onVehicleSelect = () => {},
  onVehicleCheckout,
  userRole = 'driver'
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<ShowroomVehicle>(vehicles[0]);
  const [viewMode, setViewMode] = useState<'gallery' | 'list' | 'map'>('gallery');
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});

  // Filter vehicles based on status and search
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesFilter = filter === 'all' || vehicle.status === filter;
    const matchesSearch = searchTerm === '' ||
      `${vehicle.make} ${vehicle.model} ${vehicle.plate}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleVehicleSelect = (vehicle: ShowroomVehicle) => {
    setSelectedVehicle(vehicle);
    onVehicleSelect(vehicle);
  };

  const handleCheckout = () => {
    if (selectedVehicle.status !== 'available') {
      alert(`This vehicle is currently ${selectedVehicle.status}. ${selectedVehicle.lockReason || ''}`);
      return;
    }
    if (onVehicleCheckout) {
      onVehicleCheckout(selectedVehicle);
    }
    alert(`Successfully reserved ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`);
  };

  const getStatusColor = (status: VehicleStatus) => {
    const colors = {
      "available": "#10b981",
      "active": "#10b981",
      "idle": "#374151",
      "maintenance": "#f59e0b",
      "emergency": "#ef4444",
      "charging": "#3b82f6",
      "reserved": "#8b5cf6",
      "locked": "#ef4444",
      "out-of-position": "#f59e0b",
      "offline": "#374151"
    };
    return colors[status] || '#374151';
  };

  const getStatusIcon = (status: VehicleStatus) => {
    const icons = {
      "available": "✅",
      "active": "🚗",
      "idle": "⏸️",
      "maintenance": "🔧",
      "emergency": "🚨",
      "charging": "🔌",
      "reserved": "📅",
      "locked": "🔒",
      "out-of-position": "📍",
      "offline": "📴"
    };
    return icons[status] || '❓';
  };

  return (
    <div className="professional-showroom">
      {/* Header */}
      <div className="showroom-header">
        <div className="header-content">
          <h1 className="showroom-title">Fleet Vehicle Showroom</h1>
          <p className="showroom-subtitle">
            Browse and reserve vehicles from our modern fleet
          </p>
        </div>

        {/* Controls */}
        <div className="showroom-controls">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({vehicles.length})
            </button>
            <button
              className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
              onClick={() => setFilter('available')}
            >
              Available ({vehicles.filter(v => v.status === 'available').length})
            </button>
            <button
              className={`filter-btn ${filter === 'maintenance' ? 'active' : ''}`}
              onClick={() => setFilter('maintenance')}
            >
              Maintenance ({vehicles.filter(v => v.status === 'maintenance').length})
            </button>
          </div>

          <div className="view-mode-toggle">
            <button
              className={`view-btn ${viewMode === 'gallery' ? 'active' : ''}`}
              onClick={() => setViewMode('gallery')}
              title="Gallery View"
            >
              <span>🖼️</span>
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <span>📋</span>
            </button>
            <button
              className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
              title="Map View"
            >
              <span>🗺️</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="showroom-content">
        {/* Vehicle gallery/List */}
        <div className="vehicles-container">
          {viewMode === 'gallery' && (
            <div className="vehicle-gallery">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`vehicle-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                  onClick={() => handleVehicleSelect(vehicle)}
                >
                  <div className="vehicle-image-container">
                    <img
                      src={vehicle.realImage || vehicleImages.default}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="vehicle-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = vehicleImages.default;
                      }}
                    />
                    <div className="vehicle-status-badge" style={{ backgroundColor: getStatusColor(vehicle.status) }}>
                      {getStatusIcon(vehicle.status)} {vehicle.status}
                    </div>
                  </div>

                  <div className="vehicle-card-content">
                    <h3 className="vehicle-name">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="vehicle-trim">{vehicle.trim}</p>

                    <div className="vehicle-stats">
                      <div className="stat">
                        <span className="stat-icon">⛽</span>
                        <span>{vehicle.fuelLevel}%</span>
                      </div>
                      <div className="stat">
                        <span className="stat-icon">🛣️</span>
                        <span>{vehicle.odometerMiles.toLocaleString()} mi</span>
                      </div>
                      <div className="stat">
                        <span className="stat-icon">👥</span>
                        <span>{vehicle.seatingCapacity} seats</span>
                      </div>
                    </div>

                    <div className="vehicle-location">
                      📍 {vehicle.parkingLocation.name}
                    </div>

                    <button
                      className={`select-vehicle-btn ${vehicle.status === 'available' ? 'available' : 'unavailable'}`}
                      disabled={vehicle.status !== 'available'}
                    >
                      {vehicle.status === 'available' ? 'Select Vehicle' : vehicle.status}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="vehicle-list">
              <table className="vehicle-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Mileage</th>
                    <th>Fuel</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className={selectedVehicle?.id === vehicle.id ? 'selected' : ''}
                      onClick={() => handleVehicleSelect(vehicle)}
                    >
                      <td>
                        <div className="vehicle-info">
                          <img
                            src={vehicle.realImage || vehicleImages.default}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="vehicle-thumb"
                          />
                          <div>
                            <div className="vehicle-name">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </div>
                            <div className="vehicle-plate">{vehicle.plate}</div>
                          </div>
                        </div>
                      </td>
                      <td>{vehicle.type}</td>
                      <td>{vehicle.parkingLocation.name}</td>
                      <td>{vehicle.odometerMiles.toLocaleString()} mi</td>
                      <td>{vehicle.fuelLevel}%</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(vehicle.status) }}
                        >
                          {vehicle.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-btn"
                          disabled={vehicle.status !== 'available'}
                        >
                          {vehicle.status === 'available' ? 'Reserve' : 'Unavailable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'map' && (
            <div className="vehicle-map">
              <div className="map-placeholder">
                <h3>Fleet Vehicle Locations</h3>
                <div className="location-list">
                  {[...new Set(vehicles.map(v => v.parkingLocation.name))].map((location) => {
                    const vehiclesAtLocation = vehicles.filter(v => v.parkingLocation.name === location);
                    return (
                      <div key={location} className="location-item">
                        <h4>{location}</h4>
                        <p>{vehiclesAtLocation.length} vehicles</p>
                        <div className="location-vehicles">
                          {vehiclesAtLocation.map(v => (
                            <span
                              key={v.id}
                              className="vehicle-dot"
                              style={{ backgroundColor: getStatusColor(v.status) }}
                              title={`${v.make} ${v.model} - ${v.status}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected vehicle details */}
        {selectedVehicle && (
          <div className="vehicle-details-panel">
            <div className="details-image-container">
              <img
                src={selectedVehicle.realImage || vehicleImages.default}
                alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                className="details-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = vehicleImages.default;
                }}
              />
              <div className="image-overlay">
                <span className="vehicle-id">{selectedVehicle.plate}</span>
              </div>
            </div>

            <div className="details-content">
              <h2 className="details-title">
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
              </h2>
              <p className="details-trim">{selectedVehicle.trim}</p>

              <div className="details-status">
                <span
                  className="status-indicator"
                  style={{ backgroundColor: getStatusColor(selectedVehicle.status) }}
                >
                  {getStatusIcon(selectedVehicle.status)} {selectedVehicle.status.toUpperCase()}
                </span>
                {selectedVehicle.lockReason && (
                  <p className="lock-reason">⚠️ {selectedVehicle.lockReason}</p>
                )}
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">{selectedVehicle.type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Color</span>
                  <span className="detail-value">{selectedVehicle.color || 'Standard'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Seating</span>
                  <span className="detail-value">{selectedVehicle.seatingCapacity} passengers</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Mileage</span>
                  <span className="detail-value">{selectedVehicle.odometerMiles.toLocaleString()} miles</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Fuel Level</span>
                  <span className="detail-value">{selectedVehicle.fuelLevel}%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">MPG</span>
                  <span className="detail-value">
                    {selectedVehicle.mpgCity || 'N/A'} city / {selectedVehicle.mpgHighway || 'N/A'} hwy
                  </span>
                </div>
              </div>

              {selectedVehicle.features && selectedVehicle.features.length > 0 && (
                <div className="vehicle-features">
                  <h3>Features</h3>
                  <div className="features-list">
                    {selectedVehicle.features.map((feature, index) => (
                      <span key={index} className="feature-tag">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="location-info">
                <h3>Current Location</h3>
                <div className="location-details">
                  <p className="location-name">{selectedVehicle.parkingLocation.name}</p>
                  {selectedVehicle.parkingLocation.address && (
                    <p className="location-address">
                      {selectedVehicle.parkingLocation.address}<br />
                      {selectedVehicle.parkingLocation.city}, {selectedVehicle.parkingLocation.state}
                    </p>
                  )}
                </div>
              </div>

              {selectedVehicle.lastService && (
                <div className="service-info">
                  <h3>Service History</h3>
                  <p>Last Service: {new Date(selectedVehicle.lastService).toLocaleDateString()}</p>
                  {selectedVehicle.nextServiceDue && (
                    <p>Next Service Due: {new Date(selectedVehicle.nextServiceDue).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              <button
                className={`checkout-btn ${selectedVehicle.status === 'available' ? 'primary' : 'disabled'}`}
                onClick={handleCheckout}
                disabled={selectedVehicle.status !== 'available'}
              >
                {selectedVehicle.status === 'available'
                  ? '🚗 Reserve this Vehicle'
                  : `🔒 ${selectedVehicle.status.charAt(0).toUpperCase() + selectedVehicle.status.slice(1)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalVehicleShowroom;
