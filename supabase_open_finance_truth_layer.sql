-- =========================================
-- OPEN FINANCE (Belvo) + FINANCIAL TRUTH LAYER (SPED-like)
-- Run in Supabase SQL Editor
--
-- Requires (run first):
--   1) supabase_restore_schema.sql
--   2) supabase_missing_tables.sql
-- =========================================

-- Extensions
create extension if not exists "pgcrypto";

-- =========================================
-- 1) Open Finance: Provider identity + metadata
-- =========================================

-- Accounts: add provider/external_id so we can upsert Belvo accounts without duplicates.
alter table public.accounts
  add column if not exists provider text,
  add column if not exists external_id text,
  add column if not exists currency text default 'BRL',
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists bank_connection_id uuid references public.bank_connections(id) on delete set null;

create unique index if not exists accounts_company_provider_external_id_uq
  on public.accounts(company_id, provider, external_id);

-- Bank connections: avoid duplicated link rows and store optional provider connection id.
alter table public.bank_connections
  add column if not exists provider_connection_id text;

create unique index if not exists bank_connections_company_provider_account_id_uq
  on public.bank_connections(company_id, provider, account_id);

-- Transactions: add company_id (denormalized), provider/external_id (dedupe), metadata/raw, and updated_at.
alter table public.transactions
  add column if not exists company_id uuid,
  add column if not exists provider text,
  add column if not exists external_id text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now();

-- Backfill company_id from account_id (best effort).
update public.transactions t
set company_id = a.company_id
from public.accounts a
where t.company_id is null and t.account_id = a.id;

do $$
begin
  if exists (select 1 from public.transactions where company_id is null) then
    raise notice 'Skipping NOT NULL on transactions.company_id because there are rows with NULL company_id.';
  else
    execute 'alter table public.transactions alter column company_id set not null';
  end if;
end $$;

create unique index if not exists transactions_provider_external_id_uq
  on public.transactions(provider, external_id);

create index if not exists transactions_company_date_idx
  on public.transactions(company_id, date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

-- =========================================
-- 2) Reconciliation: Bank -> (match) -> Ledger
-- =========================================

create table if not exists public.reconciliations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  ledger_entry_id uuid references public.ledger_entries(id) on delete set null,
  status text not null default 'pending', -- pending | reconciled | divergent
  match_score numeric(5,2),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (transaction_id)
);

alter table public.reconciliations enable row level security;
create policy "reconciliations_all" on public.reconciliations
  using (company_id in (select id from public.companies where owner_id = auth.uid()))
  with check (company_id in (select id from public.companies where owner_id = auth.uid()));

drop trigger if exists set_reconciliations_updated_at on public.reconciliations;
create trigger set_reconciliations_updated_at
before update on public.reconciliations
for each row
execute function public.set_updated_at();

create index if not exists reconciliations_company_status_idx
  on public.reconciliations(company_id, status);

-- =========================================
-- 3) Audit logs: who changed what (no surprises)
-- =========================================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  action text not null, -- INSERT | UPDATE | DELETE
  table_name text not null,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;
create policy "audit_logs_all" on public.audit_logs
  using (company_id in (select id from public.companies where owner_id = auth.uid()));

-- Generic audit trigger for tables that include company_id.
-- We intentionally skip logging when auth.uid() is null (e.g., service role sync jobs).
create or replace function public.audit_log_company_id()
returns trigger
language plpgsql
security definer
as $$
declare
  actor uuid;
  company uuid;
begin
  actor := auth.uid();
  if actor is null then
    if (tg_op = 'DELETE') then
      return old;
    else
      return new;
    end if;
  end if;

  company := coalesce(new.company_id, old.company_id);
  if company is null then
    -- If the row doesn't carry company_id yet (legacy data), skip auditing instead of failing the write.
    if (tg_op = 'DELETE') then
      return old;
    else
      return new;
    end if;
  end if;

  if (tg_op = 'INSERT') then
    insert into public.audit_logs(company_id, actor_user_id, action, table_name, record_id, old_value, new_value)
    values (company, actor, tg_op, tg_table_name, new.id, null, to_jsonb(new));
    return new;
  elsif (tg_op = 'UPDATE') then
    insert into public.audit_logs(company_id, actor_user_id, action, table_name, record_id, old_value, new_value)
    values (company, actor, tg_op, tg_table_name, new.id, to_jsonb(old), to_jsonb(new));
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.audit_logs(company_id, actor_user_id, action, table_name, record_id, old_value, new_value)
    values (company, actor, tg_op, tg_table_name, old.id, to_jsonb(old), null);
    return old;
  end if;

  return null;
end;
$$;

