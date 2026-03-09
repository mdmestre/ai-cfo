-- Phase 3: Billing & Automation
-- Core tables for invoicing and automatic workflows

-- 1. Customers & Vendors
CREATE TABLE IF NOT EXISTS public.counterparties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tax_id TEXT, -- CPF/CNPJ
    type TEXT NOT NULL CHECK (type IN ('customer', 'vendor', 'both')),
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Invoices (Receivables/Payables)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    counterparty_id UUID NOT NULL REFERENCES public.counterparties(id),
    amount NUMERIC(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
    type TEXT NOT NULL CHECK (type IN ('payable', 'receivable')),
    description TEXT,
    ledger_transaction_id UUID REFERENCES public.ledger_transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Automations
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL, -- 'balance_below', 'invoice_overdue', 'low_runway'
    condition_value NUMERIC(15, 2),
    action_type TEXT NOT NULL, -- 'send_alert', 'freeze_cards', 'suggest_credit'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. RLS
ALTER TABLE public.counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access company counterparties" ON public.counterparties;
CREATE POLICY "Users can access company counterparties" ON public.counterparties 
    FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can access company invoices" ON public.invoices;
CREATE POLICY "Users can access company invoices" ON public.invoices 
    FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can access company automations" ON public.automation_rules;
CREATE POLICY "Users can access company automations" ON public.automation_rules 
    FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));
