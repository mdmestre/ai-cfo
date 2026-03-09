import { Router } from 'express';
import { creditController } from './credit-controller';

const router = Router();

router.post('/apply', creditController.applyForCredit);
router.post('/drawdown', creditController.executeDrawdown);

export default router;
