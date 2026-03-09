-- Phase 5: Credit Engine
-- Tables for risk assessment, credit lines, and drawdowns

-- 1. Credit Lines
CREATE TABLE IF NOT EXISTS public.credit_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    total_limit NUMERIC(15, 2) NOT NULL,
    utilized_amount NUMERIC(15, 2) DEFAULT 0,
    interest_rate NUMERIC(5, 2) NOT NULL, -- Annual rate %
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'default'
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Underwriting Submissions (Loan Applications)
CREATE TABLE IF NOT EXISTS public.underwriting_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    requested_amount NUMERIC(15, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'declined', 'more_info'
    score_snapshot INTEGER, -- From Intelligence module
    decision_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Drawdowns (Withdrawals from credit line)
CREATE TABLE IF NOT EXISTS public.credit_drawdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_line_id UUID NOT NULL REFERENCES public.credit_lines(id),
    amount NUMERIC(15, 2) NOT NULL,
    fee_amount NUMERIC(15, 2) DEFAULT 0,
    ledger_transaction_id UUID REFERENCES public.ledger_transactions(id),
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. RLS
ALTER TABLE public.credit_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.underwriting_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_drawdowns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access company credit lines" ON public.credit_lines;
CREATE POLICY "Users can access company credit lines" ON public.credit_lines 
    FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can access company submissions" ON public.underwriting_submissions;
CREATE POLICY "Users can access company submissions" ON public.underwriting_submissions 
    FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can access company drawdowns" ON public.credit_drawdowns;
CREATE POLICY "Users can access company drawdowns" ON public.credit_drawdowns 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.credit_lines WHERE credit_lines.id = credit_drawdowns.credit_line_id AND credit_lines.company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())));
