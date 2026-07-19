alter table public.financial_items
add constraint financial_items_source_confidence_check
check (
  (source = 'email' and extraction_confidence is not null)
  or (source in ('manual', 'demo') and extraction_confidence is null)
);

drop policy "financial_items_insert_own" on public.financial_items;

create policy "financial_items_insert_own"
on public.financial_items
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and source in ('manual', 'email')
);

create function public.prevent_financial_item_provenance_update()
returns trigger
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  if new.source is distinct from old.source
    or new.extraction_confidence is distinct from old.extraction_confidence
  then
    raise exception 'Financial item provenance cannot be changed.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke execute on function public.prevent_financial_item_provenance_update()
from public;
revoke execute on function public.prevent_financial_item_provenance_update()
from anon;
revoke execute on function public.prevent_financial_item_provenance_update()
from authenticated;

create trigger prevent_financial_item_provenance_update
before update on public.financial_items
for each row execute function public.prevent_financial_item_provenance_update();

drop function public.bootstrap_financial_items(date);

create function public.bootstrap_financial_items()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  reference_date date :=
    (pg_catalog.timezone('UTC', pg_catalog.statement_timestamp()))::date;
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

  founders_date := reference_date + 3;
  amex_date := (
    pg_catalog.date_trunc('month', founders_date::timestamp)
    + interval '1 month - 1 day'
  )::date;
  if amex_date <= founders_date then
    amex_date := (
      pg_catalog.date_trunc('month', founders_date::timestamp)
      + interval '2 months - 1 day'
    )::date;
  end if;

  hilton_date := (
    pg_catalog.date_trunc('quarter', founders_date::timestamp)
    + interval '3 months - 1 day'
  )::date;
  if hilton_date <= founders_date then
    hilton_date := (
      pg_catalog.date_trunc('quarter', founders_date::timestamp)
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
    source,
    extraction_confidence
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
      'demo',
      null
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
      'demo',
      null
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
      'demo',
      null
    );

  return true;
end;
$$;

revoke execute on function public.bootstrap_financial_items() from public;
revoke execute on function public.bootstrap_financial_items() from anon;
grant execute on function public.bootstrap_financial_items() to authenticated;
