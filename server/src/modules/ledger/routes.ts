import { Router } from 'express';
import { ledgerController } from './controller';

const router = Router();

router.post('/transactions', ledgerController.createTransaction);
router.get('/transactions/:id', ledgerController.getTransaction);
router.post('/transactions/:id/reverse', ledgerController.reverseTransaction);
router.get('/accounts', ledgerController.getAccounts);
router.post('/accounts/bootstrap', ledgerController.setupInitialAccounts);

export default router;
