import { Request, Response } from 'express';
import { expenseService } from './expense-service';

export class ExpenseController {
    async createExpense(req: Request, res: Response) {
        try {
            const expense = await expenseService.createExpense(req.body);
            res.status(201).json(expense);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async approveExpense(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { approverId } = req.body;
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Expense ID is required' });
            }
            await expenseService.approveExpense(id, approverId);
            res.json({ message: 'Expense approved' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const expenseController = new ExpenseController();
