import pool from '../../config/db';

export class IntelligenceService {
    async calculateCurrentRunway(companyId: string): Promise<{ days: number, burnRate: number }> {
        // Simple burn rate calculation based on last 3 months
        const result = await pool.query(
            `WITH monthly_burn AS (
                SELECT 
                    date_trunc('month', created_at) as month,
                    SUM(debit) as outflow
                FROM public.ledger_entries
                WHERE company_id = $1 
                AND account_id IN (SELECT id FROM public.accounts WHERE type = 'EXPENSE')
                AND created_at > NOW() - INTERVAL '3 months'
                GROUP BY 1
            )
            SELECT AVG(outflow) as avg_burn FROM monthly_burn`,
            [companyId]
        );

        const avgBurn = parseFloat(result.rows[0]?.avg_burn || '0');

        // Get current total cash
        const cashResult = await pool.query(
            `SELECT SUM(debit - credit) as total_cash 
            FROM public.ledger_entries 
            WHERE company_id = $1 
            AND account_id IN (SELECT id FROM public.accounts WHERE type = 'ASSET' AND name ILIKE '%Cash%')`,
            [companyId]
        );

        const totalCash = parseFloat(cashResult.rows[0]?.total_cash || '0');

        if (avgBurn <= 0) return { days: 9999, burnRate: 0 };
        const days = (totalCash / (avgBurn / 30));

        return { days: Math.round(days), burnRate: avgBurn };
    }

    async getFinancialHealthScore(companyId: string) {
        // Logic to calculate score based on runway, debt-to-equity, etc.
        // For early modular demo, we analyze cash vs expenses ratio
        const runway = await this.calculateCurrentRunway(companyId);

        let score = 50; // Base score
        if (runway.days > 180) score += 30;
        else if (runway.days > 90) score += 15;

        if (runway.burnRate === 0) score += 20;

        return {
            score: Math.min(score, 100),
            factors: {
                runway_days: runway.days,
                burn_rate: runway.burnRate
            }
        };
    }
}

export const intelligenceService = new IntelligenceService();
