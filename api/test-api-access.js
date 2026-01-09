const jwt = require('jsonwebtoken');
const { Client } = require('pg');

async function testAPIAccess() {
  console.log('🔐 Testing API Database Access...\n');

  // Database connection
  const client = new Client({
    connectionString: 'postgresql://andrewmorton:password@localhost:5432/fleet_db'
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    // Get a sample user
    const userResult = await client.query('SELECT id, email, first_name, last_name, role, tenant_id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    const user = userResult.rows[0];
    console.log('👤 Sample User:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}\n`);

    // Generate JWT token
    const jwtSecret = 'TRIAVUv/KYKAUfamPWgPwebkTLEwNz/CgMqE1y3L/3uqNEIzW1g98pDP07Xoh/Qb'; // From .env
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    console.log('🎫 Generated JWT Token:');
    console.log(token.substring(0, 50) + '...\n');

    // Test data counts
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) FROM vehicles'),
      client.query('SELECT COUNT(*) FROM drivers'),
      client.query('SELECT COUNT(*) FROM work_orders'),
      client.query('SELECT COUNT(*) FROM maintenance_schedules'),
      client.query('SELECT COUNT(*) FROM fuel_transactions')
    ]);

    console.log('📊 Database Counts:');
    console.log(`   Vehicles: ${counts[0].rows[0].count}`);
    console.log(`   Drivers: ${counts[1].rows[0].count}`);
    console.log(`   Work Orders: ${counts[2].rows[0].count}`);
    console.log(`   Maintenance Schedules: ${counts[3].rows[0].count}`);
    console.log(`   Fuel Transactions: ${counts[4].rows[0].count}\n`);

    // Test API endpoint with curl command
    console.log('🧪 Test API Endpoint with:');
    console.log(`\ncurl -H "Authorization: Bearer ${token}" http://localhost:3000/api/vehicles | jq '.[0:2]'\n`);
    console.log('Or test in browser console:');
    console.log(`\nfetch('http://localhost:3000/api/vehicles', {
  headers: { 'Authorization': 'Bearer ${token}' }
}).then(r => r.json()).then(console.log)\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testAPIAccess();
