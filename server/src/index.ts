import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import accountsRoutes from './routes/accounts';
import transactionsRoutes from './routes/transactions';
import insightsRoutes from './routes/insights';
import paymentsRoutes from './routes/payments';
import bankConnectionsRoutes from './routes/bank-connections';
// import automationRoutes from './routes/automation'; // Removed in favor of modular automation
import reportsRoutes from './routes/reports';
import teamRoutes from './routes/team';
import authRoutes from './routes/auth';
import companyRoutes from './routes/company';
import ledgerRoutes from './modules/ledger/routes';
import pixRoutes from './modules/payments/pix-routes';
import intelligenceRoutes from './modules/intelligence/intelligence-routes';
import billingRoutes from './modules/billing/billing-routes';
import automationRoutes from './modules/automation/automation-routes';
import expenseRoutes from './modules/expenses/expense-routes';
import creditRoutes from './modules/credit/credit-routes';
import treasuryRoutes from './modules/treasury/treasury-routes';
import aiRoutes from './modules/ai-copilot/routes';
import { errorMiddleware } from './middleware/error';

dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/accounts', accountsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/bank-connections', bankConnectionsRoutes);
// app.use('/api/automations', automationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/pix', pixRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handling
app.use(errorMiddleware);

// Start server
app.listen(port, () => {
    console.log(`[server]: Atlas API is running at http://localhost:${port}`);
});
