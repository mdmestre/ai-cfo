import OpenAI from 'openai';
import pool from '../../config/db';
import { intelligenceService } from '../intelligence/intelligence-service';
import { ledgerService } from '../ledger/service';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export class AiService {
    async generateFinancialReply(companyId: string, userMessage: string) {
        // 1. Fetch Context (RAG-lite)
        const health = await intelligenceService.getFinancialHealthScore(companyId);
        const accounts = await ledgerService.getCompanyAccounts(companyId);

        const context = `
            Company ID: ${companyId}
            Current Balance: ${accounts.reduce((sum, a: any) => sum + (parseFloat(a.balance || 0)), 0)}
            Financial Health Score: ${health.score}/100
            Runway Projection: ${health.factors.runway_days} days
            Factors: ${JSON.stringify(health.factors)}
        `;

        if (!openai) {
            throw new Error("Atlas AI CFO is currently unavailable (Missing API Key).");
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are Atlas AI, a world-class AI CFO for high-growth startups (Brex-level). 
                    Your goal is to provide precise, strategic financial advice based on the company's ledger and intelligence data. 
                    Be professional, proactive, and analytical.
                    
                    Context:
                    ${context}`
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            temperature: 0.7,
        });

        return response.choices[0].message.content;
    }
}

export const aiService = new AiService();
