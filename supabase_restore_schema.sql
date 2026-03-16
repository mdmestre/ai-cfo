-- =========================================
-- EXTENSIONS
-- =========================================

create extension if not exists "pgcrypto";

-- =========================================
-- PROFILES
-- =========================================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text,
    email text,
    avatar_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Auto create profile

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- =========================================
-- COMPANIES
-- =========================================

create table if not exists public.companies (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    owner_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz default now()
);

-- =========================================
-- MEMBERSHIPS
-- =========================================

create table if not exists public.memberships (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    company_id uuid not null references public.companies(id) on delete cascade,
    role text default 'member',
    invited_by uuid references auth.users(id),
    invited_email text,
    accepted_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, company_id)
);

-- =========================================
-- ACCOUNTS
-- =========================================

create table if not exists public.accounts (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    bank_name text not null,
    account_type text not null,
    balance numeric(15,2) default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =========================================
-- TRANSACTIONS
-- =========================================

create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    account_id uuid not null references public.accounts(id) on delete cascade,
    amount numeric(15,2) not null,
    category text default 'Uncategorized',
    description text default '',
    date timestamptz default now(),
    status text default 'completed',
    created_at timestamptz default now()
);

-- =========================================
-- EXPENSE CATEGORIES
-- =========================================

create table if not exists public.expense_categories (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    name text not null,
    code text,
    budget_limit numeric(15,2),
    created_at timestamptz default now()
);

-- =========================================
-- EXPENSES
-- =========================================

create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    amount numeric(15,2) not null,
    description text,
    merchant text,
    category_id uuid references public.expense_categories(id),
    expense_date timestamptz default now(),
    receipt_url text,
    status text default 'pending',
    submitted_by uuid references auth.users(id),
    created_at timestamptz default now()
);

-- =========================================
-- CUSTOMERS
-- =========================================

create table if not exists public.customers (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    name text not null,
    email text,
    document text,
    created_at timestamptz default now()
);

-- =========================================
-- VENDORS
-- =========================================

create table if not exists public.vendors (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    name text not null,
    email text,
    document text,
    created_at timestamptz default now()
);

-- =========================================
-- INVOICES
-- =========================================

create table if not exists public.invoices (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    customer_id uuid references public.customers(id),
    vendor_id uuid references public.vendors(id),
    direction text not null,
    invoice_number text not null,
    total_amount numeric(15,2) not null,
    status text default 'pending',
    due_date date,
    invoice_date date default current_date,
    notes text,
    items jsonb default '[]',
    created_by uuid references auth.users(id),
    created_at timestamptz default now()
);

-- =========================================
-- WALLETS
-- =========================================

create table if not exists public.wallets (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    name text not null,
    wallet_type text not null,
    balance numeric(15,2) default 0,
    created_at timestamptz default now()
);

-- =========================================
-- RISK & AI
-- =========================================

create table if not exists public.risk_scores (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    score integer not null,
    factors jsonb default '{}',
    recommendations text[],
    calculated_at timestamptz default now()
);

create table if not exists public.savings_insights (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    title text,
    description text,
    potential_savings numeric(15,2),
    current_spend numeric(15,2),
    category text,
    status text default 'active',
    created_at timestamptz default now()
);

-- =========================================
-- RLS
-- =========================================

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.memberships enable row level security;

-- Profiles

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id);

-- Companies

drop policy if exists "companies_select" on public.companies;
create policy "companies_select"
on public.companies
for select
using (
  auth.uid() = owner_id
  or exists (
    select 1 from public.memberships
    where memberships.company_id = companies.id
    and memberships.user_id = auth.uid()
  )
);

drop policy if exists "companies_insert" on public.companies;
create policy "companies_insert"
on public.companies
for insert
with check (auth.role() = 'authenticated');

-- Memberships

drop policy if exists "memberships_select" on public.memberships;
create policy "memberships_select"
on public.memberships
for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.companies
    where companies.id = memberships.company_id
    and companies.owner_id = auth.uid()
  )
);