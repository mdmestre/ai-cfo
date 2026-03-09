import { Request, Response } from 'express';
import { automationService } from './automation-service';

export class AutomationController {
    async createRule(req: Request, res: Response) {
        try {
            const { companyId } = req.body;
            const rule = await automationService.createRule(companyId, req.body);
            res.status(201).json(rule);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async runEvaluation(req: Request, res: Response) {
        try {
            const { companyId } = req.body;
            await automationService.evaluateAllRules(companyId);
            res.json({ message: 'Automation evaluation triggered' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const automationController = new AutomationController();
