export interface User {
  id: string
  email: string
  name: string
}

export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  status: string
}

export interface Driver {
  id: string
  name: string
  licenseNumber: string
}

export interface WorkOrder {
  id: string
  title: string
  status: string
  description?: string
  dueDate?: string
  priority?: string
  assignedTo?: string
  vehicleId?: string
  type?: string
}

export interface Asset {
  id: string
  name: string
  type: string
  status: string
  location?: {
    lat: number
    lng: number
  }
}

export interface Geofence {
  id: string
  name: string
  coordinates: Array<{ lat: number; lng: number }>
  type: 'polygon' | 'circle'
}
