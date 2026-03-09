const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function findMissingType() {
    const tables = ['accounts', 'ledger_transactions', 'ledger_entries', 'transactions', 'pix_transactions'];
    for (const table of tables) {
        try {
            const res = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'type'
            `, [table]);
            if (res.rows.length > 0) {
                console.log(`[OK] Table "${table}" HAS "type" column.`);
            } else {
                console.log(`[!!] Table "${table}" MISSING "type" column.`);
            }
        } catch (e) {
            console.log(`[ERROR] Table "${table}" could not be checked: ${e.message}`);
        }
    }
    await pool.end();
}

findMissingType();
