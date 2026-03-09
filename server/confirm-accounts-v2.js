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
        console.log('--- ACCOUNTS TABLE COLUMNS ---');
        const columns = res.rows.map(r => r.column_name);
        console.log(JSON.stringify(columns, null, 2));

        if (columns.includes('type')) {
            console.log('SUCCESS: "type" column exists');
        } else {
            console.log('FAILURE: "type" column MISSING');
        }
    } finally {
        await pool.end();
    }
}

run();
