import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import pool from '../config/db';

const router = Router();

// Get team members
router.get('/', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const companyResult = await pool.query('SELECT id FROM companies WHERE owner_id = $1', [req.user.userId]);
    const companyId = companyResult.rows[0]?.id;

    if (!companyId) return res.json([]);

    // For now, return the owner as the sole member until we implement user invites/roles table
    const result = await pool.query(
        `SELECT u.id, u.name, u.email, 'Owner' as role 
         FROM users u 
         JOIN companies c ON c.owner_id = u.id 
         WHERE c.id = $1`,
        [companyId]
    );
    res.json(result.rows);
}));

// Placeholder for inviting members
router.post('/invite', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { email, role } = req.body;
    // Simulation logic
    res.json({ success: true, message: `Invite sent to ${email} for role ${role}` });
}));

export default router;
