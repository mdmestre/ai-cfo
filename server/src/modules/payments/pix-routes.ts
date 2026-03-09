import { Router } from 'express';
import { pixController } from './pix-controller';

const router = Router();

router.post('/qr', pixController.generateQR);
router.post('/keys', pixController.registerKey);
router.post('/transfer', pixController.executeTransfer);
router.post('/webhook', pixController.handleWebhook);

export default router;
