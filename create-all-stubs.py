#!/usr/bin/env python3
"""
Create all missing stub files for TypeScript compilation
"""

from pathlib import Path
import os

os.chdir('/Users/andrewmorton/Documents/GitHub/fleet-local')

# Define all missing files with minimal stub implementations
stubs = {
    # Hooks
    'src/hooks/useAuth.ts': '''export function useAuth() {
  return {
    user: null,
    isAuthenticated: false,
    login: async () => {},
    logout: async () => {},
    isLoading: false
  }
}
''',

    # Types
    'src/types/index.ts': '''export interface User {
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
}
''',

    'src/types/Vehicle.ts': '''export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  status: string
}
''',

    # Utils
    'src/utils/auth/index.ts': '''export function checkAuth(): boolean {
  return false
}

export function getToken(): string | null {
  return null
}
''',

    'src/utils/logger/index.ts': '''export const logger = {
  info: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  debug: (...args: unknown[]) => console.debug(...args),
}

export default logger
''',

    'src/utils/validators/index.ts': '''export function validateEmail(email: string): boolean {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)
}

export function validateRequired(value: unknown): boolean {
  return value !== null && value !== undefined && value !== ''
}
''',

    'src/utils/compressToWebP.ts': '''export async function compressToWebP(file: File): Promise<Blob> {
  return file
}
''',

    # Contexts
    'src/context/AuthContext.tsx': '''import { createContext, useContext, ReactNode } from 'react'

interface AuthContextType {
  user: unknown | null
  isAuthenticated: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{
      user: null,
      isAuthenticated: false,
      login: async () => {},
      logout: async () => {}
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
''',

    # Repositories
    'src/repositories/VehicleRepository.ts': '''export class VehicleRepository {
  async getAll() { return [] }
  async getById(id: string) { return null }
  async create(data: unknown) { return data }
  async update(id: string, data: unknown) { return data }
  async delete(id: string) { return true }
}
''',

    'src/repositories/DriverRepository.ts': '''export class DriverRepository {
  async getAll() { return [] }
  async getById(id: string) { return null }
  async create(data: unknown) { return data }
  async update(id: string, data: unknown) { return data }
  async delete(id: string) { return true }
}
''',

    'src/repositories/WorkOrderRepository.ts': '''export class WorkOrderRepository {
  async getAll() { return [] }
  async getById(id: string) { return null }
  async create(data: unknown) { return data }
  async update(id: string, data: unknown) { return data }
  async delete(id: string) { return true }
}
''',

    'src/repositories/MaintenanceRepository.ts': '''export class MaintenanceRepository {
  async getAll() { return [] }
  async getById(id: string) { return null }
  async create(data: unknown) { return data }
  async update(id: string, data: unknown) { return data }
  async delete(id: string) { return true }
}
''',

    'src/repositories/InspectionRepository.ts': '''export class InspectionRepository {
  async getAll() { return [] }
  async getById(id: string) { return null }
  async create(data: unknown) { return data }
  async update(id: string, data: unknown) { return data }
  async delete(id: string) { return true }
}
''',

    'src/repositories/VendorRepository.ts': '''export class VendorRepository {
  async getAll() { return [] }
  async getById(id: string) { return null }
  async create(data: unknown) { return data }
  async update(id: string, data: unknown) { return data }
  async delete(id: string) { return true }
}
''',

    # Services
    'src/services/Logger.ts': '''export class Logger {
  info(...args: unknown[]) { console.log(...args) }
  warn(...args: unknown[]) { console.warn(...args) }
  error(...args: unknown[]) { console.error(...args) }
  debug(...args: unknown[]) { console.debug(...args) }
}

export default new Logger()
''',

    'src/services/photo-storage.service.ts': '''export class PhotoStorageService {
  async upload(file: File): Promise<string> {
    return URL.createObjectURL(file)
  }
  async download(url: string): Promise<Blob> {
    const response = await fetch(url)
    return response.blob()
  }
}

export default new PhotoStorageService()
''',

    'src/services/GarageService.ts': '''export class GarageService {
  async getVehicles() { return [] }
  async getVehicle(id: string) { return null }
}

export default new GarageService()
''',

    # Components
    'src/components/api/assets.ts': '''export async function getAssets() {
  return []
}

export async function getAsset(id: string) {
  return null
}

export async function createAsset(data: unknown) {
  return data
}
''',

    'src/components/modules/fleet/FleetDashboard/FleetDashboard.tsx': '''export function FleetDashboard() {
  return <div>Fleet Dashboard</div>
}

export default FleetDashboard
''',

    'src/components/modules/fleet/FleetDashboardModern/FleetDashboardModern.tsx': '''export function FleetDashboardModern() {
  return <div>Fleet Dashboard Modern</div>
}

export default FleetDashboardModern
''',

    'src/components/modules/fleet/FleetHub.tsx': '''export function FleetHub() {
  return <div>Fleet Hub</div>
}

export default FleetHub
''',

    'src/components/modules/fleet/GeofenceManagement.tsx': '''export function GeofenceManagement() {
  return <div>Geofence Management</div>
}

export default GeofenceManagement
''',

    'src/components/modules/fleet/GPSTracking/GPSTracking.tsx': '''export function GPSTracking() {
  return <div>GPS Tracking</div>
}

export default GPSTracking
''',

    'src/components/modules/fleet/MaintenanceRequest.tsx': '''export function MaintenanceRequest() {
  return <div>Maintenance Request</div>
}

export default MaintenanceRequest
''',

    'src/components/modules/fleet/MaintenanceScheduling.tsx': '''export function MaintenanceScheduling() {
  return <div>Maintenance Scheduling</div>
}

export default MaintenanceScheduling
''',

    'src/components/modules/fleet/OperationsHub.tsx': '''export function OperationsHub() {
  return <div>Operations Hub</div>
}

export default OperationsHub
''',

    'src/components/modules/fleet/PeopleHub.tsx': '''export function PeopleHub() {
  return <div>People Hub</div>
}

export default PeopleHub
''',

    'src/components/modules/fleet/PredictiveMaintenance.tsx': '''export function PredictiveMaintenance() {
  return <div>Predictive Maintenance</div>
}

export default PredictiveMaintenance
''',

    'src/components/modules/fleet/VehicleTelemetry.tsx': '''export function VehicleTelemetry() {
  return <div>Vehicle Telemetry</div>
}

export default VehicleTelemetry
''',

    'src/components/modules/fleet/VirtualGarage.tsx.bak': '''// Backup - do not import
export default function VirtualGarage() {
  return <div>Virtual Garage</div>
}
''',

    'src/components/modules/facilities/WorkOrders/WorkOrders.tsx': '''export function WorkOrders() {
  return <div>Work Orders</div>
}

export default WorkOrders
''',

    'src/components/modules/DataWorkbench/types.ts': '''export interface DataWorkbenchConfig {
  id: string
  name: string
}
''',

    # Storybook (for stories files)
    '.storybook/decorators.tsx': '''export const withTheme = (Story: unknown) => Story
''',

    '.storybook/mockData.ts': '''export const mockVehicles = []
export const mockDrivers = []
''',
}

def main():
    print("Creating stub files...")
    created = 0
    skipped = 0

    for file_path, content in stubs.items():
        path = Path(file_path)

        if path.exists():
            print(f"  Skipping {file_path} (exists)")
            skipped += 1
            continue

        print(f"  Creating {file_path}")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        created += 1

    print(f"\nCreated: {created}")
    print(f"Skipped: {skipped}")

if __name__ == '__main__':
    main()
