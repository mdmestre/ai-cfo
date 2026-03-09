
-- Treasury Positions: tracks where company cash is allocated
CREATE TABLE public.treasury_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  position_type text NOT NULL DEFAULT 'cash', -- cash, fixed_income, money_market, cdb, lci, lca, treasury_bond
  institution text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'BRL',
  balance numeric NOT NULL DEFAULT 0,
  allocated_amount numeric NOT NULL DEFAULT 0,
  annual_yield_rate numeric NOT NULL DEFAULT 0, -- % per year
  maturity_date date,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treasury_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owns_select" ON public.treasury_positions FOR SELECT USING (owns_company(company_id));
CREATE POLICY "owns_insert" ON public.treasury_positions FOR INSERT WITH CHECK (owns_company(company_id));
CREATE POLICY "owns_update" ON public.treasury_positions FOR UPDATE USING (owns_company(company_id));
CREATE POLICY "owns_delete" ON public.treasury_positions FOR DELETE USING (owns_company(company_id));

-- Yield Products: available investment products
CREATE TABLE public.yield_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  product_type text NOT NULL DEFAULT 'cdb', -- cdb, lci, lca, treasury_bond, money_market, fund
  institution text NOT NULL DEFAULT '',
  annual_rate numeric NOT NULL DEFAULT 0,
  min_investment numeric NOT NULL DEFAULT 0,
  max_investment numeric,
  liquidity_days integer NOT NULL DEFAULT 0, -- D+0, D+1, D+30 etc
  maturity_date date,
  risk_level text NOT NULL DEFAULT 'low', -- low, medium, high
  is_available boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.yield_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owns_select" ON public.yield_products FOR SELECT USING (owns_company(company_id));
CREATE POLICY "owns_insert" ON public.yield_products FOR INSERT WITH CHECK (owns_company(company_id));
CREATE POLICY "owns_update" ON public.yield_products FOR UPDATE USING (owns_company(company_id));
CREATE POLICY "owns_delete" ON public.yield_products FOR DELETE USING (owns_company(company_id));

-- Yield Events: tracks all yield/investment events
CREATE TABLE public.yield_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  position_id uuid NOT NULL REFERENCES public.treasury_positions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.yield_products(id) ON DELETE SET NULL,
  event_type text NOT NULL DEFAULT 'investment', -- investment, redemption, yield_accrual, maturity, auto_sweep
  amount numeric NOT NULL DEFAULT 0,
  yield_amount numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  event_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.yield_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owns_select" ON public.yield_events FOR SELECT USING (owns_company(company_id));
CREATE POLICY "owns_insert" ON public.yield_events FOR INSERT WITH CHECK (owns_company(company_id));

CREATE INDEX idx_treasury_positions_company ON public.treasury_positions(company_id);
CREATE INDEX idx_yield_products_company ON public.yield_products(company_id);
CREATE INDEX idx_yield_events_company ON public.yield_events(company_id);
CREATE INDEX idx_yield_events_position ON public.yield_events(position_id);
