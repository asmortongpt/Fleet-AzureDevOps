/**
 * 🚗 2D Vehicle Showroom Component
 * 
 * Modern 2D vehicle showroom with car images, inspired by automotive showrooms
 * Features smooth animations, 3D-like hover effects, and immersive browsing experience
 */

import React, { useState } from 'react'

// Vehicle data with 2D images
interface ShowroomVehicle {
 id: string
 make: string
 model: string
 year: number
 type: 'sedan' | 'suv' | 'truck' | 'van' | 'compact' | 'executive'
 image: string
 color: string
 price: number
 availability: 'available' | 'reserved' | 'maintenance'
 features: string[]
 specs: {
 mpg: string
 engine: string
 transmission: string
 drivetrain: string
 }
 capacity: number
 fuelLevel: number
 mileage: number
 location: string
 rating: number
 isNew: boolean
 isFeatured: boolean
}

// Sample vehicle data with real images
const showroomVehicles: ShowroomVehicle[] = [
 {
 id: 'SHOW-001',
 make: 'Chevrolet',
 model: 'Suburban',
 year: 2024,
 type: 'suv',
 image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',
 color: 'Silver Ice',
 price: 72900,
 availability: 'available',
 features: ['4WD', 'Premium Sound', 'Leather', 'Navigation', 'Heated Seats'],
 specs: {
 mpg: '14/21',
 engine: '6.2L V8',
 transmission: '10-Speed Auto',
 drivetrain: '4WD'
 },
 capacity: 8, fuelLevel: 85,
 mileage: 15420,
 location: 'Tallahassee Central',
 rating: 4.8,
 isNew: true, isFeatured: true
 },
 {
 id: 'SHOW-002',
 make: 'Chevrolet',
 model: 'Tahoe',
 year: 2024,
 type: 'suv',
 image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
 color: 'Pacific Blue',
 price: 68900,
 availability: 'available',
 features: ['4WD', 'Towing Package', 'Cargo Space', 'Safety Package', 'Android Auto'],
 specs: {
 mpg: '15/20',
 engine: '5.3L V8',
 transmission: '10-Speed Auto',
 drivetrain: '4WD'
 },
 capacity: 8, fuelLevel: 72,
 mileage: 22150,
 location: 'Miami District',
 rating: 4.6,
 isNew: false, isFeatured: true
 }
]

interface Vehicle2DShowroomProps {
 onVehicleSelect: (vehicle: any) => void
 className?: string
}

