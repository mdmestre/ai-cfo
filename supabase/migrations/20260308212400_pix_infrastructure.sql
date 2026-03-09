-- Pix Infrastructure Migration
-- This implements the necessary tables for Pix operations (Inbound/Outbound)

-- 1. Pix Keys
CREATE TABLE IF NOT EXISTS public.pix_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    key_type TEXT NOT NULL, -- 'cpf', 'cnpj', 'email', 'phone', 'random'
    key_value TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Pix Outbound (Transfers out)
CREATE TABLE IF NOT EXISTS public.pix_outbound (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.ledger_transactions(id), -- Linked to Ledger
    amount NUMERIC(15, 2) NOT NULL,
    recipient_key_type TEXT NOT NULL,
    recipient_key_value TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_tax_id TEXT, -- CPF/CNPJ
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'scheduled', 'processing', 'completed', 'failed'
    e2e_id TEXT UNIQUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Pix Inbound (Payments received)
CREATE TABLE IF NOT EXISTS public.pix_inbound (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.ledger_transactions(id),
    amount NUMERIC(15, 2) NOT NULL,
    payer_name TEXT,
    payer_tax_id TEXT,
    txid TEXT UNIQUE, -- Pix Transaction ID (Bacen)
    e2e_id TEXT UNIQUE,
    qr_code_id TEXT, -- If linked to a specific dynamic QR
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Pix Dynamic QR Codes
CREATE TABLE IF NOT EXISTS public.pix_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2),
    description TEXT,
    txid TEXT UNIQUE NOT NULL,
    payload TEXT NOT NULL, -- The BRCode string
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'paid'
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. RLS
ALTER TABLE public.pix_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_outbound ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_inbound ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_qr_codes ENABLE ROW LEVEL SECURITY;

-- Default policies
DROP POLICY IF EXISTS "Users can access their company pix keys" ON public.pix_keys;
CREATE POLICY "Users can access their company pix keys" ON public.pix_keys 
    USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = pix_keys.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can access their company pix outbound" ON public.pix_outbound;
CREATE POLICY "Users can access their company pix outbound" ON public.pix_outbound 
    USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = pix_outbound.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can access their company pix inbound" ON public.pix_inbound;
CREATE POLICY "Users can access their company pix inbound" ON public.pix_inbound 
    USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = pix_inbound.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can access their company pix qr codes" ON public.pix_qr_codes;
CREATE POLICY "Users can access their company pix qr codes" ON public.pix_qr_codes 
    USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = pix_qr_codes.company_id AND companies.owner_id = auth.uid()));
