import pool from '../../config/db';
import { auditService } from '../compliance/audit-service';

export class AutomationService {
    async evaluateAllRules(companyId: string) {
        const rules = await pool.query(
            'SELECT * FROM public.automation_rules WHERE company_id = $1 AND is_active = true',
            [companyId]
        );

        for (const rule of rules.rows) {
            await this.evaluateRule(rule);
        }
    }

    async evaluateRule(rule: any) {
        // Logic to check trigger_type conditions
        // e.g., if trigger_type is 'low_runway', call intelligenceService
        console.log(`[automation]: Evaluating rule ${rule.id} of type ${rule.trigger_type}`);

        // This is a stub for the full logic which will bridge Intelligence -> Automation -> Action
    }

    async createRule(companyId: string, data: any) {
        const result = await pool.query(
            `INSERT INTO public.automation_rules (company_id, trigger_type, condition_value, action_type)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [companyId, data.trigger_type, data.condition_value, data.action_type]
        );

        await auditService.log({
            companyId,
            action: 'AUTOMATION_RULE_CREATED',
            resourceType: 'automation_rule',
            resourceId: result.rows[0].id,
            newValues: result.rows[0]
        });

        return result.rows[0];
    }
}

export const automationService = new AutomationService();
