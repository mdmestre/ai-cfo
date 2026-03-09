import pool from '../../config/db';
import { eventDispatcher } from '../events/event-dispatcher';

export class PixService {
    async generateDynamicQR(companyId: string, amount: number, description: string) {
        const txid = `ATLAS${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const payload = `00020126580014BR.GOV.BCB.PIX0136${txid}520400005303986540${amount.toFixed(2)}5802BR5913ATLAS FINTECH6009SAO PAULO62070503***6304`;

        const result = await pool.query(
            `INSERT INTO public.pix_qr_codes (company_id, amount, description, txid, payload)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [companyId, amount, description, txid, payload]
        );

        return result.rows[0];
    }

    async processWebhook(payload: any) {
        const { txid, amount, endToEndId, companyId } = payload;

        await pool.query(
            `UPDATE public.pix_qr_codes SET status = 'paid' WHERE txid = $1`,
            [txid]
        );

        const inboundResult = await pool.query(
            `INSERT INTO public.pix_inbound (company_id, amount, txid, e2e_id, received_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id`,
            [companyId, amount, txid, endToEndId]
        );

        await eventDispatcher.dispatchPixReceived(inboundResult.rows[0].id, companyId, amount);

        return { success: true };
    }

    async registerKey(companyId: string, type: string, value: string) {
        const result = await pool.query(
            `INSERT INTO public.pix_keys (company_id, key_type, key_value)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [companyId, type, value]
        );
        return result.rows[0];
    }

    async transferOut(data: any) {
        const result = await pool.query(
            `INSERT INTO public.pix_outbound 
            (company_id, amount, recipient_key_type, recipient_key_value, recipient_name, recipient_tax_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [data.company_id, data.amount, data.key_type, data.key_value, data.name, data.tax_id]
        );

        await eventDispatcher.dispatch('pix_outbound_events', {
            action: 'pix.transfer_initiated',
            outboundId: result.rows[0].id,
            ...data
        });

        return result.rows[0];
    }
}

export const pixService = new PixService();
