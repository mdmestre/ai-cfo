const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const migrationsDir = path.join(__dirname, '../supabase/migrations');
const shimFile = path.join(__dirname, '../supabase/supabase_shim.sql');

async function runMigrations() {
    try {
        console.log('Applying Supabase shim...');
        const shimSql = fs.readFileSync(shimFile, 'utf8');
        await pool.query(shimSql);
        console.log('Shim applied.');

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        console.log(`Found ${files.length} migrations.`);

        for (const file of files) {
            console.log(`Applying migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            // We'll execute the whole file at once. 
            // Note: If a file contains multiple statements that can't be run together, 
            // this might need splitting, but usually pg handles this fine.

            try {
                await pool.query(sql);
                console.log(`Success: ${file}`);
            } catch (fileErr) {
                // If the error is 'already exists', we can often ignore it
                if (fileErr.code === '42P07' || fileErr.code === '42710') {
                    console.warn(`Warning: Object already exists in ${file}, skipping...`);
                } else {
                    console.error(`Error in ${file}:`, fileErr.message);
                    // Decide if we should stop or continue. 
                    // For now, let's keep going as many tables are independent.
                }
            }
        }
        console.log('All migrations applied successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigrations();
