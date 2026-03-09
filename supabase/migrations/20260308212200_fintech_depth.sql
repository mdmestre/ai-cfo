-- Deep Fintech Depth Migration

-- Audit Logs for Financial Security
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'payment_created', 'account_linked', 'data_exported'
    resource_type TEXT NOT NULL, -- 'payment', 'account', 'report'
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Open Finance Bank Connections
CREATE TABLE IF NOT EXISTS public.bank_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'plaid', 'belvo', 'open_finance_br'
    provider_connection_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    connection_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'disconnected', 'repair_required'
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Pix Specific Transactions Metadata
CREATE TABLE IF NOT EXISTS public.pix_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    e2e_id TEXT UNIQUE, -- End-to-End identification from BCB
    qr_code_string TEXT,
    qr_code_url TEXT,
    txid TEXT UNIQUE,
    payer_name TEXT,
    payer_tax_id TEXT, -- CPF/CNPJ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for their companies" ON public.audit_logs FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = audit_logs.company_id AND companies.owner_id = auth.uid()));

CREATE POLICY "Users can view their bank connections" ON public.bank_connections FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = bank_connections.company_id AND companies.owner_id = auth.uid()));

CREATE POLICY "Users can view pix transaction details" ON public.pix_transactions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.payments p
    JOIN public.companies c ON p.company_id = c.id
    WHERE p.id = pix_transactions.payment_id AND c.owner_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX idx_audit_logs_company ON public.audit_logs(company_id);
CREATE INDEX idx_bank_connections_company ON public.bank_connections(company_id);
CREATE INDEX idx_pix_transactions_payment ON public.pix_transactions(payment_id);
