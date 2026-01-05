import { ChevronLeft, ChevronRight, Lock, Fuel, MapPin, Users, Gauge, Settings } from 'lucide-react';
import React, { useState, useEffect } from "react";

// Configuration types
interface ShowroomConfig {
  theme: 'light' | 'dark' | 'auto';
  viewMode: 'grid' | 'carousel' | 'list';
  showDetails: boolean;
  imageSize: 'small' | 'medium' | 'large' | 'xl';
  animationsEnabled: boolean;
  showStats: boolean;
  showLocation: boolean;
  primaryColor: string;
  accentColor: string;
  textSize: 'small' | 'medium' | 'large';
  cardStyle: 'minimal' | 'detailed' | 'compact';
}

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
  color?: string;
  price?: number;
  mpg?: string;
  features?: string[];
}

// Theme configurations
const themes = {
  light: {
    bg: '#ffffff',
    surface: '#f8f9fa',
    cardBg: '#ffffff',
    text: '#212529',
    textMuted: '#1f2937',
    border: '#dee2e6',
    primary: '#0066cc',
    secondary: '#374151',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    shadowCard: '0 2px 8px rgba(0,0,0,0.1)',
    shadowHover: '0 4px 16px rgba(0,0,0,0.15)'
  },
  dark: {
    bg: '#0f1419',
    surface: '#1a1f2e',
    cardBg: 'rgba(255,255,255,0.05)',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.6)',
    border: 'rgba(255,255,255,0.1)',
    primary: '#00b4d8',
    secondary: '#374151',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    shadowCard: '0 4px 12px rgba(0,0,0,0.4)',
    shadowHover: '0 8px 24px rgba(0,0,0,0.6)'
  }
};

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
    color: 'Pearl White',
    price: 28500,
    mpg: '51/53',
    features: ['Lane Assist', 'Adaptive Cruise', 'Apple CarPlay', 'Backup Camera'],
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
    color: 'Metallic Blue',
    price: 42000,
    mpg: '21/28',
    features: ['4WD', 'Third Row', 'Panoramic Roof', 'Wireless Charging'],
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
    color: 'Jet Black',
    price: 54000,
    mpg: '16/20',
    features: ['4WD', 'Towing Package', 'Premium Audio', 'Navigation'],
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
    color: 'Platinum White',
    price: 32000,
    mpg: '30/38',
    features: ['Honda Sensing', 'Sport Mode', 'Heated Seats', 'Turbo Engine'],
    parkingLocation: {
      name: 'DCF Suncoast Region',
      lat: 27.9659,
      lng: -82.8001,
      address: '9393 N Florida Ave, Tampa, FL 33612'
    },
    status: 'reserved',
    lockReason: 'Reserved for regional Director meeting',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop&q=80'
  }
];

