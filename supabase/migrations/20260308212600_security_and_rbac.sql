-- Phase 1.2 Security & Isolation
-- Implementing RLS and RBAC tables

-- 1. Roles and Permissions
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'admin', 'accountant', 'employee', 'viewer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'ledger.write', 'pix.pay', 'reports.view', etc.
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 2. Memberships (Linking Users to Companies with Roles)
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'invited', 'suspended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- 3. Enabling RLS on Core Multi-tenant tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 4. Global Policy Helper: Get current user's companies
CREATE OR REPLACE FUNCTION public.get_my_companies() RETURNS TABLE(company_id UUID) AS $$
BEGIN
    RETURN QUERY SELECT m.company_id FROM public.memberships m WHERE m.user_id = auth.uid() AND m.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Strict Isolation Policies
DROP POLICY IF EXISTS company_isolation_policy ON public.companies;
CREATE POLICY company_isolation_policy ON public.companies
    FOR ALL USING (id IN (SELECT company_id FROM public.get_my_companies()));

DROP POLICY IF EXISTS membership_isolation_policy ON public.memberships;
CREATE POLICY membership_isolation_policy ON public.memberships
    FOR ALL USING (company_id IN (SELECT company_id FROM public.get_my_companies()));

DROP POLICY IF EXISTS role_isolation_policy ON public.roles;
CREATE POLICY role_isolation_policy ON public.roles
    FOR ALL USING (company_id IN (SELECT company_id FROM public.get_my_companies()));

-- 6. Bootstrap permissions
INSERT INTO public.permissions (name, description) VALUES
('ledger.view', 'View financial ledger'),
('ledger.write', 'Create transactions'),
('ledger.reverse', 'Reverse transactions'),
('pix.pay', 'Execute Pix payments'),
('pix.receive', 'Generate Pix QR codes'),
('admin.manage', 'Manage users and roles')
ON CONFLICT DO NOTHING;
