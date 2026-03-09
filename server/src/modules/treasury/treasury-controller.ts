import { Request, Response } from 'express';
import { treasuryService } from './treasury-service';

export class TreasuryController {
    async invest(req: Request, res: Response) {
        try {
            const { companyId } = req.body;
            const position = await treasuryService.createPosition(companyId, req.body);
            res.status(201).json(position);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async transfer(req: Request, res: Response) {
        try {
            const { companyId } = req.body;
            const transfer = await treasuryService.initiateGlobalTransfer(companyId, req.body);
            res.status(201).json(transfer);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const treasuryController = new TreasuryController();
