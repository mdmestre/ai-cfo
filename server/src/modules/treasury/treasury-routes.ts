import { Router } from 'express';
import { treasuryController } from './treasury-controller';

const router = Router();

router.post('/invest', treasuryController.invest);
router.post('/transfer', treasuryController.transfer);

export default router;
