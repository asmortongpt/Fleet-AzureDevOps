import pool from './src/config/database.js'

async function checkUsers() {
  try {
    // Check if tables exist
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'tenants', 'refresh_tokens')
    `)

    console.log('\n=== Tables Found ===')
    console.log(JSON.stringify(tables.rows, null, 2))

    // Check if any users exist
    const users = await pool.query(`
      SELECT id, email, role, is_active, created_at
      FROM users
      LIMIT 5
    `)

    console.log('\n=== Users ===')
    console.log(JSON.stringify(users.rows, null, 2))

    // Check tenants
    const tenants = await pool.query(`
      SELECT id, name, domain, created_at
      FROM tenants
      LIMIT 5
    `)

    console.log('\n=== Tenants ===')
    console.log(JSON.stringify(tenants.rows, null, 2))

  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkUsers()
