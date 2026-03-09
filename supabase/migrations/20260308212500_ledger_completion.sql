-- Completing Financial Core (Phase 1.1)
-- This migration adds Journals, Balance Snapshots, and Reconciliation tables.

-- 1. Journals (Grouping transactions by accounting period)
CREATE TABLE IF NOT EXISTS public.ledger_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Balance Snapshots (For performance and audit historical state)
CREATE TABLE IF NOT EXISTS public.balance_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    balance NUMERIC(15, 2) NOT NULL,
    snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    transaction_id UUID REFERENCES public.ledger_transactions(id) -- State exactly AFTER this transaction
);

-- 3. Reconciliations (Matching internal ledger with external bank data)
CREATE TABLE IF NOT EXISTS public.reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    bank_connection_id UUID REFERENCES public.bank_connections(id) ON DELETE SET NULL,
    external_transaction_id TEXT NOT NULL,
    ledger_transaction_id UUID REFERENCES public.ledger_transactions(id),
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'matched', 'ignored', 'manual_review'
    reconciled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Audit Logs (Phase 1.3 Observability)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- e.g., 'TRANSACTION_REVERSED', 'ACCOUNT_CREATED'
    resource_type TEXT NOT NULL, -- e.g., 'ledger_transaction', 'account'
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. RLS Policies
ALTER TABLE public.ledger_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their company journals" ON public.ledger_journals 
    USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = ledger_journals.company_id AND companies.owner_id = auth.uid()));

CREATE POLICY "Users can access their company snapshots" ON public.balance_snapshots 
    USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = balance_snapshots.company_id AND companies.owner_id = auth.uid()));

CREATE POLICY "Users can access their company reconciliations" ON public.reconciliations 
    USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = reconciliations.company_id AND companies.owner_id = auth.uid()));

CREATE POLICY "Users can access their company audit logs" ON public.audit_logs 
    USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = audit_logs.company_id AND companies.owner_id = auth.uid()));

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_reconciliations_ledger_tx ON public.reconciliations(ledger_transaction_id);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_account ON public.balance_snapshots(account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON public.audit_logs(company_id);
