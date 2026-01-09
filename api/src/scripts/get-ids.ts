
import { pool } from '../config/database';

async function getIds() {
    try {
        const tenantRes = await pool.query('SELECT id FROM tenants LIMIT 1');
        const userRes = await pool.query('SELECT id, email FROM users LIMIT 1');

        if (tenantRes.rows.length > 0 && userRes.rows.length > 0) {
            console.log('TENANT_ID=' + tenantRes.rows[0].id);
            console.log('USER_ID=' + userRes.rows[0].id);
            console.log('USER_EMAIL=' + userRes.rows[0].email);
        } else {
            console.log('NO_DATA_FOUND');
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

getIds();
