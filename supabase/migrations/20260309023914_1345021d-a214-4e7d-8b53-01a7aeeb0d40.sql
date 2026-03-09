
-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  document TEXT,
  phone TEXT,
  address JSONB,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  document TEXT,
  phone TEXT,
  address JSONB,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  vendor_id UUID REFERENCES public.vendors(id),
  invoice_number TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'receivable', -- 'receivable' or 'payable'
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  notes TEXT,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice line items
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Receivables view tracking
CREATE TABLE public.receivables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  amount_due NUMERIC NOT NULL,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open, partial, paid, overdue, written_off
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payables tracking
CREATE TABLE public.payables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  amount_due NUMERIC NOT NULL,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers
CREATE POLICY "owns_select" ON public.customers FOR SELECT TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (owns_company(company_id));
CREATE POLICY "owns_update" ON public.customers FOR UPDATE TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_delete" ON public.customers FOR DELETE TO authenticated USING (owns_company(company_id));

-- RLS policies for vendors
CREATE POLICY "owns_select" ON public.vendors FOR SELECT TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_insert" ON public.vendors FOR INSERT TO authenticated WITH CHECK (owns_company(company_id));
CREATE POLICY "owns_update" ON public.vendors FOR UPDATE TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_delete" ON public.vendors FOR DELETE TO authenticated USING (owns_company(company_id));

-- RLS policies for invoices
CREATE POLICY "owns_select" ON public.invoices FOR SELECT TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_insert" ON public.invoices FOR INSERT TO authenticated WITH CHECK (owns_company(company_id));
CREATE POLICY "owns_update" ON public.invoices FOR UPDATE TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_delete" ON public.invoices FOR DELETE TO authenticated USING (owns_company(company_id));

-- RLS policies for invoice_items (via invoice)
CREATE POLICY "owns_select" ON public.invoice_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices inv WHERE inv.id = invoice_items.invoice_id AND owns_company(inv.company_id)));
CREATE POLICY "owns_insert" ON public.invoice_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices inv WHERE inv.id = invoice_items.invoice_id AND owns_company(inv.company_id)));
CREATE POLICY "owns_delete" ON public.invoice_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices inv WHERE inv.id = invoice_items.invoice_id AND owns_company(inv.company_id)));

-- RLS policies for receivables
CREATE POLICY "owns_select" ON public.receivables FOR SELECT TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_insert" ON public.receivables FOR INSERT TO authenticated WITH CHECK (owns_company(company_id));
CREATE POLICY "owns_update" ON public.receivables FOR UPDATE TO authenticated USING (owns_company(company_id));

-- RLS policies for payables
CREATE POLICY "owns_select" ON public.payables FOR SELECT TO authenticated USING (owns_company(company_id));
CREATE POLICY "owns_insert" ON public.payables FOR INSERT TO authenticated WITH CHECK (owns_company(company_id));
CREATE POLICY "owns_update" ON public.payables FOR UPDATE TO authenticated USING (owns_company(company_id));

-- Updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.receivables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_customers_company ON public.customers(company_id);
CREATE INDEX idx_vendors_company ON public.vendors(company_id);
CREATE INDEX idx_invoices_company ON public.invoices(company_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_receivables_company ON public.receivables(company_id);
CREATE INDEX idx_receivables_status ON public.receivables(status);
CREATE INDEX idx_payables_company ON public.payables(company_id);
CREATE INDEX idx_payables_status ON public.payables(status);
