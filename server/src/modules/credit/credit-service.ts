import pool from '../../config/db';
import { intelligenceService } from '../intelligence/intelligence-service';
import { auditService } from '../compliance/audit-service';

export class CreditService {
    async submitForUnderwriting(companyId: string, amount: number) {
        // 1. Get health score from intelligence module
        const health = await intelligenceService.getFinancialHealthScore(companyId);

        let status = 'pending';
        // Auto-approve logic for high scores
        if (health.score > 85 && amount < 100000) {
            status = 'approved';
        }

        const result = await pool.query(
            `INSERT INTO public.underwriting_submissions 
            (company_id, requested_amount, status, score_snapshot, decision_metadata)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [companyId, amount, status, health.score, JSON.stringify(health.factors)]
        );

        if (status === 'approved') {
            await this.initiateCreditLine(companyId, amount);
        }

        return result.rows[0];
    }

    async initiateCreditLine(companyId: string, limit: number) {
        await pool.query(
            `INSERT INTO public.credit_lines (company_id, total_limit, interest_rate)
            VALUES ($1, $2, 12.5)`, // Default 12.5% interest
            [companyId, limit]
        );
    }

    async drawdown(companyId: string, amount: number) {
        const line = await pool.query('SELECT * FROM public.credit_lines WHERE company_id = $1 AND status = $2', [companyId, 'active']);
        if (!line.rows[0]) throw new Error('No active credit line found');

        const available = line.rows[0].total_limit - line.rows[0].utilized_amount;
        if (amount > available) throw new Error('Insufficient credit limit');

        // Logic here would trigger a Ledger transaction to move funds from Credit Asset -> Cash
        await pool.query(
            'UPDATE public.credit_lines SET utilized_amount = utilized_amount + $1 WHERE id = $2',
            [amount, line.rows[0].id]
        );

        const drawdownResult = await pool.query(
            'INSERT INTO public.credit_drawdowns (credit_line_id, amount) VALUES ($1, $2) RETURNING *',
            [line.rows[0].id, amount]
        );

        await auditService.log({
            companyId,
            action: 'CREDIT_DRAWDOWN',
            resourceType: 'credit_drawdown',
            resourceId: drawdownResult.rows[0].id,
            newValues: { amount }
        });

        return drawdownResult.rows[0];
    }
}

export const creditService = new CreditService();
