import pool from '../../config/db';

export interface AuditLogParams {
    userId?: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
}

export class AuditService {
    async log(params: AuditLogParams) {
        try {
            await pool.query(
                `INSERT INTO public.audit_logs 
                (user_id, company_id, action, resource_type, resource_id, old_values, new_values, ip_address)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    params.userId,
                    params.companyId,
                    params.action,
                    params.resourceType,
                    params.resourceId,
                    JSON.stringify(params.oldValues || {}),
                    JSON.stringify(params.newValues || {}),
                    params.ipAddress
                ]
            );
        } catch (error) {
            console.error('[audit]: Failed to record audit log', error);
        }
    }
}

export const auditService = new AuditService();
