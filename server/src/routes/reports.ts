import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import pool from '../config/db';

const router = Router();

// Export transactions as CSV
router.get('/export/csv', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const companyResult = await pool.query('SELECT id FROM companies WHERE owner_id = $1', [req.user.userId]);
    const companyId = companyResult.rows[0]?.id;

    if (!companyId) return res.status(400).json({ error: 'Company not found' });

    const transactions = await pool.query(
        `SELECT t.*, a.name as account_name FROM transactions t 
         JOIN accounts a ON t.account_id = a.id 
         WHERE a.company_id = $1 
         ORDER BY t.date DESC`,
        [companyId]
    );

    let csv = 'Date,Description,Amount,Category,Account,Status\n';
    transactions.rows.forEach(t => {
        csv += `${t.date},"${t.description}",${t.amount},${t.category},"${t.account_name}",${t.status}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=atlas_report_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
}));

// Placeholder for PDF export (will return a JSON summary for now, or simulate PDF download)
router.get('/summary', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const companyResult = await pool.query('SELECT id FROM companies WHERE owner_id = $1', [req.user.userId]);
    const companyId = companyResult.rows[0]?.id;

    const stats = await pool.query(
        `SELECT 
            COUNT(*) as total_tx,
            SUM(amount) FILTER (WHERE amount > 0) as total_inflow,
            SUM(amount) FILTER (WHERE amount < 0) as total_outflow,
            AVG(amount) as avg_tx
         FROM transactions t
         JOIN accounts a ON t.account_id = a.id
         WHERE a.company_id = $1`,
        [companyId]
    );

    res.json({
        generatedAt: new Date(),
        companyId,
        stats: stats.rows[0],
        formatOptions: ['CSV', 'PDF', 'XLSX']
    });
}));

export default router;
