const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkColumns(tableName) {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = $1
        `, [tableName]);
        console.log(`--- ${tableName.toUpperCase()} ---`);
        const columns = res.rows.map(row => `- ${row.column_name} (${row.data_type})`);
        console.log(columns.join('\n'));
    } catch (err) {
        console.error(`Error checking columns for ${tableName}:`, err);
    }
}

async function run() {
    await checkColumns('accounts');
    await checkColumns('transactions');
    await checkColumns('ledger_transactions');
    await checkColumns('ledger_entries');
    await checkColumns('pix_transactions');
    await pool.end();
}

run();
