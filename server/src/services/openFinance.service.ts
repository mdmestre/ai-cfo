import pool from '../config/db';

export const OpenFinanceService = {
    async connectBank(companyId: string, provider: string, institution: string) {
        // 1. Simulate authentication with provider (Plaid/Belvo/Open Finance)
        const providerId = `conn_${Math.random().toString(36).substring(2, 11)}`;

        // 2. Save connection details
        const result = await pool.query(
            `INSERT INTO bank_connections (company_id, provider, provider_connection_id, institution_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [companyId, provider, providerId, institution]
        );

        return result.rows[0];
    },

    async syncTransactions(connectionId: string) {
        // Logic to fetch transactions from external API and save to our DB
        console.log(`Syncing transactions for connection ${connectionId}...`);
        return { status: 'success', synced_count: 24 };
    }
};
