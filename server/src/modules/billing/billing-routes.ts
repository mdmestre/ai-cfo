import { Router } from 'express';
import { billingController } from './billing-controller';

const router = Router();

router.post('/invoices', billingController.createInvoice);
router.get('/invoices', billingController.getInvoices);

export default router;
