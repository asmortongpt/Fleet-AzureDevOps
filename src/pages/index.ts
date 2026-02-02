/**
 * Consolidated Hub Pages Index
 * 
 * Exports the 5 primary consolidated hubs that power the ArchonY navigation architecture.
 * These hubs consolidate 120+ individual screens into 5 workflow-optimized centers.
 */

// 1. Fleet Operations Hub
// Consolidates: Fleet, Drivers, Operations, Maintenance, Assets
export { default as FleetOperationsHub } from './FleetOperationsHub'

// 2. Safety & Compliance Hub
// Consolidates: Compliance, Safety, Policies, HOS
export { default as ComplianceSafetyHub } from './ComplianceSafetyHub'

// 3. Business Management Hub
// Consolidates: Financial, Procurement, Analytics, Reports
export { default as BusinessManagementHub } from './BusinessManagementHub'

// 4. People & Communication Hub
// Consolidates: People, Communication, Work, Dispatch
export { default as PeopleCommunicationHub } from './PeopleCommunicationHub'

// 5. Admin & Configuration Hub
// Consolidates: Admin, Config, Data, Integrations, Documents
export { default as AdminConfigurationHub } from './AdminConfigurationHub'

// Interactive Tools
export { default as VehicleShowroom3D } from './VehicleShowroom3D'

/**
 * Hub Route Configuration
 * Mapped to the primary consolidated hub architecture
 */
export const hubRoutes = [
    { path: '/fleet', component: 'FleetOperationsHub', label: 'Fleet Hub' },
    { path: '/safety', component: 'ComplianceSafetyHub', label: 'Safety & Compliance' },
    { path: '/financial', component: 'BusinessManagementHub', label: 'Financial Hub' },
    { path: '/communication', component: 'PeopleCommunicationHub', label: 'Communication Hub' },
    { path: '/admin', component: 'AdminConfigurationHub', label: 'Admin Hub' },
    { path: '/3d-garage', component: 'VehicleShowroom3D', label: '3D Garage' },
]
