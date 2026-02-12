/**
 * Authenticated API Endpoint Test Script
 * Tests all major API endpoints with proper JWT authentication using FIPS-compliant tokens
 */

import { FIPSJWTService } from '../src/services/fips-jwt.service';

const API_BASE = 'http://localhost:3001/api';
const TENANT_ID = '874954c7-b68b-5485-8ddd-183932497849';
const TEST_USER_ID = 'test-user-001';

// Generate a proper FIPS-compliant test JWT token
function generateTestToken(): string {
    return FIPSJWTService.generateAccessToken(
        TEST_USER_ID,
        'test@ctafleet.com',
        'admin',
        TENANT_ID
    );
}

const TEST_TOKEN = generateTestToken();
console.log('Generated FIPS-compliant test token successfully');

interface TestResult {
    endpoint: string;
    method: string;
    status: number;
    success: boolean;
    error?: string;
    dataPreview?: string;
}

async function testEndpoint(
    method: string,
    endpoint: string,
    description: string,
    body?: any
): Promise<TestResult> {
    const url = `${API_BASE}${endpoint}`;

    try {
        const options: RequestInit = {
            method,
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Tenant-ID': TENANT_ID,
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json().catch(() => null);

        const success = response.status >= 200 && response.status < 400;

        // Create preview of data
        let dataPreview: string | undefined;
        if (success && data) {
            if (Array.isArray(data)) {
                dataPreview = `Array[${data.length}]`;
            } else if (data.data && Array.isArray(data.data)) {
                dataPreview = `Array[${data.data.length}] (paginated)`;
            } else if (typeof data === 'object') {
                dataPreview = Object.keys(data).slice(0, 3).join(', ') + '...';
            }
        }

        const result: TestResult = {
            endpoint,
            method,
            status: response.status,
            success,
            dataPreview,
            error: !success ? (data?.error || data?.message || 'Unknown error') : undefined,
        };

        // Print result
        const icon = success ? '✅' : response.status === 404 ? '⚠️' : '❌';
        const preview = dataPreview ? ` [${dataPreview}]` : '';
        console.log(`${icon} [${method}] ${endpoint} (${response.status}) - ${description}${preview}${result.error ? ` - ${result.error}` : ''}`);

        return result;
    } catch (error) {
        const result: TestResult = {
            endpoint,
            method,
            status: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
        console.log(`❌ [${method}] ${endpoint} (NETWORK ERROR) - ${description} - ${result.error}`);
        return result;
    }
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('CTA Fleet API - FIPS-Authenticated Endpoint Test Suite');
    console.log(`Date: ${new Date().toISOString()}`);
    console.log(`API Base: ${API_BASE}`);
    console.log(`Tenant ID: ${TENANT_ID}`);
    console.log('='.repeat(60));
    console.log('');

    const results: TestResult[] = [];

    // Health Endpoints (no auth required)
    console.log('\n=== Health Endpoints ===');
    results.push(await testEndpoint('GET', '/health', 'API Health Check'));
    results.push(await testEndpoint('GET', '/health/ready', 'Readiness Probe'));
    results.push(await testEndpoint('GET', '/health/live', 'Liveness Probe'));

    // Vehicle Endpoints
    console.log('\n=== Vehicle Endpoints ===');
    results.push(await testEndpoint('GET', '/vehicles', 'List all vehicles'));
    results.push(await testEndpoint('GET', '/vehicles?page=1&pageSize=10', 'Paginated vehicle list'));

    // Work Order Endpoints
    console.log('\n=== Work Order Endpoints ===');
    results.push(await testEndpoint('GET', '/work-orders', 'List work orders'));
    results.push(await testEndpoint('GET', '/work-orders?page=1&pageSize=10', 'Paginated work orders'));

    // Maintenance Endpoints
    console.log('\n=== Maintenance Endpoints ===');
    results.push(await testEndpoint('GET', '/maintenance', 'List maintenance records'));
    results.push(await testEndpoint('GET', '/maintenance-schedules', 'List maintenance schedules'));

    // Driver Endpoints
    console.log('\n=== Driver Endpoints ===');
    results.push(await testEndpoint('GET', '/drivers', 'List drivers'));

    // Facility Endpoints
    console.log('\n=== Facility Endpoints ===');
    results.push(await testEndpoint('GET', '/facilities', 'List facilities'));

    // Parts & Inventory
    console.log('\n=== Parts & Inventory Endpoints ===');
    results.push(await testEndpoint('GET', '/parts', 'List parts'));
    results.push(await testEndpoint('GET', '/inventory', 'List inventory'));
    results.push(await testEndpoint('GET', '/inventory/categories', 'Inventory categories'));

    // Vendors
    console.log('\n=== Vendor Endpoints ===');
    results.push(await testEndpoint('GET', '/vendors', 'List vendors'));

    // Invoices
    console.log('\n=== Invoice Endpoints ===');
    results.push(await testEndpoint('GET', '/invoices', 'List invoices'));

    // Purchase Orders
    console.log('\n=== Purchase Order Endpoints ===');
    results.push(await testEndpoint('GET', '/purchase-orders', 'List purchase orders'));

    // Tasks
    console.log('\n=== Task Endpoints ===');
    results.push(await testEndpoint('GET', '/tasks', 'List tasks'));

    // Routes
    console.log('\n=== Route Endpoints ===');
    results.push(await testEndpoint('GET', '/routes', 'List routes'));

    // Dashboard
    console.log('\n=== Dashboard Endpoints ===');
    results.push(await testEndpoint('GET', '/dashboard/stats', 'Dashboard stats'));
    results.push(await testEndpoint('GET', '/dashboard/fleet-metrics', 'Fleet metrics'));

    // Fuel
    console.log('\n=== Fuel Endpoints ===');
    results.push(await testEndpoint('GET', '/fuel-transactions', 'Fuel transactions'));
    results.push(await testEndpoint('GET', '/fuel-purchasing', 'Fuel purchasing'));

    // GPS & Telematics
    console.log('\n=== GPS & Telematics Endpoints ===');
    results.push(await testEndpoint('GET', '/gps', 'GPS data'));
    results.push(await testEndpoint('GET', '/telematics', 'Telematics data'));

    // Compliance & Safety
    console.log('\n=== Compliance & Safety Endpoints ===');
    results.push(await testEndpoint('GET', '/compliance', 'Compliance records'));
    results.push(await testEndpoint('GET', '/safety-alerts', 'Safety alerts'));
    results.push(await testEndpoint('GET', '/safety-incidents', 'Safety incidents'));

    // Trips
    console.log('\n=== Trip Endpoints ===');
    results.push(await testEndpoint('GET', '/trips', 'List trips'));

    // Analytics
    console.log('\n=== Analytics Endpoints ===');
    results.push(await testEndpoint('GET', '/analytics', 'Analytics summary'));
    results.push(await testEndpoint('GET', '/analytics/fleet-performance', 'Fleet performance'));

    // Alerts
    console.log('\n=== Alert Endpoints ===');
    results.push(await testEndpoint('GET', '/alerts', 'System alerts'));

    // Reports
    console.log('\n=== Report Endpoints ===');
    results.push(await testEndpoint('GET', '/reports', 'Available reports'));

    // Geofences
    console.log('\n=== Geofence Endpoints ===');
    results.push(await testEndpoint('GET', '/geofences', 'List geofences'));

    // Reservations
    console.log('\n=== Reservation Endpoints ===');
    results.push(await testEndpoint('GET', '/reservations', 'List reservations'));

    // Print Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success && r.status !== 404).length;
    const notFound = results.filter(r => r.status === 404).length;

    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Not Found (404): ${notFound}`);
    console.log('='.repeat(60));

    // List failed endpoints with details
    if (failed > 0) {
        console.log('\n❌ FAILED ENDPOINTS:');
        results.filter(r => !r.success && r.status !== 404).forEach(r => {
            console.log(`  - ${r.endpoint} (${r.status}): ${r.error}`);
        });
    }

    // List missing endpoints
    if (notFound > 0) {
        console.log('\n⚠️  MISSING ENDPOINTS (404):');
        results.filter(r => r.status === 404).forEach(r => {
            console.log(`  - ${r.endpoint}`);
        });
    }

    // Exit with error if any tests failed
    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(console.error);
