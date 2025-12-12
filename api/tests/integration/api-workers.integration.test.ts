
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTestDatabase, cleanupTestDatabase } from '../helpers/test-db';
import { startTestServer } from '../helpers/test-server';
import { queueManager } from '../../src/jobs/queueManager';

describe('API and Workers Integration Tests', () => {
  let testDb;
  let server;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    server = await startTestServer(testDb);
  });

  afterAll(async () => {
    await server.close();
    await cleanupTestDatabase(testDb);
  });

  it('should process vehicle telemetry through worker queue', async () => {
    // Create vehicle via API
    const vehicleResponse = await request(server)
      .post('/api/v1/vehicles')
      .send({ vin: 'TEST123', make: 'Tesla', model: 'Model 3' })
      .expect(201);

    // Queue telemetry processing job
    const job = await queueManager.addJob('telemetry', {
      vehicleId: vehicleResponse.body.id,
      data: { speed: 65, location: { lat: 30.2672, lng: -97.7431 } }
    });

    // Wait for worker to process
    await job.finished();

    // Verify data was processed and stored
    const telemetry = await testDb.query(
      'SELECT * FROM vehicle_telemetry WHERE vehicle_id = $1',
      [vehicleResponse.body.id]
    );

    expect(telemetry.rows).toHaveLength(1);
    expect(telemetry.rows[0].speed).toBe(65);
  });

  it('should handle API-to-Worker-to-Database flow for maintenance alerts', async () => {
    // Test complete flow from API endpoint through worker to database
    const response = await request(server)
      .post('/api/v1/maintenance/check')
      .send({ vehicleId: 123, mileage: 50000 })
      .expect(200);

    expect(response.body.alertQueued).toBe(true);

    // Worker should process and create maintenance record
    await new Promise(resolve => setTimeout(resolve, 1000));

    const alerts = await testDb.query(
      'SELECT * FROM maintenance_alerts WHERE vehicle_id = $1',
      [123]
    );

    expect(alerts.rows.length).toBeGreaterThan(0);
  });
});
