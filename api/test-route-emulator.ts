/**
 * Test script to verify RouteEmulator functionality
 */
import { RouteEmulator } from './src/emulators/RouteEmulator';

console.log('🚀 Testing Route Emulator...\n');

// Get instance of the emulator
const emulator = RouteEmulator.getInstance();

// Test 1: Get all routes
console.log('📋 Test 1: Get all routes');
const allRoutes = emulator.getRoutes({ limit: 5 });
console.log(`Total routes: ${allRoutes.total}`);
console.log(`Showing first ${allRoutes.routes.length} routes\n`);

// Test 2: Get a specific route
console.log('📍 Test 2: Get specific route (ID: 1)');
const route = emulator.getRouteById(1);
if (route) {
  console.log(`Route #${route.id}:`);
  console.log(`  Type: ${route.routeType}`);
  console.log(`  Status: ${route.status}`);
  console.log(`  Vehicle ID: ${route.vehicleId}`);
  console.log(`  Driver ID: ${route.driverId}`);
  console.log(`  Stops: ${route.stops.length}`);
  console.log(`  Total Distance: ${route.totalDistance.toFixed(2)} miles`);
  console.log(`  Estimated Duration: ${route.estimatedDuration} minutes`);
  console.log(`  Optimization Savings: ${route.optimization.savingsPercent.toFixed(2)}%\n`);

  // Show stops
  console.log('  📍 Route Stops:');
  route.stops.forEach((stop, index) => {
    console.log(`    ${index + 1}. ${stop.address.split(',')[0]}`);
    console.log(`       Type: ${stop.stopType}, Duration: ${stop.duration} min, Status: ${stop.status}`);
  });
  console.log('');
}

// Test 3: Get optimization statistics
console.log('📊 Test 3: Optimization Statistics');
const stats = emulator.getOptimizationStats();
console.log(`Total Routes: ${stats.totalRoutes}`);
console.log(`Average Savings: ${stats.averageSavings.toFixed(2)}%`);
console.log(`Total Distance Saved: ${stats.totalDistanceSaved.toFixed(2)} miles`);
console.log('\nRoutes by Type:');
Object.entries(stats.routesByType).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});
console.log('\nRoutes by Status:');
Object.entries(stats.routesByStatus).forEach(([status, count]) => {
  console.log(`  ${status}: ${count}`);
});
console.log('');

// Test 4: Get routes for specific vehicle
console.log('🚗 Test 4: Routes for Vehicle #10');
const vehicleRoutes = emulator.getRoutesByVehicle(10);
console.log(`Found ${vehicleRoutes.length} routes for vehicle #10`);
if (vehicleRoutes.length > 0) {
  console.log(`  First route: #${vehicleRoutes[0].id} - ${vehicleRoutes[0].routeType} (${vehicleRoutes[0].status})`);
}
console.log('');

// Test 5: Create a new route
console.log('✨ Test 5: Create a new route');
const newRoute = emulator.createRoute({
  vehicleId: 99,
  driverId: 88,
  routeType: 'delivery'
});
console.log(`Created route #${newRoute.id}:`);
console.log(`  Vehicle: ${newRoute.vehicleId}, Driver: ${newRoute.driverId}`);
console.log(`  Stops: ${newRoute.stops.length}`);
console.log(`  Distance: ${newRoute.totalDistance.toFixed(2)} miles`);
console.log(`  Optimization saved: ${newRoute.optimization.savingsPercent.toFixed(2)}%\n`);

// Test 6: Update stop status
console.log('✅ Test 6: Update stop status');
const routeToUpdate = emulator.getRouteById(5);
if (routeToUpdate && routeToUpdate.stops.length > 0) {
  const firstStop = routeToUpdate.stops[0];
  console.log(`Updating stop #${firstStop.id} on route #${routeToUpdate.id}`);
  console.log(`  Before: ${firstStop.status}`);

  emulator.updateStopStatus(routeToUpdate.id, firstStop.id, 'completed');

  const updatedRoute = emulator.getRouteById(5);
  const updatedStop = updatedRoute?.stops.find(s => s.id === firstStop.id);
  console.log(`  After: ${updatedStop?.status}`);
  console.log(`  Route status: ${updatedRoute?.status}\n`);
}

// Test 7: Sample optimized route with details
console.log('🗺️ Test 7: Detailed Optimized Route Example');
const sampleRoute = emulator.getRoutes({
  routeType: 'delivery',
  status: 'active',
  limit: 1
}).routes[0];

if (sampleRoute) {
  console.log(`\nRoute #${sampleRoute.id} - DETAILED VIEW`);
  console.log('=' .repeat(50));
  console.log(`Type: ${sampleRoute.routeType.toUpperCase()}`);
  console.log(`Status: ${sampleRoute.status.toUpperCase()}`);
  console.log(`Vehicle: #${sampleRoute.vehicleId} | Driver: #${sampleRoute.driverId}`);
  console.log(`Start Time: ${new Date(sampleRoute.startTime).toLocaleString()}`);

  console.log('\nOptimization Results:');
  console.log(`  Original Distance: ${sampleRoute.optimization.originalDistance.toFixed(2)} miles`);
  console.log(`  Optimized Distance: ${sampleRoute.optimization.optimizedDistance.toFixed(2)} miles`);
  console.log(`  Distance Saved: ${(sampleRoute.optimization.originalDistance - sampleRoute.optimization.optimizedDistance).toFixed(2)} miles`);
  console.log(`  Savings: ${sampleRoute.optimization.savingsPercent.toFixed(2)}%`);

  console.log('\nOptimized Stop Sequence:');
  sampleRoute.stops.forEach((stop, index) => {
    const scheduled = new Date(stop.scheduledTime);
    console.log(`\n  Stop ${index + 1}: ${stop.stopType.toUpperCase()}`);
    console.log(`    📍 ${stop.address}`);
    console.log(`    ⏰ Scheduled: ${scheduled.toLocaleTimeString()}`);
    console.log(`    ⏱️ Duration: ${stop.duration} minutes`);
    console.log(`    📝 Status: ${stop.status}`);
    if (stop.notes) {
      console.log(`    💬 Notes: ${stop.notes}`);
    }
    if (stop.actualArrivalTime) {
      console.log(`    ✅ Actual Arrival: ${new Date(stop.actualArrivalTime).toLocaleTimeString()}`);
    }
  });

  console.log('\n' + '=' .repeat(50));
}

console.log('\n✅ All tests completed successfully!');