const ConfigurableVehicleShowroom: React.FC = () => {
  // State for configuration
  const [config, setConfig] = useState<ShowroomConfig>({
    theme: 'auto',
    viewMode: 'carousel',
    showDetails: true,
    imageSize: 'large',
    animationsEnabled: true,
    showStats: true,
    showLocation: true,
    primaryColor: '#0066cc',
    accentColor: '#00b4d8',
    textSize: 'medium',
    cardStyle: 'detailed'
  });

  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Determine current theme based on config
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    if (config.theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setActualTheme(isDark ? 'dark' : 'light');
    } else {
      setActualTheme(config.theme);
    }
  }, [config.theme]);

  const currentTheme = themes[actualTheme];
  const currentVehicle = fleetVehicles[currentIndex];

  // Navigation functions
  const nextVehicle = () => {
    if (isAnimating && config.animationsEnabled) return;
    if (config.animationsEnabled) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % fleetVehicles.length);
        setIsAnimating(false);
      }, 300);
    } else {
      setCurrentIndex((prev) => (prev + 1) % fleetVehicles.length);
    }
  };

  const prevVehicle = () => {
    if (isAnimating && config.animationsEnabled) return;
    if (config.animationsEnabled) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + fleetVehicles.length) % fleetVehicles.length);
        setIsAnimating(false);
      }, 300);
    } else {
      setCurrentIndex((prev) => (prev - 1 + fleetVehicles.length) % fleetVehicles.length);
    }
  };

  const selectVehicle = (index: number) => {
    if (index === currentIndex) return;
    setCurrentIndex(index);
  };

  // Image size calculations
  const imageSizes = {
    small: { height: '250px', width: '100%' },
    medium: { height: '350px', width: '100%' },
    large: { height: '450px', width: '100%' },
    xl: { height: '550px', width: '100%' }
  };

  const textSizes = {
    small: { title: '1.5rem', subtitle: '0.875rem', body: '0.8rem' },
    medium: { title: '2rem', subtitle: '1rem', body: '0.875rem' },
    large: { title: '2.5rem', subtitle: '1.125rem', body: '1rem' }
  };

  const updateConfig = (key: keyof ShowroomConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: currentTheme.success,
      maintenance: currentTheme.warning,
      reserved: currentTheme.warning,
      'out-of-position': currentTheme.danger
    };
    return colors[status] || currentTheme.secondary;
  };

  // Render configuration panel
  const renderConfigPanel = () => (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: showConfigPanel ? 0 : '-400px',
        width: '400px',
        height: '100vh',
        background: currentTheme.surface,
        borderLeft: `1px solid ${currentTheme.border}`,
        transition: 'right 0.3s ease',
        zIndex: 1000,
        padding: '24px',
        overflowY: 'auto',
        boxShadow: showConfigPanel ? '-4px 0 12px rgba(0,0,0,0.1)' : 'none'
      }}
    >
      <h3 style={{ color: currentTheme.text, marginBottom: '24px' }}>Showroom Configuration</h3>

      {/* Theme selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: currentTheme.text, fontSize: '14px', fontWeight: '600' }}>
          Theme
        </label>
        <select
          value={config.theme}
          onChange={(e) => updateConfig('theme', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            marginTop: '8px',
            background: currentTheme.bg,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px'
          }}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto (System)</option>
        </select>
      </div>

      {/* View mode */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: currentTheme.text, fontSize: '14px', fontWeight: '600' }}>
          View Mode
        </label>
        <select
          value={config.viewMode}
          onChange={(e) => updateConfig('viewMode', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            marginTop: '8px',
            background: currentTheme.bg,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px'
          }}
        >
          <option value="carousel">Carousel</option>
          <option value="grid">Grid</option>
          <option value="list">List</option>
        </select>
      </div>

      {/* Image size */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: currentTheme.text, fontSize: '14px', fontWeight: '600' }}>
          Image Size
        </label>
        <select
          value={config.imageSize}
          onChange={(e) => updateConfig('imageSize', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            marginTop: '8px',
            background: currentTheme.bg,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px'
          }}
        >
          <option value="small">Small (250px)</option>
          <option value="medium">Medium (350px)</option>
          <option value="large">Large (450px)</option>
          <option value="xl">Extra Large (550px)</option>
        </select>
      </div>

      {/* Text size */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: currentTheme.text, fontSize: '14px', fontWeight: '600' }}>
          Text Size
        </label>
        <select
          value={config.textSize}
          onChange={(e) => updateConfig('textSize', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            marginTop: '8px',
            background: currentTheme.bg,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px'
          }}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* Card style */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: currentTheme.text, fontSize: '14px', fontWeight: '600' }}>
          Card Style
        </label>
        <select
          value={config.cardStyle}
          onChange={(e) => updateConfig('cardStyle', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            marginTop: '8px',
            background: currentTheme.bg,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '4px'
          }}
        >
          <option value="minimal">Minimal</option>
          <option value="detailed">Detailed</option>
          <option value="compact">Compact</option>
        </select>
      </div>

      {/* Toggle options */}
      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: currentTheme.text,
            marginBottom: '12px'
          }}
        >
          <input
            type="checkbox"
            checked={config.animationsEnabled}
            onChange={(e) => updateConfig('animationsEnabled', e.target.checked)}
          />
          Enable Animations
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: currentTheme.text,
            marginBottom: '12px'
          }}
        >
          <input
            type="checkbox"
            checked={config.showDetails}
            onChange={(e) => updateConfig('showDetails', e.target.checked)}
          />
          Show Vehicle Details
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: currentTheme.text,
            marginBottom: '12px'
          }}
        >
          <input
            type="checkbox"
            checked={config.showStats}
            onChange={(e) => updateConfig('showStats', e.target.checked)}
          />
          Show Statistics
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: currentTheme.text
          }}
        >
          <input
            type="checkbox"
            checked={config.showLocation}
            onChange={(e) => updateConfig('showLocation', e.target.checked)}
          />
          Show Location Info
        </label>
      </div>

      {/* Primary color */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: currentTheme.text, fontSize: '14px', fontWeight: '600' }}>
          Primary Color
        </label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input
            type="color"
            value={config.primaryColor}
            onChange={(e) => updateConfig('primaryColor', e.target.value)}
            style={{
              width: '50px',
              height: '35px',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px'
            }}
          />
          <input
            type="text"
            value={config.primaryColor}
            onChange={(e) => updateConfig('primaryColor', e.target.value)}
            style={{
              flex: 1,
              padding: '8px',
              background: currentTheme.bg,
              color: currentTheme.text,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* Accent color */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: currentTheme.text, fontSize: '14px', fontWeight: '600' }}>
          Accent Color
        </label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input
            type="color"
            value={config.accentColor}
            onChange={(e) => updateConfig('accentColor', e.target.value)}
            style={{
              width: '50px',
              height: '35px',
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px'
            }}
          />
          <input
            type="text"
            value={config.accentColor}
            onChange={(e) => updateConfig('accentColor', e.target.value)}
            style={{
              flex: 1,
              padding: '8px',
              background: currentTheme.bg,
              color: currentTheme.text,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '4px'
            }}
          />
        </div>
      </div>
    </div>
  );

  // Render carousel view
  const renderCarouselView = () => (
    <div
      style={{
        background: currentTheme.bg,
        minHeight: '100vh',
        padding: '32px',
        transition: config.animationsEnabled ? 'all 0.3s ease' : 'none'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: textSizes[config.textSize].title,
            color: currentTheme.text,
            marginBottom: '8px'
          }}
        >
          DCF Fleet Vehicle Showroom
        </h1>
        <p
          style={{
            fontSize: textSizes[config.textSize].subtitle,
            color: currentTheme.textMuted
          }}
        >
          Browse our available fleet vehicles
        </p>
      </div>

      {/* Navigation controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '32px'
        }}
      >
        <button
          onClick={prevVehicle}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: config.animationsEnabled ? 'all 0.2s ease' : 'none'
          }}
        >
          <ChevronLeft style={{ color: config.primaryColor }} />
        </button>

        {/* Vehicle indicators */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {fleetVehicles.map((vehicle, index) => (
            <button
              key={vehicle.id}
              onClick={() => selectVehicle(index)}
              style={{
                width: index === currentIndex ? '32px' : '12px',
                height: '12px',
                borderRadius: '6px',
                background: index === currentIndex ? config.primaryColor : currentTheme.border,
                border: 'none',
                cursor: 'pointer',
                transition: config.animationsEnabled ? 'all 0.3s ease' : 'none'
              }}
            />
          ))}
        </div>

        <button
          onClick={nextVehicle}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: currentTheme.surface,
            border: `1px solid ${currentTheme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: config.animationsEnabled ? 'all 0.2s ease' : 'none'
          }}
        >
          <ChevronRight style={{ color: config.primaryColor }} />
        </button>
      </div>

      {/* Vehicle card */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: currentTheme.cardBg,
          borderRadius: '16px',
          overflow: 'hidden',
          border: `1px solid ${currentTheme.border}`,
          boxShadow: currentTheme.shadowCard,
          transition: config.animationsEnabled ? 'all 0.3s ease' : 'none',
          transform: isAnimating && config.animationsEnabled ? 'scale(0.98)' : 'scale(1)',
          opacity: isAnimating && config.animationsEnabled ? 0.8 : 1,
          position: 'relative'
        }}
      >
        {/* Status badge */}
        {currentVehicle.status !== 'available' && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              padding: '8px 16px',
              background: getStatusColor(currentVehicle.status),
              color: 'white',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Lock size={16} />
            {currentVehicle.status.charAt(0).toUpperCase() +
              currentVehicle.status.slice(1).replace('-', ' ')}
          </div>
        )}

        {/* Vehicle image */}
        <div
          style={{
            ...imageSizes[config.imageSize],
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <img
            src={currentVehicle.image}
            alt={`${currentVehicle.year} ${currentVehicle.make} ${currentVehicle.model}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: currentVehicle.status !== 'available' ? 'brightness(0.7)' : 'none',
              transition: config.animationsEnabled ? 'transform 0.3s ease' : 'none'
            }}
          />
        </div>

        {/* Vehicle information */}
        <div style={{ padding: config.cardStyle === 'compact' ? '24px' : '32px' }}>
          <h2
            style={{
              fontSize: textSizes[config.textSize].title,
              color: currentTheme.text,
              marginBottom: '8px'
            }}
          >
            {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
          </h2>

          {config.showDetails && (
            <>
              <p
                style={{
                  fontSize: textSizes[config.textSize].subtitle,
                  color: currentTheme.textMuted,
                  marginBottom: '24px'
                }}
              >
                {currentVehicle.trim} • {currentVehicle.color} • {currentVehicle.mpg} MPG
              </p>

              {/* Stats grid */}
              {config.showStats && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: config.cardStyle === 'minimal' ? '1fr 1fr' : 'repeat(3, 1fr)',
                    gap: '16px',
                    marginBottom: '24px'
                  }}
                >
                  <div
                    style={{
                      padding: '12px',
                      background: currentTheme.surface,
                      borderRadius: '8px',
                      border: `1px solid ${currentTheme.border}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Gauge
                        style={{
                          color: config.accentColor,
                          width: '20px',
                          height: '20px'
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: currentTheme.text
                          }}
                        >
                          {currentVehicle.odometerMiles.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', color: currentTheme.textMuted }}>
                          Miles
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      background: currentTheme.surface,
                      borderRadius: '8px',
                      border: `1px solid ${currentTheme.border}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Fuel
                        style={{
                          color: config.accentColor,
                          width: '20px',
                          height: '20px'
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: currentTheme.text
                          }}
                        >
                          {currentVehicle.fuelLevel}%
                        </div>
                        <div style={{ fontSize: '12px', color: currentTheme.textMuted }}>
                          Fuel
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      background: currentTheme.surface,
                      borderRadius: '8px',
                      border: `1px solid ${currentTheme.border}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users
                        style={{
                          color: config.accentColor,
                          width: '20px',
                          height: '20px'
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: currentTheme.text
                          }}
                        >
                          {currentVehicle.seatingCapacity}
                        </div>
                        <div style={{ fontSize: '12px', color: currentTheme.textMuted }}>
                          Seats
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {config.showLocation && (
                <div
                  style={{
                    padding: '16px',
                    background: currentTheme.surface,
                    borderRadius: '8px',
                    border: `1px solid ${currentTheme.border}`,
                    marginBottom: '24px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <MapPin
                      style={{
                        color: config.accentColor,
                        width: '20px',
                        height: '20px',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: '600',
                          color: currentTheme.text,
                          marginBottom: '4px'
                        }}
                      >
                        {currentVehicle.parkingLocation.name}
                      </div>
                      <div style={{ fontSize: '14px', color: currentTheme.textMuted }}>
                        {currentVehicle.parkingLocation.address}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Features */}
              {currentVehicle.features && config.cardStyle === 'detailed' && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ color: currentTheme.text, marginBottom: '12px' }}>Features</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {currentVehicle.features.map((feature, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '6px 12px',
                          background: currentTheme.surface,
                          borderRadius: '16px',
                          fontSize: '13px',
                          color: currentTheme.text,
                          border: `1px solid ${currentTheme.border}`
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle details */}
              {config.cardStyle !== 'minimal' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '24px'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: currentTheme.textMuted,
                        marginBottom: '4px'
                      }}
                    >
                      License Plate
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: currentTheme.text }}>
                      {currentVehicle.plate}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: currentTheme.textMuted,
                        marginBottom: '4px'
                      }}
                    >
                      VIN
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        color: currentTheme.text
                      }}
                    >
                      {currentVehicle.vin}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action button */}
          <button
            style={{
              width: '100%',
              padding: '14px 24px',
              background:
                currentVehicle.status === 'available'
                  ? config.primaryColor
                  : currentTheme.secondary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: currentVehicle.status === 'available' ? 'pointer' : 'not-allowed',
              opacity: currentVehicle.status === 'available' ? 1 : 0.5,
              transition: config.animationsEnabled ? 'all 0.2s ease' : 'none'
            }}
            disabled={currentVehicle.status !== 'available'}
          >
            {currentVehicle.status === 'available'
              ? 'Reserve This Vehicle'
              : currentVehicle.lockReason || 'Unavailable'}
          </button>
        </div>
      </div>

      {/* Configuration toggle */}
      <button
        onClick={() => setShowConfigPanel(!showConfigPanel)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: config.primaryColor,
          color: 'white',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 999
        }}
      >
        <Settings size={24} />
      </button>

      {/* Configuration panel */}
      {renderConfigPanel()}
    </div>
  );

  // Main render based on view mode
  switch (config.viewMode) {
    case 'carousel':
      return renderCarouselView();
    case 'grid':
      // Grid view implementation would go here
      return renderCarouselView(); // For now, fallback to carousel
    case 'list':
      // List view implementation would go here
      return renderCarouselView(); // For now, fallback to carousel
    default:
      return renderCarouselView();
  }
};

export default ConfigurableVehicleShowroom;
