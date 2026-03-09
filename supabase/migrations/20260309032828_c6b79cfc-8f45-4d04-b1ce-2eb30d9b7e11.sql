
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- 2. Create memberships table
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email text,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

-- 3. Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- 4. Create indexes
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_company_id ON public.memberships(company_id);
CREATE INDEX idx_memberships_role ON public.memberships(role);

-- 5. Security definer function: check if user is member of a company
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

-- 6. Security definer function: check if user has specific role in company
CREATE OR REPLACE FUNCTION public.has_company_role(_user_id uuid, _company_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id AND company_id = _company_id AND role = _role
  )
$$;

-- 7. Security definer function: check if user has admin-level access (owner or admin)
CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = _user_id AND company_id = _company_id AND role IN ('owner', 'admin')
  )
$$;

-- 8. RLS policies for memberships
CREATE POLICY "members_can_view_company_members"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "admins_can_insert_members"
  ON public.memberships FOR INSERT
  TO authenticated
  WITH CHECK (has_admin_access(auth.uid(), company_id));

CREATE POLICY "admins_can_update_members"
  ON public.memberships FOR UPDATE
  TO authenticated
  USING (has_admin_access(auth.uid(), company_id));

CREATE POLICY "admins_can_delete_members"
  ON public.memberships FOR DELETE
  TO authenticated
  USING (has_admin_access(auth.uid(), company_id) AND user_id != auth.uid());

-- 9. Trigger: auto-create owner membership when company is created
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.memberships (user_id, company_id, role, accepted_at)
  VALUES (NEW.owner_id, NEW.id, 'owner', now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_company();

-- 10. Backfill: create memberships for existing companies
INSERT INTO public.memberships (user_id, company_id, role, accepted_at)
SELECT owner_id, id, 'owner', now()
FROM public.companies
ON CONFLICT (user_id, company_id) DO NOTHING;

-- 11. Update owns_company to also check memberships
CREATE OR REPLACE FUNCTION public.owns_company(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid() AND company_id = _company_id
  );
$$;

-- 12. Updated_at trigger
CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
