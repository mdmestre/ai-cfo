-- Extension migration for Atlas SaaS

-- Financial Health Scores
CREATE TABLE IF NOT EXISTS public.financial_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    factors JSONB NOT NULL DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Smart Alerts
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'risk', 'insight', 'anomaly'
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Automations
CREATE TABLE IF NOT EXISTS public.automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_condition JSONB NOT NULL, -- e.g., { "type": "balance_threshold", "operator": "<", "value": 1000 }
    action JSONB NOT NULL, -- e.g., { "type": "send_alert", "recipient": "manager" }
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payments / Invoices
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    recipient_name TEXT NOT NULL,
    due_date DATE NOT NULL,
    payment_method TEXT, -- 'pix', 'bank_transfer', etc.
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'p&l', 'cashflow', 'expenses'
    file_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies for new tables
ALTER TABLE public.financial_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy Creation for all new tables (Owner check)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name IN ('financial_scores', 'alerts', 'automations', 'payments', 'reports')
    LOOP
        EXECUTE format('CREATE POLICY "Users can view their own %I" ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = %I.company_id AND companies.owner_id = auth.uid()))', t, t, t);
    END LOOP;
END $$;

-- Triggers for automations updated_at
CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON public.automations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
