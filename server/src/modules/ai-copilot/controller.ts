import { Request, Response } from 'express';
import { aiService } from './service';

export class AiController {
    async chat(req: Request, res: Response) {
        try {
            const { companyId, message } = req.body;

            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }

            if (!companyId) {
                return res.status(400).json({ error: 'companyId is required' });
            }

            const reply = await aiService.generateFinancialReply(companyId, message);
            res.json({ reply });
        } catch (error: any) {
            console.error('[ai-chat]: Error', error);
            res.status(500).json({ error: error.message || 'Internal server error while processing AI request' });
        }
    }
}

export const aiController = new AiController();
