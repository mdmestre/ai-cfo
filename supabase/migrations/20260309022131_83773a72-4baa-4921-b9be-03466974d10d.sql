
-- Chart of accounts (ledger accounts)
CREATE TABLE public.ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id uuid REFERENCES public.ledger_accounts(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  balance numeric NOT NULL DEFAULT 0,
  wallet_type text NOT NULL CHECK (wallet_type IN ('operating', 'reserve', 'investment', 'escrow')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL DEFAULT '',
  reference text,
  status text NOT NULL DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'reversed')),
  reversed_by uuid REFERENCES public.journal_entries(id),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  ledger_account_id uuid NOT NULL REFERENCES public.ledger_accounts(id),
  debit numeric NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit numeric NOT NULL DEFAULT 0 CHECK (credit >= 0),
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT debit_or_credit CHECK (
    (debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0)
  )
);

CREATE TABLE public.balance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ledger_account_id uuid NOT NULL REFERENCES public.ledger_accounts(id),
  snapshot_date date NOT NULL,
  balance numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ledger_account_id, snapshot_date)
);

CREATE TABLE public.pix_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  key_type text NOT NULL CHECK (key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  key_value text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(key_value)
);

CREATE TABLE public.pix_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reversed')),
  pix_key_id uuid REFERENCES public.pix_keys(id),
  counterpart_name text,
  counterpart_document text,
  description text NOT NULL DEFAULT '',
  end_to_end_id text UNIQUE,
  journal_entry_id uuid REFERENCES public.journal_entries(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.pix_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pix_transaction_id uuid REFERENCES public.pix_transactions(id),
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL DEFAULT '',
  qr_code_data text NOT NULL,
  expires_at timestamptz NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ledger_accounts_company ON public.ledger_accounts(company_id);
CREATE INDEX idx_wallets_company ON public.wallets(company_id);
CREATE INDEX idx_journal_entries_company ON public.journal_entries(company_id);
CREATE INDEX idx_journal_entries_date ON public.journal_entries(entry_date);
CREATE INDEX idx_ledger_entries_journal ON public.ledger_entries(journal_entry_id);
CREATE INDEX idx_ledger_entries_account ON public.ledger_entries(ledger_account_id);
CREATE INDEX idx_pix_transactions_company ON public.pix_transactions(company_id);
CREATE INDEX idx_pix_transactions_status ON public.pix_transactions(status);
CREATE INDEX idx_pix_qr_codes_company ON public.pix_qr_codes(company_id);
CREATE INDEX idx_audit_logs_company ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- RLS
ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.owns_company(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = _company_id AND owner_id = auth.uid()
  );
$$;

-- RLS Policies
CREATE POLICY "owns_select" ON public.ledger_accounts FOR SELECT TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_insert" ON public.ledger_accounts FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "owns_update" ON public.ledger_accounts FOR UPDATE TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_delete" ON public.ledger_accounts FOR DELETE TO authenticated USING (public.owns_company(company_id));

CREATE POLICY "owns_select" ON public.wallets FOR SELECT TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_insert" ON public.wallets FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "owns_update" ON public.wallets FOR UPDATE TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_delete" ON public.wallets FOR DELETE TO authenticated USING (public.owns_company(company_id));

CREATE POLICY "owns_select" ON public.journal_entries FOR SELECT TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_insert" ON public.journal_entries FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "owns_update" ON public.journal_entries FOR UPDATE TO authenticated USING (public.owns_company(company_id));

CREATE POLICY "owns_select" ON public.ledger_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND public.owns_company(je.company_id)));
CREATE POLICY "owns_insert" ON public.ledger_entries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND public.owns_company(je.company_id)));

CREATE POLICY "owns_select" ON public.balance_snapshots FOR SELECT TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_insert" ON public.balance_snapshots FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));

CREATE POLICY "owns_select" ON public.pix_keys FOR SELECT TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_insert" ON public.pix_keys FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "owns_update" ON public.pix_keys FOR UPDATE TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_delete" ON public.pix_keys FOR DELETE TO authenticated USING (public.owns_company(company_id));

CREATE POLICY "owns_select" ON public.pix_transactions FOR SELECT TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_insert" ON public.pix_transactions FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "owns_update" ON public.pix_transactions FOR UPDATE TO authenticated USING (public.owns_company(company_id));

CREATE POLICY "owns_select" ON public.pix_qr_codes FOR SELECT TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_insert" ON public.pix_qr_codes FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "owns_update" ON public.pix_qr_codes FOR UPDATE TO authenticated USING (public.owns_company(company_id));

CREATE POLICY "owns_select" ON public.audit_logs FOR SELECT TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));

-- Trigger
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
