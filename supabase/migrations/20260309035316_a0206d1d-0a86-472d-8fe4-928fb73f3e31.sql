
-- Bank connections table to track connected bank institutions
CREATE TABLE public.bank_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  institution_name text NOT NULL,
  provider text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'connected',
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  last_synced_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies using membership-based access
CREATE POLICY "members_select" ON public.bank_connections FOR SELECT TO authenticated
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "admins_insert" ON public.bank_connections FOR INSERT TO authenticated
  WITH CHECK (has_admin_access(auth.uid(), company_id));

CREATE POLICY "admins_update" ON public.bank_connections FOR UPDATE TO authenticated
  USING (has_admin_access(auth.uid(), company_id));

CREATE POLICY "admins_delete" ON public.bank_connections FOR DELETE TO authenticated
  USING (has_admin_access(auth.uid(), company_id));

-- Update trigger
CREATE TRIGGER update_bank_connections_updated_at
  BEFORE UPDATE ON public.bank_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
