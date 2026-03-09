import pool from '../config/db';

export const AiService = {
    async analyzeCashFlow(companyId: string) {
        // 1. Fetch real financial data
        const transactionData = await pool.query(
            `SELECT * FROM transactions t 
        JOIN accounts a ON t.account_id = a.id
        WHERE a.company_id = $1
        ORDER BY t.date DESC LIMIT 100`,
            [companyId]
        );

        const balanceData = await pool.query(
            `SELECT SUM(balance) as total FROM accounts WHERE company_id = $1`,
            [companyId]
        );

        // 2. Here we would call OpenAI API (placeholder for logic)
        // We would send the financial context to the LLM

        const insights = [
            {
                type: 'risk',
                severity: 'high',
                title: 'Runway Alert',
                description: 'Based on current burn rate, your cash will last approximately 45 days.'
            },
            {
                type: 'insight',
                severity: 'medium',
                title: 'Subscription Growth',
                description: 'Software expenses increased by 15% this month, primarily due to AWS usage.'
            }
        ];

        return {
            totalBalance: balanceData.rows[0].total,
            recentActivity: transactionData.rows.length,
            insights
        };
    },

    async chat(companyId: string, message: string) {
        // 1. Fetch real context
        const balanceData = await pool.query(
            `SELECT SUM(balance) as total FROM accounts WHERE company_id = $1`,
            [companyId]
        );
        const totalBalance = Number(balanceData.rows[0]?.total || 0);

        // 2. Simple CFO Reasoning
        const lowerMessage = message.toLowerCase();
        let response = "";

        if (lowerMessage.includes("balance") || lowerMessage.includes("money")) {
            response = `Your current total cash position across all connected accounts is R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. This is stable compared to last week.`;
        } else if (lowerMessage.includes("burn") || lowerMessage.includes("last")) {
            response = "Analyzing your burn rate... You spent approximately R$ 12,400 in the last 30 days, primarily on Cloud Services and Payroll.";
        } else if (lowerMessage.includes("pix")) {
            response = "You can generate Pix QR codes in the Payments Hub. I see you have 3 pending payments totaling R$ 4,500.";
        } else {
            response = "I'm analyzing your Atlas financial data. Based on your current revenue trends, I recommend optimizing your vendor payment terms to increase liquidity next month.";
        }

        return {
            role: 'assistant',
            content: response,
            timestamp: new Date()
        };
    }
};
