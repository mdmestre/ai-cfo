import { Router } from 'express';
import { expenseController } from './expense-controller';

const router = Router();

router.post('/', expenseController.createExpense);
router.post('/:id/approve', expenseController.approveExpense);

export default router;
