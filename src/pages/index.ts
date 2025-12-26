/**
 * Hub Pages Index
 * 
 * Exports all consolidated hub pages for the new routing architecture.
 * These 11 hubs consolidate 79 screens into a unified navigation structure.
 */

// Core Fleet Operations
export { default as FleetHub } from './FleetHub'
export { default as OperationsHub } from './OperationsHub'
export { default as MaintenanceHub } from './MaintenanceHub'
export { default as DriversHub } from './DriversHub'

// Analytics & Reporting
export { default as AnalyticsHub } from './AnalyticsHub'

// Compliance & Safety
export { default as ComplianceHub } from './ComplianceHub'
export { default as SafetyHub } from './SafetyHub'

// Procurement & Assets
export { default as ProcurementHub } from './ProcurementHub'
export { default as AssetsHub } from './AssetsHub'

// Administration & Communication
export { default as AdminHub } from './AdminHub'
export { default as CommunicationHub } from './CommunicationHub'

/**
 * Hub Route Configuration
 * Use with React Router for new navigation structure
 */
export const hubRoutes = [
    { path: '/fleet', component: 'FleetHub', label: 'Fleet Hub' },
    { path: '/operations', component: 'OperationsHub', label: 'Operations Hub' },
    { path: '/maintenance', component: 'MaintenanceHub', label: 'Maintenance Hub' },
    { path: '/drivers', component: 'DriversHub', label: 'Drivers Hub' },
    { path: '/analytics', component: 'AnalyticsHub', label: 'Analytics Hub' },
    { path: '/compliance', component: 'ComplianceHub', label: 'Compliance Hub' },
    { path: '/safety', component: 'SafetyHub', label: 'Safety Hub' },
    { path: '/procurement', component: 'ProcurementHub', label: 'Procurement Hub' },
    { path: '/assets', component: 'AssetsHub', label: 'Assets Hub' },
    { path: '/admin', component: 'AdminHub', label: 'Admin Hub' },
    { path: '/communication', component: 'CommunicationHub', label: 'Communication Hub' },
]
