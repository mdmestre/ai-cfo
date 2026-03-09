const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'accounts'
        `);
        console.log('Columns for accounts:');
        res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
    } finally {
        await pool.end();
    }
}

run();
