export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed' | 'voided';
export type TransactionType = 'transfer' | 'payment' | 'card_spend' | 'pix_received' | 'reversal';

export interface Account {
    id: string;
    company_id: string;
    name: string;
    type: AccountType;
    code?: string;
    created_at: Date;
}

export interface Wallet {
    id: string;
    company_id: string;
    account_id?: string;
    name: string;
    currency: string;
    status: 'active' | 'frozen' | 'closed';
    created_at: Date;
}

export interface LedgerTransaction {
    id: string;
    company_id: string;
    type: TransactionType;
    status: TransactionStatus;
    description?: string;
    metadata: Record<string, any>;
    parent_transaction_id?: string;
    occurred_at: Date;
    created_at: Date;
}

export interface LedgerEntry {
    id: string;
    transaction_id: string;
    company_id: string;
    account_id: string;
    debit: number;
    credit: number;
    currency: string;
    created_at: Date;
}

export interface CreateTransactionEntry {
    account_id: string;
    debit: number;
    credit: number;
    currency?: string;
}

export interface CreateTransactionRequest {
    company_id: string;
    type: TransactionType;
    description?: string;
    entries: CreateTransactionEntry[];
    metadata?: Record<string, any>;
}
