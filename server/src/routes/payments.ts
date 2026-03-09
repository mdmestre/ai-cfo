import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PixService } from '../services/pix.service';
import { asyncHandler } from '../middleware/error';

const router = Router();

router.post('/pix', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { amount, description, company_id } = req.body;
    if (!amount || !company_id) {
        return res.status(400).json({ error: 'Amount and Company ID are required' });
    }
    const result = await PixService.generateQrCode(amount, description, company_id);
    res.status(201).json(result);
}));

export default router;
