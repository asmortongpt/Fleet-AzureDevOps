const { chromium } = require('playwright');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

(async () => {
  console.log('🔍 COMPLETE SYSTEM VERIFICATION');
  console.log('================================\n');

  const results = {
    databases: [],
    apiEndpoints: [],
    websockets: [],
    externalServices: [],
    emulators: [],
    fileSystem: [],
    cache: []
  };

  // ==================== DATABASE CONNECTIONS ====================
  console.log('📊 DATABASE CONNECTIONS');
  console.log('=======================\n');

  // PostgreSQL
  try {
    const { stdout } = await execAsync('pg_isready -h localhost -p 5432');
    console.log('✅ PostgreSQL: RUNNING');
    results.databases.push({ name: 'PostgreSQL', status: 'running', port: 5432 });
  } catch (error) {
    console.log('❌ PostgreSQL: NOT RUNNING');
    results.databases.push({ name: 'PostgreSQL', status: 'error', error: error.message });
  }

  // Check for Redis
  try {
    const { stdout } = await execAsync('redis-cli ping 2>&1');
    if (stdout.includes('PONG')) {
      console.log('✅ Redis: RUNNING');
      results.databases.push({ name: 'Redis', status: 'running', port: 6379 });
    } else {
      console.log('⚠️  Redis: NOT CONFIGURED');
      results.databases.push({ name: 'Redis', status: 'not_configured' });
    }
  } catch (error) {
    console.log('⚠️  Redis: NOT RUNNING (optional)');
    results.databases.push({ name: 'Redis', status: 'optional' });
  }

  // ==================== API ENDPOINTS ====================
  console.log('\n📡 API ENDPOINTS');
  console.log('================\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const apiEndpoints = [
    // Core CRUD endpoints
    { url: 'http://localhost:3001/api/vehicles', method: 'GET', category: 'Vehicles' },
    { url: 'http://localhost:3001/api/drivers', method: 'GET', category: 'Drivers' },
    { url: 'http://localhost:3001/api/facilities', method: 'GET', category: 'Facilities' },
    { url: 'http://localhost:3001/api/work-orders', method: 'GET', category: 'Work Orders' },
    { url: 'http://localhost:3001/api/fuel-transactions', method: 'GET', category: 'Fuel' },
    { url: 'http://localhost:3001/api/routes', method: 'GET', category: 'Routes' },

    // Maintenance endpoints
    { url: 'http://localhost:3001/api/maintenance/schedules', method: 'GET', category: 'Maintenance' },
    { url: 'http://localhost:3001/api/maintenance/history', method: 'GET', category: 'Maintenance' },

    // Analytics endpoints
    { url: 'http://localhost:3001/api/analytics/fleet-summary', method: 'GET', category: 'Analytics' },
    { url: 'http://localhost:3001/api/analytics/vehicle-utilization', method: 'GET', category: 'Analytics' },

    // User/Auth endpoints
    { url: 'http://localhost:3001/api/auth/me', method: 'GET', category: 'Auth' },
    { url: 'http://localhost:3001/api/users', method: 'GET', category: 'Users' },

    // Telematics/GPS
    { url: 'http://localhost:3001/api/telematics/live', method: 'GET', category: 'Telematics' },
    { url: 'http://localhost:3001/api/gps/locations', method: 'GET', category: 'GPS' }
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await page.evaluate(async (url) => {
        try {
          const res = await fetch(url);
          return {
            status: res.status,
            ok: res.ok,
            statusText: res.statusText,
            data: res.ok ? await res.json() : null
          };
        } catch (err) {
          return { error: err.message };
        }
      }, endpoint.url);

      if (response.error) {
        console.log(`⚠️  ${endpoint.category}: ${response.error}`);
        results.apiEndpoints.push({ ...endpoint, status: 'error', error: response.error });
      } else if (response.ok) {
        const count = response.data?.data?.length || response.data?.length || 'N/A';
        console.log(`✅ ${endpoint.category}: HTTP ${response.status} (${count} records)`);
        results.apiEndpoints.push({ ...endpoint, status: 'ok', records: count });
      } else {
        console.log(`❌ ${endpoint.category}: HTTP ${response.status} ${response.statusText}`);
        results.apiEndpoints.push({ ...endpoint, status: 'error', httpStatus: response.status });
      }
    } catch (error) {
      console.log(`❌ ${endpoint.category}: ${error.message}`);
      results.apiEndpoints.push({ ...endpoint, status: 'error', error: error.message });
    }
  }

  // ==================== WEBSOCKET CONNECTIONS ====================
  console.log('\n🔌 WEBSOCKET CONNECTIONS');
  console.log('========================\n');

  try {
    const wsResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          const ws = new WebSocket('ws://localhost:3001');

          ws.onopen = () => {
            ws.close();
            resolve({ status: 'connected' });
          };

          ws.onerror = (error) => {
            resolve({ status: 'error', error: 'Connection failed' });
          };

          setTimeout(() => {
            ws.close();
            resolve({ status: 'timeout' });
          }, 2000);
        } catch (error) {
          resolve({ status: 'error', error: error.message });
        }
      });
    });

    if (wsResult.status === 'connected') {
      console.log('✅ WebSocket: WORKING');
      results.websockets.push({ service: 'Main WebSocket', status: 'working', port: 3001 });
    } else {
      console.log('⚠️  WebSocket: NOT AVAILABLE (optional for realtime features)');
      results.websockets.push({ service: 'Main WebSocket', status: 'optional' });
    }
  } catch (error) {
    console.log('⚠️  WebSocket: NOT CONFIGURED');
    results.websockets.push({ service: 'Main WebSocket', status: 'not_configured' });
  }

  // ==================== EXTERNAL SERVICES ====================
  console.log('\n🌐 EXTERNAL SERVICES');
  console.log('====================\n');

  // Google Maps API
  try {
    const mapsTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=<your-google-maps-api-key>';
        script.onload = () => resolve({ status: 'loaded' });
        script.onerror = () => resolve({ status: 'error' });
        document.head.appendChild(script);
        setTimeout(() => resolve({ status: 'timeout' }), 3000);
      });
    });

    if (mapsTest.status === 'loaded') {
      console.log('✅ Google Maps API: ACCESSIBLE');
      results.externalServices.push({ service: 'Google Maps', status: 'accessible' });
    } else {
      console.log('❌ Google Maps API: ERROR');
      results.externalServices.push({ service: 'Google Maps', status: 'error' });
    }
  } catch (error) {
    console.log('❌ Google Maps API: FAILED');
    results.externalServices.push({ service: 'Google Maps', status: 'failed', error: error.message });
  }

  // Azure services check
  console.log('⚠️  Azure AD: Requires authentication (skipping in automated test)');
  results.externalServices.push({ service: 'Azure AD', status: 'requires_auth' });

  // ==================== EMULATORS ====================
  console.log('\n🎮 EMULATORS / SIMULATORS');
  console.log('=========================\n');

  // Check for common emulator ports
  const emulatorChecks = [
    { name: 'OBD2 Emulator', port: 35000 },
    { name: 'GPS Simulator', port: 8080 },
    { name: 'Telematics Simulator', port: 9000 }
  ];

  for (const emulator of emulatorChecks) {
    try {
      const response = await page.evaluate(async (port) => {
        try {
          const res = await fetch(`http://localhost:${port}/status`);
          return { ok: res.ok, status: res.status };
        } catch (err) {
          return { error: err.message };
        }
      }, emulator.port);

      if (response.ok) {
        console.log(`✅ ${emulator.name}: RUNNING (port ${emulator.port})`);
        results.emulators.push({ ...emulator, status: 'running' });
      } else {
        console.log(`⚠️  ${emulator.name}: NOT RUNNING (optional)`);
        results.emulators.push({ ...emulator, status: 'not_running' });
      }
    } catch (error) {
      console.log(`⚠️  ${emulator.name}: NOT CONFIGURED`);
      results.emulators.push({ ...emulator, status: 'not_configured' });
    }
  }

  // ==================== FILE SYSTEM ====================
  console.log('\n📁 FILE SYSTEM');
  console.log('===============\n');

  try {
    const { stdout: apiCheck } = await execAsync('ls api/src 2>&1');
    console.log('✅ API Source: ACCESSIBLE');
    results.fileSystem.push({ path: 'api/src', status: 'accessible' });
  } catch (error) {
    console.log('❌ API Source: NOT FOUND');
    results.fileSystem.push({ path: 'api/src', status: 'not_found' });
  }

  try {
    const { stdout: frontendCheck } = await execAsync('ls src 2>&1');
    console.log('✅ Frontend Source: ACCESSIBLE');
    results.fileSystem.push({ path: 'src', status: 'accessible' });
  } catch (error) {
    console.log('❌ Frontend Source: NOT FOUND');
    results.fileSystem.push({ path: 'src', status: 'not_found' });
  }

  // ==================== SUMMARY ====================
  console.log('\n\n═══════════════════════════════════');
  console.log('📊 SYSTEM VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════\n');

  const working = results.apiEndpoints.filter(e => e.status === 'ok').length;
  const total = results.apiEndpoints.length;
  const dbRunning = results.databases.filter(d => d.status === 'running').length;

  console.log(`✅ Databases Running: ${dbRunning}/${results.databases.length}`);
  console.log(`✅ API Endpoints Working: ${working}/${total}`);
  console.log(`✅ External Services: ${results.externalServices.filter(s => s.status === 'accessible').length}/${results.externalServices.length}`);
  console.log(`✅ WebSockets: ${results.websockets.filter(w => w.status === 'working').length}/${results.websockets.length}`);
  console.log(`⚠️  Emulators Running: ${results.emulators.filter(e => e.status === 'running').length}/${results.emulators.length} (optional)`);

  if (dbRunning > 0 && working > total * 0.7) {
    console.log('\n🎉 SYSTEM STATUS: OPERATIONAL');
    console.log('Core functionality is working correctly.\n');
  } else {
    console.log('\n⚠️  SYSTEM STATUS: DEGRADED');
    console.log('Some services are not responding.\n');
  }

  await browser.close();
})();
