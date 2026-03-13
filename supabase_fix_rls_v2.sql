-- =========================================
-- FIX RLS: Remove Circular References
-- Run this in the Supabase SQL Editor
-- =========================================

-- The previous fix caused a circular dependency:
-- companies policy → references memberships
-- memberships policy → references companies
-- → infinite recursion → 500 error

-- STEP 1: Disable RLS temporarily to clean up
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- STEP 3: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_insights ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create SIMPLE policies WITHOUT cross-table references

-- PROFILES: Simple ownership check
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- COMPANIES: Only check owner_id (NO reference to memberships)
CREATE POLICY "companies_select" ON public.companies FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "companies_insert" ON public.companies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies_update" ON public.companies FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "companies_delete" ON public.companies FOR DELETE USING (auth.uid() = owner_id);

-- MEMBERSHIPS: Only check user_id (NO reference to companies)
CREATE POLICY "memberships_select" ON public.memberships FOR SELECT USING (user_id = auth.uid() OR invited_by = auth.uid());
CREATE POLICY "memberships_insert" ON public.memberships FOR INSERT WITH CHECK (invited_by = auth.uid() OR user_id = auth.uid());
CREATE POLICY "memberships_update" ON public.memberships FOR UPDATE USING (user_id = auth.uid() OR invited_by = auth.uid());
CREATE POLICY "memberships_delete" ON public.memberships FOR DELETE USING (invited_by = auth.uid());

-- ACCOUNTS: Check company_id via user's company ownership (simple join, no cycle)
CREATE POLICY "accounts_all" ON public.accounts
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- TRANSACTIONS: Via account -> company
CREATE POLICY "transactions_all" ON public.transactions
  USING (account_id IN (
    SELECT a.id FROM public.accounts a 
    WHERE a.company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
  ));

-- EXPENSES
CREATE POLICY "expenses_all" ON public.expenses
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "expense_categories_all" ON public.expense_categories
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- CUSTOMERS, VENDORS, INVOICES
CREATE POLICY "customers_all" ON public.customers
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "vendors_all" ON public.vendors
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "invoices_all" ON public.invoices
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- WALLETS
CREATE POLICY "wallets_all" ON public.wallets
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- RISK & SAVINGS
CREATE POLICY "risk_scores_all" ON public.risk_scores
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

CREATE POLICY "savings_insights_all" ON public.savings_insights
  USING (company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()));

-- STEP 5: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
