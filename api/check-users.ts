import pool from './src/config/database.js'

interface TableRow {
  table_name: string;
}

interface UserRow {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: Date;
}

interface TenantRow {
  id: string;
  name: string;
  domain: string;
  created_at: Date;
}

async function checkUsers() {
  try {
    // Check if tables exist
    const tables = await pool.query<TableRow>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'tenants', 'refresh_tokens')
    `)

    console.log('\n=== Tables Found ===')
    console.log(JSON.stringify(tables.rows, null, 2))

    // Check if any users exist
    const users = await pool.query<UserRow>(`
      SELECT id, email, role, is_active, created_at
      FROM users
      LIMIT 5
    `)

    console.log('\n=== Users ===')
    console.log(JSON.stringify(users.rows, null, 2))

    // Check tenants
    const tenants = await pool.query<TenantRow>(`
      SELECT id, name, domain, created_at
      FROM tenants
      LIMIT 5
    `)

    console.log('\n=== Tenants ===')
    console.log(JSON.stringify(tenants.rows, null, 2))

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error:', errorMessage)
  } finally {
    await pool.end()
  }
}

checkUsers()
