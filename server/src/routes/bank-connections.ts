import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { OpenFinanceService } from '../services/openFinance.service';
import { asyncHandler } from '../middleware/error';
import pool from '../config/db';

const router = Router();

router.get('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const companyResult = await pool.query('SELECT id FROM companies WHERE owner_id = $1 LIMIT 1', [req.user.userId]);
    const companyId = companyResult.rows[0]?.id;

    if (!companyId) return res.json([]);

    const result = await pool.query('SELECT * FROM bank_connections WHERE company_id = $1', [companyId]);
    res.json(result.rows);
}));

router.post('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { provider, institution } = req.body;
    const companyResult = await pool.query('SELECT id FROM companies WHERE owner_id = $1 LIMIT 1', [req.user.userId]);
    const companyId = companyResult.rows[0]?.id;

    if (!companyId) return res.status(400).json({ error: 'Company not found' });

    const result = await OpenFinanceService.connectBank(companyId, provider, institution);
    res.status(201).json(result);
}));

router.post('/:id/sync', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const result = await OpenFinanceService.syncTransactions(req.params.id);
    res.json(result);
}));

export default router;
