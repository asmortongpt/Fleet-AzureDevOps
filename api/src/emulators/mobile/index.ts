/**
 * Mobile App Simulator - Entry Point
 *
 * Simple startup script to run the mobile app simulator standalone
 */

import logger from '../../config/logger'

import { MobileAppSimulator } from './MobileAppSimulator'

// Configuration
const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'fleetdb',
    user: process.env.DB_USER || 'fleetadmin',
    password: process.env.DB_PASSWORD || ''
  },
  simulation: {
    fuelReceiptsPerDay: 20,
    damageReportsPerDay: 5,
    preTripInspectionRate: 0.6, // 60% of fleet
    motionEventsPerHour: 50
  }
}

// Start the simulator
const simulator = new MobileAppSimulator(config)

simulator.on('started', () => {
  logger.info('Mobile App Simulator is running')
})

simulator.on(`fuel-receipt-generated`, (transaction) => {
  logger.info(`Fuel receipt: $${transaction.total_cost.toFixed(2)} at ${transaction.vendor}`)
})

simulator.on(`damage-report-generated`, (report) => {
  logger.info(`Damage report: ${report.damage_severity} ${report.damage_type}`)
})

simulator.on(`inspection-generated`, (inspection) => {
  logger.info(`Inspection: ${inspection.overall_result} (${inspection.defects_found} defects)`)
})

simulator.on(`motion-event-generated`, (event) => {
  logger.info(`Motion event: ${event.event_type} (${event.severity})`)
})

// Graceful shutdown
process.on(`SIGINT`, async () => {
  logger.info('Shutting down...')
  await simulator.stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Shutting down...')
  await simulator.stop()
  process.exit(0)
})

// Start it up
simulator.start().catch((error) => {
  logger.error('Failed to start Mobile App Simulator:', error)
  process.exit(1)
})

logger.info('Mobile App Simulator starting...')
