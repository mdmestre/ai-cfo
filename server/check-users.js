const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/notee/Downloads/ATLAS_SaaS/ai-cfo/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function check() {
    try {
        const res = await pool.query('SELECT id, email, name FROM users');
        console.log('Users in DB:', res.rows);
    } catch (err) {
        console.error('Check failed:', err.message);
    } finally {
        await pool.end();
    }
}

check();
