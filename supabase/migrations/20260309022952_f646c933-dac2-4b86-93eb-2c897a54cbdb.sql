
-- =============================================
-- EXPENSE MANAGEMENT
-- =============================================

CREATE TABLE public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  parent_id uuid REFERENCES public.expense_categories(id),
  budget_limit numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.expense_categories(id),
  submitted_by uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'BRL',
  description text NOT NULL DEFAULT '',
  merchant text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
  receipt_url text,
  notes text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.expense_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL,
  title text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid')),
  approved_by uuid,
  approved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.expense_claim_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.expense_claims(id) ON DELETE CASCADE,
  expense_id uuid NOT NULL REFERENCES public.expenses(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- CORPORATE CARDS
-- =============================================

CREATE TABLE public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  holder_name text NOT NULL,
  holder_user_id uuid NOT NULL,
  card_type text NOT NULL DEFAULT 'virtual' CHECK (card_type IN ('virtual', 'physical')),
  last_four text NOT NULL DEFAULT '0000',
  spending_limit numeric NOT NULL DEFAULT 0,
  spent_current_month numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'cancelled')),
  expires_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.card_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  merchant text NOT NULL,
  category text NOT NULL DEFAULT 'Uncategorized',
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'declined', 'reversed')),
  description text NOT NULL DEFAULT '',
  transaction_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_expense_categories_company ON public.expense_categories(company_id);
CREATE INDEX idx_expenses_company ON public.expenses(company_id);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_expenses_submitted ON public.expenses(submitted_by);
CREATE INDEX idx_expense_claims_company ON public.expense_claims(company_id);
CREATE INDEX idx_cards_company ON public.cards(company_id);
CREATE INDEX idx_card_transactions_card ON public.card_transactions(card_id);
CREATE INDEX idx_card_transactions_company ON public.card_transactions(company_id);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_claim_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_transactions ENABLE ROW LEVEL SECURITY;

-- Expense categories
CREATE POLICY "owns_select" ON public.expense_categories FOR SELECT TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_insert" ON public.expense_categories FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "owns_update" ON public.expense_categories FOR UPDATE TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_delete" ON public.expense_categories FOR DELETE TO authenticated USING (public.owns_company(company_id));

-- Expenses
CREATE POLICY "owns_select" ON public.expenses FOR SELECT TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_insert" ON public.expenses FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "owns_update" ON public.expenses FOR UPDATE TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_delete" ON public.expenses FOR DELETE TO authenticated USING (public.owns_company(company_id));

-- Expense claims
CREATE POLICY "owns_select" ON public.expense_claims FOR SELECT TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_insert" ON public.expense_claims FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "owns_update" ON public.expense_claims FOR UPDATE TO authenticated USING (public.owns_company(company_id));

-- Expense claim items (through claim's company)
CREATE POLICY "owns_select" ON public.expense_claim_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.expense_claims ec WHERE ec.id = claim_id AND public.owns_company(ec.company_id)));
CREATE POLICY "owns_insert" ON public.expense_claim_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.expense_claims ec WHERE ec.id = claim_id AND public.owns_company(ec.company_id)));

-- Cards
CREATE POLICY "owns_select" ON public.cards FOR SELECT TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_insert" ON public.cards FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "owns_update" ON public.cards FOR UPDATE TO authenticated USING (public.owns_company(company_id));

-- Card transactions
CREATE POLICY "owns_select" ON public.card_transactions FOR SELECT TO authenticated USING (public.owns_company(company_id));
CREATE POLICY "owns_insert" ON public.card_transactions FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));

-- Triggers
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expense_claims_updated_at BEFORE UPDATE ON public.expense_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- Storage RLS for receipts
CREATE POLICY "Authenticated users can upload receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Users can view their company receipts" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'receipts');
