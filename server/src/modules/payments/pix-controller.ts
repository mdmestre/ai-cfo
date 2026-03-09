import { Request, Response } from 'express';
import { pixService } from './pix-service';

export class PixController {
    async generateQR(req: Request, res: Response) {
        try {
            const { companyId, amount, description } = req.body;
            if (!companyId || !amount) {
                return res.status(400).json({ error: 'companyId and amount are required' });
            }
            const qr = await pixService.generateDynamicQR(companyId, amount, description);
            res.status(201).json(qr);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async registerKey(req: Request, res: Response) {
        try {
            const { companyId, type, value } = req.body;
            const key = await pixService.registerKey(companyId, type, value);
            res.status(201).json(key);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async executeTransfer(req: Request, res: Response) {
        try {
            const transfer = await pixService.transferOut(req.body);
            res.status(201).json(transfer);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async handleWebhook(req: Request, res: Response) {
        try {
            // In a real scenario, validate HMAC/signature here
            const result = await pixService.processWebhook(req.body);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const pixController = new PixController();
