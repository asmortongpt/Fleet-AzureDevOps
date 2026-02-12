/**
 * Test script to verify Route API endpoints
 */
const express = require('express');
const app = express();
app.use(express.json());

// Import the route emulator router (we'll test it inline)
const { RouteEmulator } = require('./dist/emulators/RouteEmulator');
const router = require('express').Router();

const routeEmulator = RouteEmulator.getInstance();

// Simplified route endpoint for testing
router.get('/', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      routeType: req.query.routeType,
      vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId) : undefined,
      driverId: req.query.driverId ? parseInt(req.query.driverId) : undefined,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20
    };

    const result = routeEmulator.getRoutes(filters);

    res.json({
      success: true,
      data: result.routes,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: filters.limit || 20
      }
    });
  } catch (error) {
    console.error('Error getting routes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve routes'
    });
  }
});

// Get optimization stats
router.get('/optimize', (req, res) => {
  try {
    const stats = routeEmulator.getOptimizationStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting optimization stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve optimization statistics'
    });
  }
});

// Get route by ID
router.get('/:id', (req, res) => {
  try {
    const routeId = parseInt(req.params.id);
    const route = routeEmulator.getRouteById(routeId);

    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('Error getting route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve route'
    });
  }
});

app.use('/api/routes', router);

// Start server and run tests
const PORT = 3002;
const server = app.listen(PORT, async () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log('\n📍 Testing Route API Endpoints...\n');

  try {
    // Test 1: Get all routes
    console.log('Test 1: GET /api/routes');
    const response1 = await fetch(`http://localhost:${PORT}/api/routes?limit=3`);
    const data1 = await response1.json();
    console.log(`✅ Success: Retrieved ${data1.data.length} routes out of ${data1.pagination.total} total`);

    // Test 2: Get optimization stats
    console.log('\nTest 2: GET /api/routes/optimize');
    const response2 = await fetch(`http://localhost:${PORT}/api/routes/optimize`);
    const data2 = await response2.json();
    console.log(`✅ Success: Average optimization savings: ${data2.data.averageSavings.toFixed(2)}%`);

    // Test 3: Get specific route
    console.log('\nTest 3: GET /api/routes/1');
    const response3 = await fetch(`http://localhost:${PORT}/api/routes/1`);
    const data3 = await response3.json();
    console.log(`✅ Success: Route #${data3.data.id} with ${data3.data.stops.length} stops`);

    // Test 4: Filter by route type
    console.log('\nTest 4: GET /api/routes?routeType=delivery');
    const response4 = await fetch(`http://localhost:${PORT}/api/routes?routeType=delivery`);
    const data4 = await response4.json();
    console.log(`✅ Success: Found ${data4.pagination.total} delivery routes`);

    // Test 5: Filter by vehicle
    console.log('\nTest 5: GET /api/routes?vehicleId=10');
    const response5 = await fetch(`http://localhost:${PORT}/api/routes?vehicleId=10`);
    const data5 = await response5.json();
    console.log(`✅ Success: Found ${data5.pagination.total} routes for vehicle #10`);

    console.log('\n🎉 All API tests passed successfully!\n');

    // Show sample route details
    console.log('📋 Sample Route Details:');
    const sampleRoute = data1.data[0];
    if (sampleRoute) {
      console.log(`\nRoute #${sampleRoute.id}:`);
      console.log(`  Type: ${sampleRoute.routeType}`);
      console.log(`  Status: ${sampleRoute.status}`);
      console.log(`  Vehicle: #${sampleRoute.vehicleId}`);
      console.log(`  Driver: #${sampleRoute.driverId}`);
      console.log(`  Stops: ${sampleRoute.stops.length}`);
      console.log(`  Distance: ${sampleRoute.totalDistance.toFixed(2)} miles`);
      console.log(`  Optimization Savings: ${sampleRoute.optimization.savingsPercent.toFixed(2)}%`);
      console.log('\n  First 3 stops:');
      sampleRoute.stops.slice(0, 3).forEach((stop, i) => {
        console.log(`    ${i + 1}. ${stop.address.split(',')[0]} (${stop.stopType})`);
      });
    }

    console.log('\n🚀 Test server shutting down...');
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    server.close();
    process.exit(1);
  }
});