import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import pool from '../config/db';

const router = Router();

router.get('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const companyResult = await pool.query('SELECT id FROM companies WHERE owner_id = $1', [req.user.userId]);
    const companyId = companyResult.rows[0]?.id;

    if (!companyId) return res.json([]);

    const result = await pool.query('SELECT * FROM automations WHERE company_id = $1 ORDER BY created_at DESC', [companyId]);
    res.json(result.rows);
}));

router.post('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { name, trigger_type, condition_data, action_type, action_data } = req.body;
    const companyResult = await pool.query('SELECT id FROM companies WHERE owner_id = $1', [req.user.userId]);
    const companyId = companyResult.rows[0]?.id;

    if (!companyId) return res.status(400).json({ error: 'Company not found' });

    const result = await pool.query(
        `INSERT INTO automations (company_id, name, trigger_type, condition_data, action_type, action_data, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING *`,
        [companyId, name, trigger_type, JSON.stringify(condition_data), action_type, JSON.stringify(action_data)]
    );

    res.status(201).json(result.rows[0]);
}));

router.delete('/:id', authenticateToken, asyncHandler(async (req: any, res: any) => {
    await pool.query('DELETE FROM automations WHERE id = $1', [req.params.id]);
    res.status(204).end();
}));

export default router;
