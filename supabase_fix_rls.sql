-- =========================================
-- FIX RLS POLICIES
-- Run this in the Supabase SQL Editor
-- =========================================

-- Drop existing incomplete policies to start fresh
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "companies_select" ON public.companies;
DROP POLICY IF EXISTS "companies_insert" ON public.companies;
DROP POLICY IF EXISTS "memberships_select" ON public.memberships;

-- =========================================
-- PROFILES
-- =========================================
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =========================================
-- COMPANIES - Full CRUD for owners
-- =========================================
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.company_id = companies.id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "companies_delete" ON public.companies
  FOR DELETE USING (auth.uid() = owner_id);

-- =========================================
-- MEMBERSHIPS - Full CRUD
-- =========================================
CREATE POLICY "memberships_select" ON public.memberships
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = memberships.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "memberships_insert" ON public.memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "memberships_update" ON public.memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "memberships_delete" ON public.memberships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = company_id
      AND companies.owner_id = auth.uid()
    )
  );

-- =========================================
-- ACCOUNTS
-- =========================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_select" ON public.accounts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.memberships WHERE company_id = accounts.company_id AND user_id = auth.uid())
  );

CREATE POLICY "accounts_insert" ON public.accounts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.memberships WHERE company_id = accounts.company_id AND user_id = auth.uid() AND role IN ('owner','admin','member'))
  );

CREATE POLICY "accounts_update" ON public.accounts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.memberships WHERE company_id = accounts.company_id AND user_id = auth.uid() AND role IN ('owner','admin','member'))
  );

CREATE POLICY "accounts_delete" ON public.accounts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
  );

-- =========================================
-- TRANSACTIONS
-- =========================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.accounts a
      JOIN public.companies c ON c.id = a.company_id
      WHERE a.id = transactions.account_id
      AND (c.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.memberships m WHERE m.company_id = c.id AND m.user_id = auth.uid()))
    )
  );

CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts a
      JOIN public.companies c ON c.id = a.company_id
      WHERE a.id = account_id
      AND (c.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.memberships m WHERE m.company_id = c.id AND m.user_id = auth.uid() AND m.role IN ('owner','admin','member')))
    )
  );

-- =========================================
-- EXPENSES AND CATEGORIES
-- =========================================
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_categories_all" ON public.expense_categories
  USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.memberships WHERE company_id = expense_categories.company_id AND user_id = auth.uid())
  );

CREATE POLICY "expenses_select" ON public.expenses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.memberships WHERE company_id = expenses.company_id AND user_id = auth.uid())
  );

CREATE POLICY "expenses_insert" ON public.expenses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.memberships WHERE company_id = expenses.company_id AND user_id = auth.uid() AND role IN ('owner','admin','member'))
  );

CREATE POLICY "expenses_update" ON public.expenses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.memberships WHERE company_id = expenses.company_id AND user_id = auth.uid() AND role IN ('owner','admin'))
  );

-- =========================================
-- CUSTOMERS, VENDORS, INVOICES
-- =========================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Helper: company membership check
CREATE POLICY "customers_all" ON public.customers
  USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.memberships WHERE company_id = customers.company_id AND user_id = auth.uid())
  );

CREATE POLICY "vendors_all" ON public.vendors
  USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.memberships WHERE company_id = vendors.company_id AND user_id = auth.uid())
  );

CREATE POLICY "invoices_all" ON public.invoices
  USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.memberships WHERE company_id = invoices.company_id AND user_id = auth.uid())
  );

-- =========================================
-- WALLETS
-- =========================================
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallets_all" ON public.wallets
  USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.memberships WHERE company_id = wallets.company_id AND user_id = auth.uid())
  );

-- =========================================
-- RISK AND SAVINGS
-- =========================================
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "risk_scores_all" ON public.risk_scores
  USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.memberships WHERE company_id = risk_scores.company_id AND user_id = auth.uid())
  );

CREATE POLICY "savings_insights_all" ON public.savings_insights
  USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.memberships WHERE company_id = savings_insights.company_id AND user_id = auth.uid())
  );

-- =========================================
-- GRANT PERMISSIONS TO anon AND authenticated
-- =========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
