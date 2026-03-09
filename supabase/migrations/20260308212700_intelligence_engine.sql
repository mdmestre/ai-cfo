-- Phase 2: Financial Intelligence
-- Tables for Forecasting and Scoring

-- 1. Cashflow Forecasts
CREATE TABLE IF NOT EXISTS public.cashflow_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    projected_inflow NUMERIC(15, 2) NOT NULL DEFAULT 0,
    projected_outflow NUMERIC(15, 2) NOT NULL DEFAULT 0,
    projected_balance NUMERIC(15, 2) NOT NULL,
    confidence_score NUMERIC(5, 2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Financial & Risk Scores
CREATE TABLE IF NOT EXISTS public.intelligence_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    score_type TEXT NOT NULL, -- 'financial_health', 'credit_risk', 'churn_probability'
    score_value INTEGER NOT NULL CHECK (score_value >= 0 AND score_value <= 100),
    factors JSONB DEFAULT '{}', -- Key reasons for the score
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. RLS
ALTER TABLE public.cashflow_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their company forecasts" ON public.cashflow_forecasts;
CREATE POLICY "Users can access their company forecasts" ON public.cashflow_forecasts 
    FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can access their company intelligence scores" ON public.intelligence_scores;
CREATE POLICY "Users can access their company intelligence scores" ON public.intelligence_scores 
    FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));