-- Attach audit logs to high-value tables (low volume).
drop trigger if exists audit_bank_connections on public.bank_connections;
create trigger audit_bank_connections
after insert or update or delete on public.bank_connections
for each row execute function public.audit_log_company_id();

drop trigger if exists audit_accounts on public.accounts;
create trigger audit_accounts
after insert or update or delete on public.accounts
for each row execute function public.audit_log_company_id();

-- Transactions: log only UPDATE/DELETE (category edits, manual corrections).
drop trigger if exists audit_transactions on public.transactions;
create trigger audit_transactions
after update or delete on public.transactions
for each row execute function public.audit_log_company_id();

drop trigger if exists audit_receivables on public.receivables;
create trigger audit_receivables
after insert or update or delete on public.receivables
for each row execute function public.audit_log_company_id();

drop trigger if exists audit_payables on public.payables;
create trigger audit_payables
after insert or update or delete on public.payables
for each row execute function public.audit_log_company_id();

drop trigger if exists audit_tax_apurations on public.tax_apurations;
create trigger audit_tax_apurations
after insert or update or delete on public.tax_apurations
for each row execute function public.audit_log_company_id();

-- =========================================
-- 4) Financial Truth Layer: immutable, hash-chained ledger entries
-- =========================================

alter table public.ledger_entries
  add column if not exists prev_hash text,
  add column if not exists entry_hash text,
  add column if not exists hash_version integer not null default 1,
  add column if not exists sealed_at timestamptz;

create index if not exists ledger_entries_company_sealed_idx
  on public.ledger_entries(company_id, sealed_at desc);

-- Stable advisory lock key for a company id (prevents hash forks under concurrency).
create or replace function public.ftl_company_lock_key(company_id uuid)
returns bigint
language sql
immutable
as $$
  select ('x' || substr(md5(company_id::text), 1, 16))::bit(64)::bigint;
$$;

create or replace function public.ftl_lock_company(company_id uuid)
returns void
language plpgsql
as $$
begin
  perform pg_advisory_xact_lock(public.ftl_company_lock_key(company_id));
end;
$$;

-- Seal a ledger entry: compute prev_hash + entry_hash, then mark sealed_at.
create or replace function public.ftl_seal_ledger_entry(entry_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  e record;
  prev text;
  payload jsonb;
  new_hash text;
begin
  select * into e from public.ledger_entries where id = entry_id;
  if not found then
    raise exception 'ledger_entries % not found', entry_id;
  end if;

  if e.sealed_at is not null then
    return e.entry_hash;
  end if;

  perform public.ftl_lock_company(e.company_id);

  select le.entry_hash into prev
  from public.ledger_entries le
  where le.company_id = e.company_id
    and le.sealed_at is not null
    and le.id <> e.id
  order by le.sealed_at desc nulls last
  limit 1;

  select jsonb_build_object(
    'id', e.id,
    'company_id', e.company_id,
    'entry_date', e.entry_date,
    'description', coalesce(e.description, ''),
    'reference', coalesce(e.reference, ''),
    'created_by', e.created_by,
    'lines', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'ledger_account_id', l.ledger_account_id,
          'debit', l.debit,
          'credit', l.credit
        )
        order by l.ledger_account_id::text, l.debit, l.credit, l.id::text
      )
      from public.ledger_entry_lines l
      where l.ledger_entry_id = e.id
    ), '[]'::jsonb)
  ) into payload;

  new_hash := encode(digest(coalesce(prev, '') || '|' || payload::text, 'sha256'), 'hex');

  -- Mark internal update so the immutability trigger can allow the seal write.
  perform set_config('ftl.internal', '1', true);

  update public.ledger_entries
  set prev_hash = prev,
      entry_hash = new_hash,
      sealed_at = now()
  where id = e.id
    and sealed_at is null;

  return new_hash;
end;
$$;

-- Block mutations to sealed ledger entries and all line updates/deletes.
create or replace function public.ftl_block_ledger_entries_update_delete()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'DELETE') then
    raise exception 'Ledger entries are immutable.';
  end if;

  -- Allow only internal seal updates to hash columns.
  if current_setting('ftl.internal', true) is distinct from '1' then
    raise exception 'Ledger entries are immutable.';
  end if;

  if new.company_id is distinct from old.company_id
     or new.description is distinct from old.description
     or new.reference is distinct from old.reference
     or new.entry_date is distinct from old.entry_date
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Ledger entries are immutable.';
  end if;

  return new;
end;
$$;

drop trigger if exists ftl_ledger_entries_immutable on public.ledger_entries;
create trigger ftl_ledger_entries_immutable
before update or delete on public.ledger_entries
for each row execute function public.ftl_block_ledger_entries_update_delete();

