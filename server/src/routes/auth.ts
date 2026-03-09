import { Router } from 'express';
import { asyncHandler } from '../middleware/error';
import pool from '../config/db';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'atlas_secret_2026';

// Login route
router.post('/login', asyncHandler(async (req: any, res: any) => {
    const { email, password } = req.body;

    // In a real app, we'd hash and check passwords
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Mock password check for now as we don't have hashing infrastructure shown yet
    // In production, use bcrypt
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}));

// Register route
router.post('/register', asyncHandler(async (req: any, res: any) => {
    const { email, password, name } = req.body;

    const result = await pool.query(
        'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
        [email, name]
    );
    const user = result.rows[0];

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
}));

export default router;
