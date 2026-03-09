import { Request, Response } from 'express';
import { intelligenceService } from './intelligence-service';

export class IntelligenceController {
    async getInsights(req: Request, res: Response) {
        try {
            const { companyId } = req.query;
            if (!companyId || typeof companyId !== 'string') {
                return res.status(400).json({ error: 'companyId is required' });
            }

            const runway = await intelligenceService.calculateCurrentRunway(companyId);
            const health = await intelligenceService.getFinancialHealthScore(companyId);

            res.json({
                runway,
                health,
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const intelligenceController = new IntelligenceController();
