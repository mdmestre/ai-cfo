-- =========================================
-- ACCOUNTING & FISCAL TABLES AND ALTERATIONS
-- Run in Supabase SQL Editor
-- =========================================

-- 1. ACCOUNTING PERIODS
CREATE TABLE IF NOT EXISTS public.accounting_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status text DEFAULT 'open', -- 'open', 'closing', 'closed'
    closed_at timestamptz,
    closed_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounting_periods_all" ON public.accounting_periods
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- 2. CHART OF ACCOUNTS (Contabilidade real, distinguindo do ledger_accounts financeiro atual)
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code text NOT NULL,
    name text NOT NULL,
    account_type text NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense', 'cost'
    parent_id uuid REFERENCES public.chart_of_accounts(id),
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, code)
);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chart_of_accounts_all" ON public.chart_of_accounts
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- 3. JOURNAL ENTRIES (Lançamentos Contábeis)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    accounting_period_id uuid REFERENCES public.accounting_periods(id),
    description text NOT NULL,
    reference_type text, -- e.g., 'invoice', 'payroll', 'depreciation'
    reference_id text,
    entry_date date NOT NULL,
    is_auto_suggested boolean DEFAULT false,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_lines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
    debit numeric(15,2) DEFAULT 0,
    credit numeric(15,2) DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_entries_all" ON public.journal_entries
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "journal_lines_all" ON public.journal_lines
  USING (journal_entry_id IN (
    SELECT id FROM public.journal_entries WHERE company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  ));

-- 4. EXTENDING INVOICES TABLE
-- We alters the existing invoices table instead of creating `fiscal_invoices`.
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS invoice_type text DEFAULT 'service', -- 'service', 'product', etc.
  ADD COLUMN IF NOT EXISTS series text,
  ADD COLUMN IF NOT EXISTS xml_url text,
  ADD COLUMN IF NOT EXISTS municipality text,
  ADD COLUMN IF NOT EXISTS tax_regime text DEFAULT 'simples_nacional';

-- 5. TAX ITEMS (Detalhamento de impostos da fatura)
CREATE TABLE IF NOT EXISTS public.tax_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    tax_type text NOT NULL, -- 'ISS', 'IRRF', 'INSS', 'PIS', 'COFINS', 'CSLL', 'ICMS'
    tax_rate numeric(5,2) DEFAULT 0,
    tax_base numeric(15,2) DEFAULT 0,
    tax_value numeric(15,2) DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tax_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_items_all" ON public.tax_items
  USING (invoice_id IN (
    SELECT id FROM public.invoices WHERE company_id IN (
      SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
  ));

-- 6. TAX APURATIONS (Fechamento/Guias Mensais)
CREATE TABLE IF NOT EXISTS public.tax_apurations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    period text NOT NULL, -- e.g., '2023-10'
    tax_type text NOT NULL, -- 'ISS', 'Simples', etc.
    amount_due numeric(15,2) DEFAULT 0,
    amount_paid numeric(15,2) DEFAULT 0,
    due_date date,
    status text DEFAULT 'open', -- 'open', 'paid', 'overdue'
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tax_apurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_apurations_all" ON public.tax_apurations
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- GRANT to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated, anon;
