/**
 * Seed Fuel Transactions Data
 * Creates sample fuel transactions for testing the API
 */

import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://andrewmorton@localhost:5432/fleet_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function seedFuelTransactions() {
  const client = await pool.connect();

  try {
    console.log('⛽ Starting fuel transactions seed...\n');

    // Get tenant ID
    const tenantResult = await client.query('SELECT id FROM tenants LIMIT 1');
    if (tenantResult.rows.length === 0) {
      throw new Error('No tenant found in database');
    }
    const tenantId = tenantResult.rows[0].id;
    console.log(`Using tenant ID: ${tenantId}`);

    // Get vehicle IDs
    const vehiclesResult = await client.query('SELECT id FROM vehicles LIMIT 20');
    if (vehiclesResult.rows.length === 0) {
      throw new Error('No vehicles found in database');
    }
    const vehicleIds = vehiclesResult.rows.map(row => row.id);
    console.log(`Found ${vehicleIds.length} vehicles`);

    // Get driver IDs
    const driversResult = await client.query('SELECT id FROM drivers LIMIT 20');
    const driverIds = driversResult.rows.map(row => row.id);
    console.log(`Found ${driverIds.length} drivers\n`);

    // Generate 100 fuel transactions over the past 90 days
    const fuelTypes = ['gasoline', 'diesel', 'electric', 'hybrid'];
    const vendors = ['Shell', 'BP', 'Exxon', 'Chevron', 'Circle K', 'QuikTrip'];
    const locations = [
      'Tallahassee, FL',
      'Jacksonville, FL',
      'Pensacola, FL',
      'Tampa, FL',
      'Orlando, FL'
    ];

    console.log('Creating 100 fuel transactions...');

    for (let i = 0; i < 100; i++) {
      const vehicleId = vehicleIds[Math.floor(Math.random() * vehicleIds.length)];
      const driverId = Math.random() > 0.2 ? driverIds[Math.floor(Math.random() * driverIds.length)] : null;

      // Random date within last 90 days
      const daysAgo = Math.floor(Math.random() * 90);
      const transactionDate = new Date();
      transactionDate.setDate(transactionDate.getDate() - daysAgo);

      const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
      const gallons = (Math.random() * 20 + 5).toFixed(3); // 5-25 gallons
      const costPerGallon = (Math.random() * 1.5 + 3.0).toFixed(3); // $3.00-$4.50 per gallon
      const totalCost = (parseFloat(gallons) * parseFloat(costPerGallon)).toFixed(2);
      const odometer = Math.floor(Math.random() * 100000 + 10000); // 10,000 - 110,000 miles
      const location = locations[Math.floor(Math.random() * locations.length)];
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const receiptNumber = `RCT-${Date.now()}-${i}`;
      const paymentMethod = Math.random() > 0.5 ? 'fleet_card' : 'credit_card';
      const cardLast4 = Math.floor(Math.random() * 9000 + 1000).toString();

      // Tallahassee coordinates with slight variations
      const latitude = (30.4383 + (Math.random() - 0.5) * 0.1).toFixed(7);
      const longitude = (-84.2807 + (Math.random() - 0.5) * 0.1).toFixed(7);

      await client.query(
        `INSERT INTO fuel_transactions (
          tenant_id, vehicle_id, driver_id, transaction_date, fuel_type,
          gallons, cost_per_gallon, total_cost, odometer, location,
          latitude, longitude, vendor_name, receipt_number, payment_method, card_last4
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          tenantId,
          vehicleId,
          driverId,
          transactionDate,
          fuelType,
          gallons,
          costPerGallon,
          totalCost,
          odometer,
          location,
          latitude,
          longitude,
          vendor,
          receiptNumber,
          paymentMethod,
          cardLast4
        ]
      );

      if ((i + 1) % 20 === 0) {
        console.log(`  Created ${i + 1} transactions...`);
      }
    }

    console.log('\n✅ Successfully created 100 fuel transactions\n');

    // Verify the data
    const countResult = await client.query('SELECT COUNT(*) FROM fuel_transactions');
    console.log(`Total fuel transactions in database: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error seeding fuel transactions:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeder
seedFuelTransactions().catch(console.error);
