/**
 * Enhanced Domain Repositories
 *
 * Export all domain-specific repositories that extend GenericRepository.
 * These repositories replace direct pool.query() calls in routes and services.
 *
 * Epic #1: Backend Repository Layer Migration
 */

// Fleet Domain Repositories (Issue #1.2)
export { VehiclesRepository, Vehicle, VehicleStats, VehicleFilters } from './VehiclesRepository'
export { DriversRepository, Driver, DriverScore, DriverFilters } from './DriversRepository'
export {
  TelemetryRepository,
  TelemetryData,
  TelemetryFilters,
  TelemetryStats
} from './TelemetryRepository'

// Future: Maintenance Domain Repositories (Issue #1.3)
// export { MaintenanceRepository } from './MaintenanceRepository'
// export { WorkOrderRepository } from './WorkOrderRepository'

// Future: Facilities & Assets Repositories (Issue #1.4)
// export { FacilitiesRepository } from './FacilitiesRepository'
// export { AssetsRepository } from './AssetsRepository'

// Future: Incidents & Communications Repositories (Issue #1.5)
// export { IncidentsRepository } from './IncidentsRepository'
// export { CommunicationsRepository } from './CommunicationsRepository'

// Future: Remaining Domains (Issue #1.6)
// export { DocumentsRepository } from './DocumentsRepository'
// export { FuelRepository } from './FuelRepository'
// export { ChargingRepository } from './ChargingRepository'
