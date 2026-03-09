
-- ================================================
-- INTELLIGENCE LAYER: Savings, Risk, Automation
-- ================================================

-- 1. Savings Intelligence (Ramp-style)
CREATE TABLE public.savings_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL DEFAULT 'duplicate_subscription',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'software',
  current_spend NUMERIC NOT NULL DEFAULT 0,
  potential_savings NUMERIC NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  affected_expenses JSONB DEFAULT '[]',
  recommendation TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);

ALTER TABLE public.savings_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owns_select" ON public.savings_insights FOR SELECT TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_insert" ON public.savings_insights FOR INSERT TO authenticated WITH CHECK (owns_company(company_id));
CREATE POLICY "owns_update" ON public.savings_insights FOR UPDATE TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_delete" ON public.savings_insights FOR DELETE TO authenticated USING (owns_company(company_id));

-- 2. Risk Engine
CREATE TABLE public.risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 50,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  factors JSONB NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owns_select" ON public.risk_scores FOR SELECT TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_insert" ON public.risk_scores FOR INSERT TO authenticated WITH CHECK (owns_company(company_id));

CREATE TABLE public.risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'anomaly',
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}',
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owns_select" ON public.risk_events FOR SELECT TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_insert" ON public.risk_events FOR INSERT TO authenticated WITH CHECK (owns_company(company_id));
CREATE POLICY "owns_update" ON public.risk_events FOR UPDATE TO authenticated USING (owns_company(company_id));

-- 3. Automation Engine
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owns_select" ON public.automation_rules FOR SELECT TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_insert" ON public.automation_rules FOR INSERT TO authenticated WITH CHECK (owns_company(company_id));
CREATE POLICY "owns_update" ON public.automation_rules FOR UPDATE TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_delete" ON public.automation_rules FOR DELETE TO authenticated USING (owns_company(company_id));

CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  trigger_data JSONB DEFAULT '{}',
  action_result JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owns_select" ON public.automation_logs FOR SELECT TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_insert" ON public.automation_logs FOR INSERT TO authenticated WITH CHECK (owns_company(company_id));

-- Indexes
CREATE INDEX idx_savings_insights_company ON public.savings_insights(company_id);
CREATE INDEX idx_savings_insights_status ON public.savings_insights(status);
CREATE INDEX idx_risk_scores_company ON public.risk_scores(company_id);
CREATE INDEX idx_risk_events_company ON public.risk_events(company_id);
CREATE INDEX idx_automation_rules_company ON public.automation_rules(company_id);
CREATE INDEX idx_automation_logs_rule ON public.automation_logs(rule_id);
