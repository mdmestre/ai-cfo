import pool from '../../config/db';
import { auditService } from '../compliance/audit-service';

export class ExpenseService {
    async createExpense(data: any) {
        const result = await pool.query(
            `INSERT INTO public.expenses 
            (company_id, user_id, amount, currency, category, description, receipt_url, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [data.company_id, data.user_id, data.amount, data.currency || 'BRL', data.category, data.description, data.receipt_url, 'pending']
        );

        await auditService.log({
            companyId: data.company_id,
            action: 'EXPENSE_CREATED',
            resourceType: 'expense',
            resourceId: result.rows[0].id,
            newValues: result.rows[0]
        });

        return result.rows[0];
    }

    async approveExpense(expenseId: string, approverId: string) {
        const expense = await pool.query('SELECT * FROM public.expenses WHERE id = $1', [expenseId]);
        if (!expense.rows[0]) throw new Error('Expense not found');

        await pool.query(
            'UPDATE public.expenses SET status = $1 WHERE id = $2',
            ['approved', expenseId]
        );

        await auditService.log({
            companyId: expense.rows[0].company_id,
            action: 'EXPENSE_APPROVED',
            resourceType: 'expense',
            resourceId: expenseId,
            newValues: { status: 'approved', approver_id: approverId }
        });
    }

    async processOCR(expenseId: string, metadata: any) {
        await pool.query(
            'UPDATE public.expenses SET ocr_metadata = $1 WHERE id = $2',
            [JSON.stringify(metadata), expenseId]
        );
    }
}

export const expenseService = new ExpenseService();
