const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function verify() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('ledger_entries', 'ledger_transactions', 'pix_keys', 'wallets')
        `);
        console.log('Confirmed Tables:', res.rows.map(r => r.table_name));
    } catch (err) {
        console.error('Final verification error:', err);
    } finally {
        await pool.end();
    }
}

verify();
