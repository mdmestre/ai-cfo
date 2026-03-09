import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { query } from '../config/db';
import { asyncHandler } from '../middleware/error';

const router = Router();

router.get('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { user } = req;
    const result = await query(
        `SELECT t.* FROM transactions t 
     JOIN accounts a ON t.account_id = a.id 
     JOIN companies c ON a.company_id = c.id 
     WHERE c.owner_id = $1
     ORDER BY t.date DESC`,
        [user.id]
    );
    res.json(result.rows);
}));

router.post('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { account_id, amount, category, description, date } = req.body;
    const result = await query(
        'INSERT INTO transactions (account_id, amount, category, description, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [account_id, amount, category || 'Uncategorized', description || '', date || new Date()]
    );
    res.status(201).json(result.rows[0]);
}));

export default router;
