
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own companies" ON public.companies FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own companies" ON public.companies FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own companies" ON public.companies FOR DELETE USING (auth.uid() = owner_id);

-- Accounts table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit', 'investment')),
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accounts for their companies" ON public.accounts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = accounts.company_id AND companies.owner_id = auth.uid()));
CREATE POLICY "Users can create accounts for their companies" ON public.accounts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = accounts.company_id AND companies.owner_id = auth.uid()));
CREATE POLICY "Users can update accounts for their companies" ON public.accounts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = accounts.company_id AND companies.owner_id = auth.uid()));
CREATE POLICY "Users can delete accounts for their companies" ON public.accounts FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = accounts.company_id AND companies.owner_id = auth.uid()));

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'Uncategorized',
  description TEXT NOT NULL DEFAULT '',
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions for their accounts" ON public.transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.accounts
    JOIN public.companies ON companies.id = accounts.company_id
    WHERE accounts.id = transactions.account_id AND companies.owner_id = auth.uid()
  ));
CREATE POLICY "Users can create transactions for their accounts" ON public.transactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.accounts
    JOIN public.companies ON companies.id = accounts.company_id
    WHERE accounts.id = transactions.account_id AND companies.owner_id = auth.uid()
  ));
CREATE POLICY "Users can update transactions for their accounts" ON public.transactions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.accounts
    JOIN public.companies ON companies.id = accounts.company_id
    WHERE accounts.id = transactions.account_id AND companies.owner_id = auth.uid()
  ));
CREATE POLICY "Users can delete transactions for their accounts" ON public.transactions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.accounts
    JOIN public.companies ON companies.id = accounts.company_id
    WHERE accounts.id = transactions.account_id AND companies.owner_id = auth.uid()
  ));

-- Cash flow forecasts table
CREATE TABLE public.cashflow_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  predicted_balance NUMERIC(15, 2) NOT NULL,
  forecast_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cashflow_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view forecasts for their companies" ON public.cashflow_forecasts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = cashflow_forecasts.company_id AND companies.owner_id = auth.uid()));
CREATE POLICY "Users can create forecasts for their companies" ON public.cashflow_forecasts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = cashflow_forecasts.company_id AND companies.owner_id = auth.uid()));
CREATE POLICY "Users can update forecasts for their companies" ON public.cashflow_forecasts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = cashflow_forecasts.company_id AND companies.owner_id = auth.uid()));
CREATE POLICY "Users can delete forecasts for their companies" ON public.cashflow_forecasts FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = cashflow_forecasts.company_id AND companies.owner_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_companies_owner ON public.companies(owner_id);
CREATE INDEX idx_accounts_company ON public.accounts(company_id);
CREATE INDEX idx_transactions_account ON public.transactions(account_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_cashflow_forecasts_company ON public.cashflow_forecasts(company_id);
CREATE INDEX idx_cashflow_forecasts_date ON public.cashflow_forecasts(forecast_date);
