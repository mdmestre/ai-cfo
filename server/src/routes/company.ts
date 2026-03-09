import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import pool from '../config/db';

const router = Router();

// Get the logged-in user's company
router.get('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
    // Check for both id and userId due to inconsistency in other routes
    const userId = req.user.userId || req.user.id;

    const result = await pool.query(
        'SELECT * FROM companies WHERE owner_id = $1',
        [userId]
    );

    if (result.rows.length === 0) {
        return res.json(null);
    }

    res.json(result.rows[0]);
}));

// Create a new company
router.post('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { name } = req.body;
    const userId = req.user.userId || req.user.id;

    const result = await pool.query(
        'INSERT INTO companies (name, owner_id) VALUES ($1, $2) RETURNING *',
        [name, userId]
    );

    res.status(201).json(result.rows[0]);
}));

export default router;
