import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AiService } from '../services/ai.service';
import { asyncHandler } from '../middleware/error';

const router = Router();

router.get('/insights/:companyId', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { companyId } = req.params;
    const result = await AiService.analyzeCashFlow(companyId);
    res.json(result);
}));

router.post('/chat', authenticateToken, asyncHandler(async (req: any, res: any) => {
    const { message, company_id } = req.body;
    const result = await AiService.chat(company_id, message);
    res.json(result);
}));

export default router;
