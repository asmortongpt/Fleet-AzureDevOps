import React, { useState, useEffect, useMemo } from 'react';

import { RealDataService } from '../../services/RealDataService';

import { secureFetch } from '@/hooks/use-api';

interface PhotorealisticVehicleShowroomProps {
  currentTheme: any;
}

interface VehicleWithImages {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  color: string;
  mileage: number;
  status: string;
  assigned_driver_id: string;
  imageUrl: string;
  imageSet: Record<string, string>;
  model3DUrl: string;
  isLoadingImages: boolean;
  imageConfidence?: number;
  imageSource?: string;
}

const PhotorealisticVehicleShowroom: React.FC<PhotorealisticVehicleShowroomProps> = ({
  currentTheme
}) => {
  const [vehicles, setVehicles] = useState<VehicleWithImages[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithImages | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<string>('front-angle');
  const [loading, setLoading] = useState(true);
  const [filterMake, setFilterMake] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'make' | 'year' | 'mileage'>('make');
  const [scanningVIN, setScanningVIN] = useState<string | null>(null);

  useEffect(() => {
    loadVehiclesWithImages();
  }, []);

  const loadVehiclesWithImages = async () => {
    setLoading(true);
    const realDataService = RealDataService.getInstance();

    try {
      const vehicleData = await realDataService.getVehicles();

      const fetchModelData = async (vehicleId: string) => {
        try {
          const response = await secureFetch(`/api/vehicle-3d/${vehicleId}/3d-model`, { method: 'GET' });
          if (!response.ok) return null;
          return response.json();
        } catch {
          return null;
        }
      };

      const enhancedVehicles: VehicleWithImages[] = await Promise.all(
        vehicleData.map(async (vehicle: any): Promise<VehicleWithImages> => {
          const modelData = await fetchModelData(String(vehicle.id));
          const previewImages = Array.isArray(modelData?.metadata?.preview_images)
            ? modelData.metadata.preview_images
            : Array.isArray(modelData?.preview_images)
              ? modelData.preview_images
              : [];
          const thumbnailUrl = modelData?.thumbnail_url || modelData?.thumbnailUrl || modelData?.render_url || '';
          const primaryImage = thumbnailUrl || previewImages[0] || '';

          const imageSet: Record<string, string> = {
            front: previewImages[0] || primaryImage,
            'front-angle': previewImages[1] || primaryImage,
            side: previewImages[2] || primaryImage,
            rear: previewImages[3] || primaryImage,
            'rear-angle': previewImages[4] || primaryImage
          };

          const rawConfidence = typeof modelData?.metadata?.image_confidence === 'number'
            ? modelData.metadata.image_confidence
            : undefined;
          const normalizedConfidence = typeof rawConfidence === 'number'
            ? (rawConfidence > 1 ? rawConfidence / 100 : rawConfidence)
            : undefined;

          const vehicleWithImages: VehicleWithImages = {
            id: String(vehicle.id),
            make: vehicle.make || 'Unknown',
            model: vehicle.model || 'Vehicle',
            year: vehicle.year || 2023,
            vin: vehicle.vin || '',
            color: vehicle.color || 'silver',
            mileage: vehicle.mileage || 0,
            status: vehicle.status || vehicle.vehicle_status || 'active',
            assigned_driver_id: vehicle.assigned_driver_id || '',
            imageUrl: primaryImage,
            imageSet,
            model3DUrl: modelData?.glb_model_url || modelData?.file_url || '',
            isLoadingImages: false,
            imageConfidence: normalizedConfidence,
            imageSource: modelData ? 'vehicle-3d' : undefined
          };

          return vehicleWithImages;
        })
      );

      setVehicles(enhancedVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanVIN = async (vehicleId: string) => {
    setScanningVIN(vehicleId);
    try {
      const response = await secureFetch(`/api/vehicles/${vehicleId}`, { method: 'GET' });
      if (!response.ok) {
        throw new Error('Failed to refresh vehicle data');
      }
      const payload = await response.json();
      const vehicle = payload.data || payload;

      setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId) {
          return {
            ...v,
            vin: vehicle.vin || v.vin,
            make: vehicle.make || v.make,
            model: vehicle.model || v.model,
            year: vehicle.year || v.year,
            color: vehicle.color || v.color,
            mileage: vehicle.mileage || v.mileage,
            status: vehicle.status || v.status
          };
        }
        return v;
      }));
    } catch (error) {
      console.error('VIN refresh failed:', error);
    } finally {
      setScanningVIN(null);
    }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter(vehicle => filterMake === 'all' || vehicle.make === filterMake)
      .filter(vehicle => filterYear === 'all' || vehicle.year.toString() === filterYear)
      .sort((a, b) => {
        switch (sortBy) {
          case 'year':
            return b.year - a.year;
          case 'mileage':
            return a.mileage - b.mileage;
          default:
            return a.make.localeCompare(b.make);
        }
      });
  }, [vehicles, filterMake, filterYear, sortBy]);

  const uniqueMakes = useMemo(() => {
    return [...new Set(vehicles.map(v => v.make))].sort();
  }, [vehicles]);

  const uniqueYears = useMemo(() => {
    return [...new Set(vehicles.map(v => v.year))].sort((a, b) => b - a);
  }, [vehicles]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return currentTheme.success;
      case 'maintenance':
        return currentTheme.warning;
      case 'idle':
        return currentTheme.info;
      default:
        return currentTheme.textMuted;
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: currentTheme.text
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${currentTheme.border}`,
            borderTop: `3px solid ${currentTheme.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          Loading photorealistic vehicle images...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      background: currentTheme.bg,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
            color: currentTheme.text,
            marginBottom: '8px'
          }}>
            Photorealistic Vehicle Showroom
          </h1>
          <p style={{
            margin: 0,
            color: currentTheme.textMuted,
            fontSize: '14px'
          }}>
            High-quality images with OBD2 VIN scanning • {vehicles.length} vehicles
          </p>
        </div>

        <button
          onClick={loadVehiclesWithImages}
          disabled={loading}
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            border: 'none',
            background: loading ?
              'linear-gradient(45deg, #374151, #374151)' :
              'linear-gradient(45deg, #10b981, #059669)',
            color: 'white',
            fontWeight: '700',
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s ease',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {loading ? (
            <>
              <span style={{
                display: 'inline-block',
                animation: 'spin 1s linear infinite',
                fontSize: '18px'
              }}>🔄</span>
              <span style={{ fontSize: '13px' }}>
                Refreshing Vehicle Images...
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '18px' }}>🔄</span>
              <span style={{ fontSize: '13px' }}>
                Refresh Images
              </span>
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <select
          value={filterMake}
          onChange={(e) => setFilterMake(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${currentTheme.border}`,
            background: currentTheme.surface,
            color: currentTheme.text,
            fontSize: '14px'
          }}
        >
          <option value="all">All Makes</option>
          {uniqueMakes.map(make => (
            <option key={make} value={make}>{make}</option>
          ))}
        </select>

        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${currentTheme.border}`,
            background: currentTheme.surface,
            color: currentTheme.text,
            fontSize: '14px'
          }}
        >
          <option value="all">All Years</option>
          {uniqueYears.map(year => (
            <option key={year} value={year.toString()}>{year}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${currentTheme.border}`,
            background: currentTheme.surface,
            color: currentTheme.text,
            fontSize: '14px'
          }}
        >
          <option value="make">Sort by Make</option>
          <option value="year">Sort by Year</option>
          <option value="mileage">Sort by Mileage</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 160px)' }}>
        {/* Vehicle grid */}
        <div style={{
          flex: selectedVehicle ? '1' : '1',
          overflowY: 'auto',
          background: currentTheme.surface,
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: selectedVehicle ?
              'repeat(auto-fill, minmax(280px, 1fr))' :
              'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                style={{
                  background: selectedVehicle?.id === vehicle.id ?
                    `${currentTheme.primary}15` : currentTheme.bg,
                  border: selectedVehicle?.id === vehicle.id ?
                    `2px solid ${currentTheme.primary}` :
                    `1px solid ${currentTheme.border}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Vehicle image */}
                <div style={{
                  height: '200px',
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#f8f9fa'
                }}>
                  {vehicle.isLoadingImages ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: currentTheme.textMuted
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        border: `2px solid ${currentTheme.border}`,
                        borderTop: `2px solid ${currentTheme.primary}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    </div>
                  ) : (
                    vehicle.imageUrl ? (
                      <img
                        src={vehicle.imageUrl}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '';
                        }}
                      />
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: currentTheme.textMuted,
                        fontSize: '12px'
                      }}>
                        No image available
                      </div>
                    )
                  )}

                  {/* Status badge */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: getStatusColor(vehicle.status),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {vehicle.status}
                  </div>

                  {/* VALIDATION & HONESTY LOOP BADGE */}
                  {(() => {
                    const confidence = vehicle.imageConfidence;
                    const percent = confidence == null
                      ? null
                      : confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence);

                    const badge = percent == null
                      ? { label: 'NO SCORE', icon: '—', color: '#6b7280' }
                      : percent >= 95
                        ? { label: 'VALIDATED', icon: '✅', color: '#10b981' }
                        : percent >= 80
                          ? { label: 'UNVERIFIED', icon: '⚠️', color: '#f59e0b' }
                          : { label: 'LOW CONFIDENCE', icon: '🚨', color: '#dc3545' };

                    return (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: badge.color,
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        maxWidth: '140px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        <span style={{ fontSize: '12px' }}>{badge.icon}</span>
                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{badge.label}</span>
                      </div>
                    );
                  })()}

                  {/* HONESTY DISCLOSURE TOOLTIP */}
                  {vehicle.imageSource && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      background: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      maxWidth: '200px',
                      lineHeight: '1.2'
                    }}>
                      {vehicle.imageSource}
                    </div>
                  )}

                  {/* VIN scan button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScanVIN(vehicle.id);
                    }}
                    disabled={scanningVIN === vehicle.id}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: scanningVIN === vehicle.id ?
                        currentTheme.warning :
                        `${currentTheme.primary}CC`,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: scanningVIN === vehicle.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {scanningVIN === vehicle.id ? '🔍 Scanning...' : '🔗 Scan VIN'}
                  </button>
                </div>

                {/* Vehicle info */}
                <div style={{ padding: '16px' }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: currentTheme.text
                  }}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '14px',
                    color: currentTheme.textMuted
                  }}>
                    <div>VIN: {vehicle.vin ? vehicle.vin.slice(-6) : '—'}</div>
                    <div>Color: {vehicle.color}</div>
                    <div>Mileage: {vehicle.mileage.toLocaleString()}</div>
                    <div>ID: {vehicle.id.substr(0, 8)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle detail panel */}
        {selectedVehicle && (
          <div style={{
            width: '400px',
            background: currentTheme.surface,
            borderRadius: '12px',
            padding: '20px',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '20px'
            }}>
              <div>
                <h2 style={{
                  margin: '0 0 8px 0',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: currentTheme.text
                }}>
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </h2>
                <p style={{
                  margin: 0,
                  color: currentTheme.textMuted,
                  fontSize: '14px'
                }}>
                  VIN: {selectedVehicle.vin}
                </p>
              </div>

              <button
                onClick={() => setSelectedVehicle(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: currentTheme.textMuted,
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Image viewer */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <img
                src={selectedVehicle.imageSet[selectedAngle] || selectedVehicle.imageUrl}
                alt={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                style={{
                  width: '100%',
                  height: '250px',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = selectedVehicle.imageUrl;
                }}
              />
            </div>

            {/* Angle selector */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              overflowX: 'auto'
            }}>
              {['front-angle', 'front', 'side', 'rear-angle', 'rear'].map(angle => (
                <button
                  key={angle}
                  onClick={() => setSelectedAngle(angle)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: selectedAngle === angle ?
                      `2px solid ${currentTheme.primary}` :
                      `1px solid ${currentTheme.border}`,
                    background: selectedAngle === angle ?
                      `${currentTheme.primary}15` :
                      currentTheme.bg,
                    color: selectedAngle === angle ?
                      currentTheme.primary :
                      currentTheme.text,
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {angle.replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Image confidence info */}
            {selectedVehicle.imageConfidence && (
              <div style={{
                padding: '12px',
                background: selectedVehicle.imageConfidence >= 0.99 ? '#10b98115' :
                  selectedVehicle.imageConfidence >= 0.95 ? '#3b82f615' :
                  selectedVehicle.imageConfidence >= 0.90 ? '#f59e0b15' : '#ef444415',
                borderRadius: '8px',
                border: `1px solid ${
                  selectedVehicle.imageConfidence >= 0.99 ? '#10b981' :
                  selectedVehicle.imageConfidence >= 0.95 ? '#3b82f6' :
                  selectedVehicle.imageConfidence >= 0.90 ? '#f59e0b' : '#ef4444'
                }`,
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>
                    Image Accuracy
                  </span>
                  <span style={{
                    fontWeight: '700',
                    fontSize: '16px',
                    color: selectedVehicle.imageConfidence >= 0.99 ? '#10b981' :
                      selectedVehicle.imageConfidence >= 0.95 ? '#3b82f6' :
                      selectedVehicle.imageConfidence >= 0.90 ? '#f59e0b' : '#ef4444'
                  }}>
                    {(selectedVehicle.imageConfidence * 100).toFixed(0)}%
                  </span>
                </div>
                {selectedVehicle.imageSource && (
                  <div style={{ fontSize: '12px', color: currentTheme.textMuted }}>
                    Source: {selectedVehicle.imageSource}
                  </div>
                )}
                <div style={{
                  fontSize: '11px',
                  color: currentTheme.textMuted,
                  marginTop: '4px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: selectedVehicle.imageConfidence >= 0.95 ?
                    'rgba(16, 185, 129, 0.1)' :
                    selectedVehicle.imageConfidence >= 0.85 ?
                    'rgba(245, 158, 11, 0.1)' :
                    'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${
                    selectedVehicle.imageConfidence >= 0.95 ?
                    'rgba(16, 185, 129, 0.2)' :
                    selectedVehicle.imageConfidence >= 0.85 ?
                    'rgba(245, 158, 11, 0.2)' :
                    'rgba(239, 68, 68, 0.2)'
                  }`
                }}>
                  {selectedVehicle.imageConfidence >= 0.99 ?
                    '🎯 PERFECT MATCH - 99%+ confidence' :
                    selectedVehicle.imageConfidence >= 0.95 ?
                    `✅ VERIFIED - ${Math.round(selectedVehicle.imageConfidence * 100)}% confidence` :
                    selectedVehicle.imageConfidence >= 0.85 ?
                    `⚠️ GOOD MATCH - ${Math.round(selectedVehicle.imageConfidence * 100)}% confidence` :
                    `❌ LOW CONFIDENCE - ${Math.round(selectedVehicle.imageConfidence * 100)}% confidence`}
                </div>
              </div>
            )}

            {/* Vehicle details */}
            <div style={{
              display: 'grid',
              gap: '12px'
            }}>
              {[
                { label: 'Make', value: selectedVehicle.make },
                { label: 'Model', value: selectedVehicle.model },
                { label: 'Year', value: selectedVehicle.year.toString() },
                { label: 'Color', value: selectedVehicle.color },
                { label: 'Mileage', value: selectedVehicle.mileage.toLocaleString() + ' miles' },
                { label: 'Status', value: selectedVehicle.status },
                { label: 'VIN', value: selectedVehicle.vin },
                { label: 'Vehicle ID', value: selectedVehicle.id }
              ].map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: currentTheme.bg,
                    borderRadius: '8px',
                    border: `1px solid ${currentTheme.border}`
                  }}
                >
                  <span style={{
                    fontWeight: '600',
                    color: currentTheme.text
                  }}>
                    {item.label}:
                  </span>
                  <span style={{
                    color: currentTheme.textMuted,
                    textAlign: 'right'
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{
              marginTop: '20px',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => handleScanVIN(selectedVehicle.id)}
                disabled={scanningVIN === selectedVehicle.id}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: scanningVIN === selectedVehicle.id ?
                    currentTheme.warning :
                    currentTheme.primary,
                  color: 'white',
                  fontWeight: '600',
                  cursor: scanningVIN === selectedVehicle.id ? 'not-allowed' : 'pointer'
                }}
              >
                {scanningVIN === selectedVehicle.id ? 'Scanning VIN...' : 'Rescan VIN'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PhotorealisticVehicleShowroom;
