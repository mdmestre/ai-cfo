import pool from '../config/db';

export const PixService = {
    async generateQrCode(amount: number, description: string, companyId: string) {
        // 1. Simulate generation of a TXID and QR Code
        const txid = Math.random().toString(36).substring(2, 27).toUpperCase();
        const qrCodeString = `00020126580014BR.GOV.BCB.PIX0136${txid}5204000053039865404${amount.toFixed(2)}5802BR5913ATLAS FINTECH6008SAO PAULO62070503***6304`;

        // 2. Create the payment record
        const paymentResult = await pool.query(
            `INSERT INTO payments (company_id, amount, status, recipient_name, due_date, payment_method)
       VALUES ($1, $2, 'pending', 'Atlas System', CURRENT_DATE, 'pix')
       RETURNING *`,
            [companyId, amount]
        );

        const payment = paymentResult.rows[0];

        // 3. Create the Pix metadata record
        await pool.query(
            `INSERT INTO pix_transactions (payment_id, txid, qr_code_string)
       VALUES ($1, $2, $3)`,
            [payment.id, txid, qrCodeString]
        );

        return {
            paymentId: payment.id,
            txid,
            qrCodeString,
            amount
        };
    }
};
