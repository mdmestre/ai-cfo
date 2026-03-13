-- =========================================
-- MISSING TABLES - Run in Supabase SQL Editor
-- Run AFTER supabase_restore_schema.sql
-- =========================================

-- BANK CONNECTIONS
CREATE TABLE IF NOT EXISTS public.bank_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    institution_name text NOT NULL,
    provider text NOT NULL DEFAULT 'belvo',
    status text DEFAULT 'active',
    account_id text,
    last_synced_at timestamptz,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bank_connections_all" ON public.bank_connections
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- CARDS
CREATE TABLE IF NOT EXISTS public.cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    holder_id uuid REFERENCES auth.users(id),
    holder_name text NOT NULL,
    card_type text NOT NULL DEFAULT 'virtual',
    institution text DEFAULT 'Atlas',
    status text DEFAULT 'active',
    spending_limit numeric(15,2) DEFAULT 0,
    spent_current_month numeric(15,2) DEFAULT 0,
    last_four text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.card_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    amount numeric(15,2) NOT NULL,
    merchant text,
    category text,
    description text,
    transaction_date timestamptz DEFAULT now(),
    status text DEFAULT 'completed',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cards_all" ON public.cards
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "card_transactions_all" ON public.card_transactions
  USING (card_id IN (SELECT id FROM public.cards WHERE company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())));

-- CASH FLOW FORECASTS
CREATE TABLE IF NOT EXISTS public.cash_flow_forecasts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    forecast_date date NOT NULL,
    projected_inflow numeric(15,2) DEFAULT 0,
    projected_outflow numeric(15,2) DEFAULT 0,
    net_balance numeric(15,2) DEFAULT 0,
    confidence numeric(5,2) DEFAULT 0.8,
    notes text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cash_flow_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash_flow_forecasts_all" ON public.cash_flow_forecasts
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- PAYABLES (standalone, separate from invoices)
CREATE TABLE IF NOT EXISTS public.payables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    vendor_id uuid REFERENCES public.vendors(id),
    description text NOT NULL,
    amount numeric(15,2) NOT NULL,
    due_date date,
    status text DEFAULT 'pending',
    paid_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payables_all" ON public.payables
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- RECEIVABLES (standalone, separate from invoices)
CREATE TABLE IF NOT EXISTS public.receivables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES public.customers(id),
    description text NOT NULL,
    amount numeric(15,2) NOT NULL,
    due_date date,
    status text DEFAULT 'pending',
    received_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receivables_all" ON public.receivables
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- LEDGER TABLES
CREATE TABLE IF NOT EXISTS public.ledger_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code text NOT NULL,
    name text NOT NULL,
    account_type text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    description text,
    reference text,
    entry_date timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ledger_entry_lines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_entry_id uuid NOT NULL REFERENCES public.ledger_entries(id) ON DELETE CASCADE,
    ledger_account_id uuid NOT NULL REFERENCES public.ledger_accounts(id),
    debit numeric(15,2) DEFAULT 0,
    credit numeric(15,2) DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entry_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ledger_accounts_all" ON public.ledger_accounts
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "ledger_entries_all" ON public.ledger_entries
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "ledger_entry_lines_all" ON public.ledger_entry_lines
  USING (ledger_entry_id IN (
    SELECT id FROM public.ledger_entries WHERE company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  ));

-- TREASURY TABLES
CREATE TABLE IF NOT EXISTS public.treasury_positions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    position_type text NOT NULL,
    institution text NOT NULL,
    balance numeric(15,2) DEFAULT 0,
    allocated_amount numeric(15,2) DEFAULT 0,
    annual_yield_rate numeric(5,4) DEFAULT 0,
    maturity_date date,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.yield_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    product_type text NOT NULL,
    institution text NOT NULL,
    annual_rate numeric(5,4) DEFAULT 0,
    min_investment numeric(15,2) DEFAULT 0,
    liquidity_days integer DEFAULT 0,
    risk_level text DEFAULT 'low',
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.yield_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    treasury_position_id uuid REFERENCES public.treasury_positions(id),
    event_type text NOT NULL,
    amount numeric(15,2) NOT NULL,
    event_date timestamptz DEFAULT now(),
    notes text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.treasury_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "treasury_positions_all" ON public.treasury_positions
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "yield_products_all" ON public.yield_products
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "yield_events_all" ON public.yield_events
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- RISK EVENTS (separate from risk_scores)
CREATE TABLE IF NOT EXISTS public.risk_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    severity text DEFAULT 'medium',
    event_date timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risk_events_all" ON public.risk_events
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- AUTOMATIONS
CREATE TABLE IF NOT EXISTS public.automations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    trigger_type text NOT NULL,
    trigger_condition jsonb NOT NULL DEFAULT '{}',
    action_type text NOT NULL,
    action_data jsonb NOT NULL DEFAULT '{}',
    is_active boolean DEFAULT true,
    last_triggered_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automations_all" ON public.automations
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- ALERTS
CREATE TABLE IF NOT EXISTS public.alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type text NOT NULL,
    severity text NOT NULL DEFAULT 'info',
    title text NOT NULL,
    description text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_all" ON public.alerts
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- GRANT to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated, anon;
