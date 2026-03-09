import { Request, Response } from 'express';
import { billingService } from './billing-service';

export class BillingController {
    async createInvoice(req: Request, res: Response) {
        try {
            const invoice = await billingService.createInvoice(req.body);
            res.status(201).json(invoice);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getInvoices(req: Request, res: Response) {
        try {
            const companyId = req.query.companyId as string;
            const type = req.query.type as 'payable' | 'receivable';

            if (!companyId) return res.status(400).json({ error: 'companyId is required' });

            const invoices = await billingService.getCompanyInvoices(companyId, type);
            res.json(invoices);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const billingController = new BillingController();
