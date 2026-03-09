import pool from '../../config/db';
import { Account, LedgerTransaction, LedgerEntry, CreateTransactionRequest, TransactionStatus } from './types';

export class LedgerRepository {
    async createTransactionWithEntries(data: CreateTransactionRequest): Promise<string> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Create the high-level transaction
            const txResult = await client.query(
                `INSERT INTO public.ledger_transactions 
                (company_id, type, description, metadata) 
                VALUES ($1, $2, $3, $4) 
                RETURNING id`,
                [data.company_id, data.type, data.description, JSON.stringify(data.metadata || {})]
            );
            const transactionId = txResult.rows[0].id;

            // 2. Create the double-entry rows
            for (const entry of data.entries) {
                await client.query(
                    `INSERT INTO public.ledger_entries 
                    (transaction_id, company_id, account_id, debit, credit, currency) 
                    VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        transactionId,
                        data.company_id,
                        entry.account_id,
                        entry.debit,
                        entry.credit,
                        entry.currency || 'BRL'
                    ]
                );
            }

            await client.query('COMMIT');
            return transactionId;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getTransactionById(id: string): Promise<LedgerTransaction | null> {
        const result = await pool.query('SELECT * FROM public.ledger_transactions WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    async getEntriesByTransactionId(transactionId: string): Promise<LedgerEntry[]> {
        const result = await pool.query('SELECT * FROM public.ledger_entries WHERE transaction_id = $1', [transactionId]);
        return result.rows;
    }

    async updateTransactionStatus(id: string, status: TransactionStatus): Promise<void> {
        await pool.query('UPDATE public.ledger_transactions SET status = $1 WHERE id = $2', [status, id]);
    }

    async getAccountsByCompany(companyId: string): Promise<Account[]> {
        const result = await pool.query('SELECT * FROM public.accounts WHERE company_id = $1', [companyId]);
        return result.rows;
    }

    async createAccount(companyId: string, name: string, type: string, code?: string): Promise<Account> {
        const result = await pool.query(
            `INSERT INTO public.accounts (company_id, name, type, code) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *`,
            [companyId, name, type, code]
        );
        return result.rows[0];
    }
}

export const ledgerRepository = new LedgerRepository();
