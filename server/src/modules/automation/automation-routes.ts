import { Router } from 'express';
import { automationController } from './automation-controller';

const router = Router();

router.post('/rules', automationController.createRule);
router.post('/evaluate', automationController.runEvaluation);

export default router;
