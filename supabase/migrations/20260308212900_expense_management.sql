-- Phase 4: Expense Management & Corporate Cards
-- Tables for tracking spend and card lifecycle

-- 1. Expenses (Spend tracking)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    category TEXT, -- 'travel', 'food', 'software'
    description TEXT,
    receipt_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'reimbursed'
    approval_flow_id UUID,
    ocr_metadata JSONB DEFAULT '{}',
    ledger_transaction_id UUID REFERENCES public.ledger_transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Corporate Cards
CREATE TABLE IF NOT EXISTS public.corporate_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    last_four TEXT NOT NULL,
    brand TEXT NOT NULL, -- 'visa', 'mastercard'
    token TEXT NOT NULL, -- PCI compliant reference
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'frozen', 'blocked'
    limit_amount NUMERIC(15, 2),
    spent_amount NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Approval Flows
CREATE TABLE IF NOT EXISTS public.approval_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rules JSONB NOT NULL, -- e.g., [{"amount_gt": 1000, "role": "admin"}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_flows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access company expenses" ON public.expenses;
CREATE POLICY "Users can access company expenses" ON public.expenses 
    FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can access company cards" ON public.corporate_cards;
CREATE POLICY "Users can access company cards" ON public.corporate_cards 
    FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can access company approval flows" ON public.approval_flows;
CREATE POLICY "Users can access company approval flows" ON public.approval_flows 
    FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));