const Vehicle2DShowroom: React.FC<Vehicle2DShowroomProps> = ({ onVehicleSelect, className = '' 
}) => {
 const [selectedVehicle, setSelectedVehicle] = useState<ShowroomVehicle | null>(null)
 const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
 const [filterType, setFilterType] = useState<string>('all')

 const filteredVehicles = showroomVehicles.filter(vehicle =>
 filterType === 'all' || vehicle.type === filterType
 )

 const getStatusColor = (availability: string) => {
 switch (availability) {
 case 'available': return '#10b981'
 case 'reserved': return '#f59e0b'
 case 'maintenance': return '#ef4444'
 default:
      return '#374151'
 }
 }

 const getStatusIcon = (availability: string) => {
 switch (availability) {
 case 'available': return '✅'
 case 'reserved': return '🔒'
 case 'maintenance': return '🔧'
 default:
      return '❓'
 }
 }

 const handleVehicleClick = (vehicle: ShowroomVehicle) => {
 setSelectedVehicle(vehicle)
 onVehicleSelect({
 id: vehicle.id,
 make: vehicle.make,
 model: vehicle.model,
 year: vehicle.year,
 status: vehicle.availability === 'available' ? 'active' : 'locked'
 })
 }

 return (
 <div className={`vehicle-showroom ${className}`} style={{padding: '20px',
 background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
 minHeight: '100vh'
 }}>
 {/* Header */}
 <div style={{marginBottom: '30px',
 textAlign: 'center'
 }}>
 <h1 style={{fontSize: '36px',
 fontWeight: 'bold',
 background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
 WebkitBackgroundClip: 'text',
 WebkitTextFillColor: 'transparent',
 marginBottom: '10px'
 }}>
 🚗 DCF Vehicle Showroom
 </h1>
 <p style={{fontSize: '18px',
 color: '#374151',
 marginBottom: '20px'
 }}>
 Browse and select from our premium fleet of government vehicles
 </p>

 {/* Controls */}
 <div style={{display: 'flex',
 justifyContent: 'center',
 gap: '20px',
 marginBottom: '20px',
 flexWrap: 'wrap'
 }}>
 <select
 value={filterType}
 onChange={(e) => setFilterType(e.target.value)}
 style={{padding: '10px 15px',
 borderRadius: '8px',
 border: '1px solid #d1d5db',
 background: 'white',
 fontSize: '14px'
 }}
 >
 <option value="all">All Types</option>
 <option value="sedan">Sedans</option>
 <option value="suv">SUVs</option>
 <option value="truck">Trucks</option>
 <option value="van">Vans</option>
 </select>
 <button
 onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
 style={{padding: '10px 20px',
 borderRadius: '8px',
 border: 'none',
 background: '#3b82f6',
 color: 'white',
 cursor: 'pointer',
 fontSize: '14px',
 fontWeight: '600'
 }}
 >
 {viewMode === 'grid' ? '📋 List View' : '⬜ Grid View'}
 </button>
 </div>
 </div>
 {/* Vehicle Grid */}
 <div style={{display: 'grid',
 gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fit, minmax(350px, 1fr))' : '1fr',
 gap: '25px',
 maxWidth: '1400px',
 margin: '0 auto'
 }}>
 {filteredVehicles.map((vehicle) => (
 <div
 key={vehicle.id}
 onClick={() => handleVehicleClick(vehicle)}
 style={{background: 'white',
 borderRadius: '16px',
 padding: '25px',
 cursor: 'pointer',
 transition: 'all 0.3s ease',
 border: selectedVehicle?.id === vehicle.id ? '3px solid #3b82f6' : '1px solid #e5e7eb',
 boxShadow: selectedVehicle?.id === vehicle.id
 ? '0 20px 40px rgba(59, 130, 246, 0.3)'
 : '0 4px 12px rgba(0, 0, 0, 0.1)',
 transform: selectedVehicle?.id === vehicle.id ? 'translateY(-5px)' : 'translateY(0)'
 }}
 >
 {/* Vehicle Image */}
 <div style={{textAlign: 'center',
 marginBottom: '20px',
 padding: '0',
 background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
 borderRadius: '12px',
 overflow: 'hidden'
 }}>
 <img 
 src={vehicle.image} 
 alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
 style={{width: '100%',
 height: '200px',
 objectFit: 'cover',
 marginBottom: '10px'
 }}
 />
 <div style={{display: 'flex',
 justifyContent: 'center',
 alignItems: 'center',
 gap: '10px'
 }}>
 <span style={{background: getStatusColor(vehicle.availability),
 color: 'white',
 padding: '4px 8px',
 borderRadius: '12px',
 fontSize: '12px',
 fontWeight: '600'
 }}>
 {getStatusIcon(vehicle.availability)} {vehicle.availability.toUpperCase()}
 </span>
 </div>
 </div>

 {/* Vehicle Details */}
 <div style={{textAlign: 'center'}}>
 <h3 style={{fontSize: '24px',
 fontWeight: 'bold',
 color: '#1f2937',
 marginBottom: '8px'
 }}>
 {vehicle.year} {vehicle.make} {vehicle.model}
 </h3>
 
 <p style={{color: '#374151',
 fontSize: '16px',
 marginBottom: '15px'
 }}>
 {vehicle.color} • {vehicle.capacity} Passengers
 </p>

 {/* Price */}
 <div style={{fontSize: '28px',
 fontWeight: 'bold',
 color: '#059669',
 marginBottom: '15px'
 }}>
 ${vehicle.price.toLocaleString()}
 </div>

 {/* Location */}
 <div style={{color: '#374151',
 fontSize: '14px',
 marginBottom: '15px'
 }}>
 📍 {vehicle.location}
 </div>

 {/* Action Button */}
 <button
 style={{width: '100%',
 padding: '12px',
 background: vehicle.availability === 'available' ? '#3b82f6' : '#374151',
 color: 'white',
 border: 'none',
 borderRadius: '8px',
 fontSize: '16px',
 fontWeight: '600',
 cursor: vehicle.availability === 'available' ? 'pointer' : 'not-allowed'
 }}
 disabled={vehicle.availability !== 'available'}
 >
 {vehicle.availability === 'available' ? '🚗 Select Vehicle' : '🔒 Not Available'}
 </button>
 </div>
 </div>
 ))}
 </div>
 {filteredVehicles.length === 0 && (
 <div style={{textAlign: 'center',
 padding: '60px 20px',
 color: '#374151'
 }}>
 <div style={{fontSize: '48px', marginBottom: '20px'}}>🚗</div>
 <h3 style={{fontSize: '24px', marginBottom: '10px'}}>No vehicles found</h3>
 <p>Try adjusting your filters to see more vehicles.</p>
 </div>
 )}
 </div>
 )
}

export default Vehicle2DShowroom