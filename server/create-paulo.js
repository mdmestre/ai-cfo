const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/notee/Downloads/ATLAS_SaaS/ai-cfo/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function createUser() {
    try {
        // Try to create Paulo
        const email = 'paulo@atlas.com';
        const name = 'Paulo';

        const check = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            console.log('User Paulo already exists.');
            return;
        }

        const userRes = await pool.query(
            "INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id",
            [email, name]
        );
        const userId = userRes.rows[0].id;
        console.log('User Paulo created:', userId);

        const companyRes = await pool.query(
            "INSERT INTO companies (name, owner_id) VALUES ('Paulo Enterprises', $1) RETURNING id",
            [userId]
        );
        console.log('Company Paulo Enterprises created:', companyRes.rows[0].id);

        await pool.query(
            "INSERT INTO accounts (company_id, bank_name, account_type, balance) VALUES ($1, 'Business Prime', 'checking', 500000.00)",
            [companyRes.rows[0].id]
        );
        console.log('Initial account for Paulo created.');

    } catch (err) {
        console.error('Operation failed:', err.message);
    } finally {
        await pool.end();
    }
}

createUser();
