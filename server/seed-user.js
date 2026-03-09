const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/notee/Downloads/ATLAS_SaaS/ai-cfo/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function seed() {
    try {
        const userRes = await pool.query(
            "INSERT INTO users (email, name) VALUES ('admin@atlas.com', 'Admin User') RETURNING id"
        );
        const userId = userRes.rows[0].id;
        console.log('User created:', userId);

        const companyRes = await pool.query(
            "INSERT INTO companies (name, owner_id) VALUES ('Atlas SaaS Corp', $1) RETURNING id",
            [userId]
        );
        console.log('Company created:', companyRes.rows[0].id);

        // Add a mock account to get them started
        await pool.query(
            "INSERT INTO accounts (company_id, bank_name, account_type, balance) VALUES ($1, 'Atlas Reserve', 'checking', 250000.00)",
            [companyRes.rows[0].id]
        );
        console.log('Initial account created.');

    } catch (err) {
        console.error('Seed failed:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
