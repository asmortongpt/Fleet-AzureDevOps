/**
 * Test Routes - No Authentication Required
 * Simplified routes that return mock data for testing
 */

import express from 'express'
import {
  mockVehicles,
  mockDrivers,
  mockWorkOrders,
  mockFuelTransactions,
  mockFacilities,
  mockMaintenanceSchedules,
  mockRoutes,
  paginateResults
} from '../data/mock-data'

const router = express.Router()

// Vehicles
router.get('/vehicles', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  res.json(paginateResults(mockVehicles, page, limit))
})

router.get('/vehicles/:id', (req, res) => {
  const vehicle = mockVehicles.find(v => v.id === req.params.id)
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' })
  res.json(vehicle)
})

// Drivers
router.get('/drivers', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  res.json(paginateResults(mockDrivers, page, limit))
})

router.get('/drivers/:id', (req, res) => {
  const driver = mockDrivers.find(d => d.id === req.params.id)
  if (!driver) return res.status(404).json({ error: 'Driver not found' })
  res.json(driver)
})

// Work Orders
router.get('/work-orders', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  res.json(paginateResults(mockWorkOrders, page, limit))
})

router.get('/work-orders/:id', (req, res) => {
  const workOrder = mockWorkOrders.find(w => w.id === req.params.id)
  if (!workOrder) return res.status(404).json({ error: 'Work order not found' })
  res.json(workOrder)
})

// Fuel Transactions
router.get('/fuel-transactions', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  res.json(paginateResults(mockFuelTransactions, page, limit))
})

// Facilities
router.get('/facilities', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  res.json(paginateResults(mockFacilities, page, limit))
})

// Maintenance Schedules
router.get('/maintenance-schedules', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  res.json(paginateResults(mockMaintenanceSchedules, page, limit))
})

// Routes
router.get('/routes', (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  res.json(paginateResults(mockRoutes, page, limit))
})

export default router
module.exports = { default: router }
