import pool from '../../config/db';

export class BillingService {
    async createInvoice(data: any) {
        const result = await pool.query(
            `INSERT INTO public.invoices 
            (company_id, counterparty_id, amount, due_date, type, description)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [data.company_id, data.counterparty_id, data.amount, data.due_date, data.type, data.description]
        );
        return result.rows[0];
    }

    async getCompanyInvoices(companyId: string, type?: 'payable' | 'receivable') {
        let query = 'SELECT * FROM public.invoices WHERE company_id = $1';
        const params: any[] = [companyId];

        if (type) {
            query += ' AND type = $2';
            params.push(type);
        }

        const result = await pool.query(query, params);
        return result.rows;
    }

    async markInvoiceAsPaid(invoiceId: string, transactionId: string) {
        await pool.query(
            'UPDATE public.invoices SET status = $1, ledger_transaction_id = $2 WHERE id = $3',
            ['paid', transactionId, invoiceId]
        );
    }
}

export const billingService = new BillingService();
