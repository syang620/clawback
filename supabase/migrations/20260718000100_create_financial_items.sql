create table public.financial_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  provider text,
  value_cents integer,
  charge_amount_cents integer,
  due_at timestamptz not null,
  recurrence text not null default 'none',
  action_url text,
  status text not null default 'active',
  source text not null default 'manual',
  extraction_confidence numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint financial_items_kind_check
    check (kind in ('trial', 'perk', 'subscription')),
  constraint financial_items_title_check
    check (btrim(title) <> ''),
  constraint financial_items_value_cents_check
    check (value_cents is null or value_cents >= 0),
  constraint financial_items_charge_amount_cents_check
    check (charge_amount_cents is null or charge_amount_cents >= 0),
  constraint financial_items_recurrence_check
    check (recurrence in ('none', 'monthly', 'quarterly', 'annual', 'custom')),
  constraint financial_items_action_url_check
    check (action_url is null or action_url ~ '^https://'),
  constraint financial_items_status_check
    check (status in ('active', 'completed', 'expired')),
  constraint financial_items_source_check
    check (source in ('manual', 'email', 'demo')),
  constraint financial_items_extraction_confidence_check
    check (
      extraction_confidence is null
      or extraction_confidence between 0 and 1
    ),
  constraint financial_items_completion_check
    check (
      (status = 'completed' and completed_at is not null)
      or (status <> 'completed' and completed_at is null)
    )
);

create index financial_items_user_status_due_idx
  on public.financial_items (user_id, status, due_at, id);

create function public.set_financial_item_timestamps()
returns trigger
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();

  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at := now();
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

revoke execute on function public.set_financial_item_timestamps() from public;
revoke execute on function public.set_financial_item_timestamps() from anon;

create trigger set_financial_item_timestamps
before update on public.financial_items
for each row execute function public.set_financial_item_timestamps();

alter table public.financial_items enable row level security;

revoke all on table public.financial_items from public;
revoke all on table public.financial_items from anon;
grant select, insert, update, delete on table public.financial_items to authenticated;

create policy "financial_items_select_own"
on public.financial_items
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "financial_items_insert_own"
on public.financial_items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "financial_items_update_own"
on public.financial_items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "financial_items_delete_own"
on public.financial_items
for delete
to authenticated
using ((select auth.uid()) = user_id);

create table public.financial_item_bootstrap (
  user_id uuid primary key references auth.users(id) on delete cascade,
  initialized_at timestamptz not null default now()
);

alter table public.financial_item_bootstrap enable row level security;

revoke all on table public.financial_item_bootstrap from public;
revoke all on table public.financial_item_bootstrap from anon;
grant select, insert on table public.financial_item_bootstrap to authenticated;

create policy "financial_item_bootstrap_select_own"
on public.financial_item_bootstrap
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "financial_item_bootstrap_insert_own"
on public.financial_item_bootstrap
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create function public.bootstrap_financial_items(
  p_reference_date date default ((timezone('UTC', now()))::date)
)
returns boolean
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  claimed boolean := false;
  founders_date date;
  amex_date date;
  hilton_date date;
begin
  if current_user_id is null then
    raise exception 'An authenticated user is required.'
      using errcode = '42501';
  end if;

  insert into public.financial_item_bootstrap (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing
  returning true into claimed;

  if not coalesce(claimed, false) then
    return false;
  end if;

  if exists (
    select 1
    from public.financial_items
    where user_id = current_user_id
  ) then
    return false;
  end if;

  founders_date := p_reference_date + 3;
  amex_date := (
    date_trunc('month', founders_date::timestamp)
    + interval '1 month - 1 day'
  )::date;
  if amex_date <= founders_date then
    amex_date := (
      date_trunc('month', founders_date::timestamp)
      + interval '2 months - 1 day'
    )::date;
  end if;

  hilton_date := (
    date_trunc('quarter', founders_date::timestamp)
    + interval '3 months - 1 day'
  )::date;
  if hilton_date <= founders_date then
    hilton_date := (
      date_trunc('quarter', founders_date::timestamp)
      + interval '6 months - 1 day'
    )::date;
  end if;

  insert into public.financial_items (
    user_id,
    kind,
    title,
    provider,
    value_cents,
    charge_amount_cents,
    due_at,
    recurrence,
    action_url,
    source
  )
  values
    (
      current_user_id,
      'trial',
      'Cancel free trial',
      'FoundersCard',
      null,
      59500,
      (founders_date::timestamp + interval '12 hours') at time zone 'UTC',
      'annual',
      'https://founderscard.com/',
      'demo'
    ),
    (
      current_user_id,
      'perk',
      'Use monthly Dunkin'' credit',
      'Amex Gold',
      700,
      null,
      (amex_date::timestamp + interval '12 hours') at time zone 'UTC',
      'monthly',
      null,
      'demo'
    ),
    (
      current_user_id,
      'perk',
      'Use quarterly airline benefit',
      'Hilton Aspire',
      5000,
      null,
      (hilton_date::timestamp + interval '12 hours') at time zone 'UTC',
      'quarterly',
      null,
      'demo'
    );

  return true;
end;
$$;

revoke execute on function public.bootstrap_financial_items(date) from public;
revoke execute on function public.bootstrap_financial_items(date) from anon;
grant execute on function public.bootstrap_financial_items(date) to authenticated;
