import { Request, Response } from 'express';
import { creditService } from './credit-service';

export class CreditController {
    async applyForCredit(req: Request, res: Response) {
        try {
            const { companyId, amount } = req.body;
            const submission = await creditService.submitForUnderwriting(companyId, amount);
            res.status(201).json(submission);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async executeDrawdown(req: Request, res: Response) {
        try {
            const { companyId, amount } = req.body;
            const drawdown = await creditService.drawdown(companyId, amount);
            res.status(201).json(drawdown);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const creditController = new CreditController();