create or replace function public.ftl_block_ledger_entry_lines_mutations()
returns trigger
language plpgsql
as $$
declare
  sealed timestamptz;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    raise exception 'Ledger lines are immutable.';
  end if;

  select sealed_at into sealed
  from public.ledger_entries
  where id = new.ledger_entry_id;

  if sealed is not null then
    raise exception 'Cannot insert lines into a sealed ledger entry.';
  end if;

  return new;
end;
$$;

drop trigger if exists ftl_ledger_entry_lines_immutable on public.ledger_entry_lines;
create trigger ftl_ledger_entry_lines_immutable
before insert or update or delete on public.ledger_entry_lines
for each row execute function public.ftl_block_ledger_entry_lines_mutations();

-- Try to seal entries after lines are inserted (once balanced: sum(debit)=sum(credit)).
create or replace function public.ftl_try_seal_after_lines_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  entry_id uuid;
  debit_total numeric;
  credit_total numeric;
  already_sealed timestamptz;
begin
  for entry_id in (select distinct ledger_entry_id from new_table) loop
    select sealed_at into already_sealed from public.ledger_entries where id = entry_id;
    if already_sealed is not null then
      continue;
    end if;

    select coalesce(sum(debit), 0), coalesce(sum(credit), 0)
      into debit_total, credit_total
    from public.ledger_entry_lines
    where ledger_entry_id = entry_id;

    if debit_total > 0 and abs(debit_total - credit_total) < 0.01 then
      perform public.ftl_seal_ledger_entry(entry_id);
    end if;
  end loop;

  return null;
end;
$$;

drop trigger if exists ftl_try_seal_after_lines_insert on public.ledger_entry_lines;
create trigger ftl_try_seal_after_lines_insert
after insert on public.ledger_entry_lines
referencing new table as new_table
for each statement execute function public.ftl_try_seal_after_lines_insert();

-- Audit ledger mutations (UI-driven, low volume).
drop trigger if exists audit_ledger_entries on public.ledger_entries;
create trigger audit_ledger_entries
after insert or update or delete on public.ledger_entries
for each row execute function public.audit_log_company_id();

-- Ledger lines don't have company_id, so we derive it from the parent entry.
create or replace function public.audit_log_ledger_entry_lines()
returns trigger
language plpgsql
security definer
as $$
declare
  actor uuid;
  company uuid;
  rec_id uuid;
begin
  actor := auth.uid();
  if actor is null then
    if (tg_op = 'DELETE') then
      return old;
    else
      return new;
    end if;
  end if;

  if (tg_op = 'DELETE') then
    select company_id into company from public.ledger_entries where id = old.ledger_entry_id;
    rec_id := old.id;
    insert into public.audit_logs(company_id, actor_user_id, action, table_name, record_id, old_value, new_value)
    values (company, actor, tg_op, tg_table_name, rec_id, to_jsonb(old), null);
    return old;
  elsif (tg_op = 'UPDATE') then
    select company_id into company from public.ledger_entries where id = new.ledger_entry_id;
    rec_id := new.id;
    insert into public.audit_logs(company_id, actor_user_id, action, table_name, record_id, old_value, new_value)
    values (company, actor, tg_op, tg_table_name, rec_id, to_jsonb(old), to_jsonb(new));
    return new;
  else
    select company_id into company from public.ledger_entries where id = new.ledger_entry_id;
    rec_id := new.id;
    insert into public.audit_logs(company_id, actor_user_id, action, table_name, record_id, old_value, new_value)
    values (company, actor, tg_op, tg_table_name, rec_id, null, to_jsonb(new));
    return new;
  end if;
end;
$$;

drop trigger if exists audit_ledger_entry_lines on public.ledger_entry_lines;
create trigger audit_ledger_entry_lines
after insert or update or delete on public.ledger_entry_lines
for each row execute function public.audit_log_ledger_entry_lines();

-- =========================================
-- 5) Report hashing (optional, but recommended)
-- =========================================

create table if not exists public.report_hashes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  report_type text not null, -- dre | cash_flow | balance_sheet | taxes | custom
  period_start date,
  period_end date,
  hash_algo text not null default 'sha256',
  report_hash text not null,
  payload jsonb default '{}'::jsonb,
  generated_by uuid references auth.users(id),
  generated_at timestamptz default now()
);

alter table public.report_hashes enable row level security;
create policy "report_hashes_all" on public.report_hashes
  using (company_id in (select id from public.companies where owner_id = auth.uid()))
  with check (company_id in (select id from public.companies where owner_id = auth.uid()));

create index if not exists report_hashes_company_type_period_idx
  on public.report_hashes(company_id, report_type, period_start, period_end);

-- =========================================
-- Grants
-- =========================================

grant select, insert, update, delete on public.reconciliations to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant select, insert on public.report_hashes to authenticated;
