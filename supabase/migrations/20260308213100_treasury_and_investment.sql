-- Phase 6: Treasury & Investment
-- Tables for yield management, FX, and global transfers

-- 1. Treasury Positions (Investments/Yield)
CREATE TABLE IF NOT EXISTS public.treasury_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL, -- 'money_market', 'gov_bonds', 'crypto_stable'
    notional_amount NUMERIC(15, 2) NOT NULL,
    current_yield NUMERIC(5, 2), -- Current APY %
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. FX Rates (Reference table)
CREATE TABLE IF NOT EXISTS public.fx_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair TEXT NOT NULL, -- 'USD/BRL'
    rate NUMERIC(15, 6) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Cross-border Transfers
CREATE TABLE IF NOT EXISTS public.global_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    source_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    source_amount NUMERIC(15, 2) NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL,
    fx_rate UUID REFERENCES public.fx_rates(id),
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    recipient_metadata JSONB NOT NULL, -- Bank details, SWIFT/IBAN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. RLS
ALTER TABLE public.treasury_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access company treasury" ON public.treasury_positions;
CREATE POLICY "Users can access company treasury" ON public.treasury_positions 
    FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "FX rates are readable by all authenticated" ON public.fx_rates;
CREATE POLICY "FX rates are readable by all authenticated" ON public.fx_rates 
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can access company global transfers" ON public.global_transfers;
CREATE POLICY "Users can access company global transfers" ON public.global_transfers 
    FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));
