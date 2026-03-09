import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { query } from '../config/db';
import { asyncHandler } from '../middleware/error';

const router = Router();

router.get('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { user } = req;
    const result = await query(
        `SELECT a.* FROM accounts a 
     JOIN companies c ON a.company_id = c.id 
     WHERE c.owner_id = $1`,
        [user.id]
    );
    res.json(result.rows);
}));

router.post('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { company_id, bank_name, account_type, balance } = req.body;
    const result = await query(
        'INSERT INTO accounts (company_id, bank_name, account_type, balance) VALUES ($1, $2, $3, $4) RETURNING *',
        [company_id, bank_name, account_type, balance]
    );
    res.status(201).json(result.rows[0]);
}));

export default router;
