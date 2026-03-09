import pool from '../../config/db';
import { auditService } from '../compliance/audit-service';

export class TreasuryService {
    async createPosition(companyId: string, data: any) {
        const result = await pool.query(
            `INSERT INTO public.treasury_positions (company_id, asset_type, notional_amount, current_yield)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [companyId, data.asset_type, data.amount, data.yield]
        );
        return result.rows[0];
    }

    async initiateGlobalTransfer(companyId: string, data: any) {
        // Logic to calculate target amount based on latest FX rate
        const rateResult = await pool.query('SELECT * FROM public.fx_rates WHERE pair = $1 ORDER BY updated_at DESC LIMIT 1', [`${data.source_ccy}/${data.target_ccy}`]);
        const rate = parseFloat(rateResult.rows[0]?.rate || '1');
        const targetAmount = data.source_amount * rate;

        const result = await pool.query(
            `INSERT INTO public.global_transfers (company_id, source_currency, target_currency, source_amount, target_amount, recipient_metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [companyId, data.source_ccy, data.target_ccy, data.source_amount, targetAmount, JSON.stringify(data.recipient)]
        );

        await auditService.log({
            companyId,
            action: 'GLOBAL_TRANSFER_INITIATED',
            resourceType: 'global_transfer',
            resourceId: result.rows[0].id,
            newValues: { source_amount: data.source_amount, target_amount: targetAmount, ccy: data.target_ccy }
        });

        return result.rows[0];
    }
}

export const treasuryService = new TreasuryService();
