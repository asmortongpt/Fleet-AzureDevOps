import pool from './src/config/database.js'

async function checkEnum() {
  try {
    const result = await pool.query(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
      ORDER BY enumsortorder
    `)

    console.log('Valid user_role values:')
    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.enumlabel}`)
    })

  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkEnum()
