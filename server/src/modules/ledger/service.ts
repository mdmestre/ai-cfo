import { ledgerRepository } from './repository';
import { CreateTransactionRequest } from './types';
import { eventDispatcher } from '../events/event-dispatcher';
import { auditService } from '../compliance/audit-service';

export class LedgerService {
    async createSafeTransaction(data: CreateTransactionRequest): Promise<string> {
        // Enforce Double-Entry Rule: Sum(Debits) must equal Sum(Credits)
        const totalDebit = data.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
        const totalCredit = data.entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);

        // Normalize to handle floating point precision issues in base-10
        const balance = Math.round((totalDebit - totalCredit) * 100) / 100;

        if (balance !== 0) {
            throw new Error(`Invalid Ledger Transaction: Sum of debits (${totalDebit}) does not equal sum of credits (${totalCredit}). Balance: ${balance}`);
        }

        if (data.entries.length < 2) {
            throw new Error('Invalid Ledger Transaction: At least two entries are required for double-entry bookkeeping.');
        }

        const transactionId = await ledgerRepository.createTransactionWithEntries(data);

        // Dispatch background event for other modules (Fraud, Notifications, etc.)
        await eventDispatcher.dispatchTransactionCreated(transactionId, data.company_id, data.type);

        return transactionId;
    }

    async getTransactionDetails(id: string) {
        const transaction = await ledgerRepository.getTransactionById(id);
        if (!transaction) throw new Error('Transaction not found');

        const entries = await ledgerRepository.getEntriesByTransactionId(id);
        return { ...transaction, entries };
    }

    async reverseTransaction(transactionId: string): Promise<string> {
        const original = await this.getTransactionDetails(transactionId);
        if (original.status === 'reversed') throw new Error('Transaction is already reversed');

        // Create inverse entries
        const inverseEntries = original.entries.map(entry => ({
            account_id: entry.account_id,
            debit: entry.credit, // Original Credit becomes Debit
            credit: entry.debit, // Original Debit becomes Credit
            currency: entry.currency
        }));

        const reversalId = await ledgerRepository.createTransactionWithEntries({
            company_id: original.company_id,
            type: 'reversal',
            description: `Reversal of transaction ${transactionId}: ${original.description || ''}`,
            entries: inverseEntries,
            metadata: { parent_transaction_id: transactionId }
        });

        await ledgerRepository.updateTransactionStatus(transactionId, 'reversed');

        await auditService.log({
            companyId: original.company_id,
            action: 'TRANSACTION_REVERSED',
            resourceType: 'ledger_transaction',
            resourceId: transactionId,
            newValues: { reversalId }
        });

        return reversalId;
    }

    async getCompanyAccounts(companyId: string) {
        return await ledgerRepository.getAccountsByCompany(companyId);
    }

    async bootstrapChartOfAccounts(companyId: string) {
        // Essential accounts for every company
        const defaultAccounts = [
            { name: 'Cash', type: 'ASSET', code: '1000' },
            { name: 'Accounts Receivable', type: 'ASSET', code: '1100' },
            { name: 'Accounts Payable', type: 'LIABILITY', code: '2000' },
            { name: 'Retained Earnings', type: 'EQUITY', code: '3000' },
            { name: 'Sales Revenue', type: 'INCOME', code: '4000' },
            { name: 'General Expenses', type: 'EXPENSE', code: '5000' },
        ];

        for (const acc of defaultAccounts) {
            await ledgerRepository.createAccount(companyId, acc.name, acc.type, acc.code);
        }
    }
}

export const ledgerService = new LedgerService();
