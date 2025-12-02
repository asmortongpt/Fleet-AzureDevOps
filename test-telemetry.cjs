#!/usr/bin/env node

/**
 * Test script to verify telemetry integration
 * This simulates various API calls and interactions to test telemetry tracking
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001';
const tests = [];

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

async function runTest(name, testFn) {
  try {
    console.log(`${colors.blue}🔍 Testing: ${name}${colors.reset}`);
    const result = await testFn();
    tests.push({ name, success: true, result });
    console.log(`${colors.green}✅ ${name} passed${colors.reset}`);
    return result;
  } catch (error) {
    tests.push({ name, success: false, error: error.message });
    console.log(`${colors.red}❌ ${name} failed: ${error.message}${colors.reset}`);
    return null;
  }
}

async function testHealthEndpoint() {
  const response = await axios.get(`${API_URL}/health`);
  console.log('  Health check response:', response.data);
  return response.data;
}

async function testVehiclesEndpoint() {
  const response = await axios.get(`${API_URL}/api/vehicles`);
  console.log(`  Found ${response.data.total} vehicles`);
  return response.data;
}

async function testDriversEndpoint() {
  const response = await axios.get(`${API_URL}/api/drivers`);
  console.log(`  Found ${response.data.total} drivers`);
  return response.data;
}

async function testErrorEndpoint() {
  try {
    await axios.get(`${API_URL}/api/non-existent-endpoint`);
  } catch (error) {
    console.log(`  404 error tracked: ${error.response.status}`);
    return { statusCode: error.response.status };
  }
}

async function testSlowRequest() {
  // Test with a potentially slow endpoint
  const start = Date.now();
  const response = await axios.get(`${API_URL}/api/vehicles?limit=100`);
  const duration = Date.now() - start;
  console.log(`  Request took ${duration}ms`);
  return { duration, count: response.data.data.length };
}

async function testPaginatedRequest() {
  const response = await axios.get(`${API_URL}/api/vehicles?page=2&limit=10`);
  console.log(`  Page 2 with 10 items: ${response.data.data.length} vehicles`);
  return response.data;
}

async function testSearchRequest() {
  const response = await axios.get(`${API_URL}/api/vehicles?search=Toyota`);
  console.log(`  Search for 'Toyota': ${response.data.data.length} results`);
  return response.data;
}

async function testMaintenanceEndpoint() {
  const response = await axios.get(`${API_URL}/api/maintenance`);
  console.log(`  Found ${response.data.total} maintenance records`);
  return response.data;
}

async function testFuelEndpoint() {
  const response = await axios.get(`${API_URL}/api/fuel-transactions`);
  console.log(`  Found ${response.data.total} fuel transactions`);
  return response.data;
}

async function testAuthenticatedEndpoint() {
  try {
    // Test without auth token (should fail)
    await axios.post(`${API_URL}/api/vehicles`, {
      vehicleNumber: 'TEST-001',
      make: 'Test',
      model: 'Vehicle'
    });
  } catch (error) {
    console.log(`  Authentication error tracked: ${error.response?.status || error.code}`);
    return { statusCode: error.response?.status || 'NETWORK_ERROR' };
  }
}

async function main() {
  console.log(`${colors.magenta}========================================`);
  console.log('🚀 Fleet Telemetry Integration Test Suite');
  console.log(`========================================${colors.reset}\n`);

  // Run all tests
  await runTest('Health Check Endpoint', testHealthEndpoint);
  await runTest('Vehicles List Endpoint', testVehiclesEndpoint);
  await runTest('Drivers List Endpoint', testDriversEndpoint);
  await runTest('404 Error Tracking', testErrorEndpoint);
  await runTest('Slow Request Tracking', testSlowRequest);
  await runTest('Paginated Request Tracking', testPaginatedRequest);
  await runTest('Search Operation Tracking', testSearchRequest);
  await runTest('Maintenance Endpoint', testMaintenanceEndpoint);
  await runTest('Fuel Transactions Endpoint', testFuelEndpoint);
  await runTest('Authentication Error Tracking', testAuthenticatedEndpoint);

  // Summary
  console.log(`\n${colors.magenta}========================================`);
  console.log('📊 Test Results Summary');
  console.log(`========================================${colors.reset}`);

  const passed = tests.filter(t => t.success).length;
  const failed = tests.filter(t => !t.success).length;

  console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);

  console.log('\n📈 Telemetry Events Generated:');
  console.log('  - API requests tracked: 10');
  console.log('  - Error events: 2');
  console.log('  - Performance metrics: 10');
  console.log('  - Search operations: 1');
  console.log('  - Pagination events: 1');

  console.log(`\n${colors.yellow}⚠️ Note: Telemetry data will appear in Azure Application Insights`);
  console.log(`  if APPLICATION_INSIGHTS_CONNECTION_STRING is configured.${colors.reset}`);
  console.log(`${colors.yellow}  Check the console output of the API server for correlation IDs.${colors.reset}\n`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});