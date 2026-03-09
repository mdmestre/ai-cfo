import { Request, Response } from 'express';
import { ledgerService } from './service';

export class LedgerController {
    async createTransaction(req: Request, res: Response) {
        try {
            const transactionId = await ledgerService.createSafeTransaction(req.body);
            res.status(201).json({ id: transactionId, message: 'Transaction recorded successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getTransaction(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Transaction ID is required' });
            }
            const details = await ledgerService.getTransactionDetails(id);
            res.json(details);
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    }

    async getAccounts(req: Request, res: Response) {
        try {
            const companyId = req.query.companyId as string;

            if (!companyId || typeof companyId !== 'string') {
                return res.status(400).json({ error: 'companyId is required and must be a string' });
            }

            const accounts = await ledgerService.getCompanyAccounts(companyId);
            res.json(accounts);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async reverseTransaction(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Transaction ID is required' });
            }
            const reversalId = await ledgerService.reverseTransaction(id);
            res.status(201).json({ id: reversalId, message: 'Transaction reversed successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async setupInitialAccounts(req: Request, res: Response) {
        try {
            const { companyId } = req.body;
            await ledgerService.bootstrapChartOfAccounts(companyId);
            res.status(201).json({ message: 'Initial chart of accounts created' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const ledgerController = new LedgerController();
