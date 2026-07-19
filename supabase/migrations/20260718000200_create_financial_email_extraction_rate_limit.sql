create table public.financial_email_extraction_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, window_started_at),
  constraint financial_email_extraction_usage_count_check
    check (request_count between 1 and 20)
);

alter table public.financial_email_extraction_usage enable row level security;

revoke all on table public.financial_email_extraction_usage from public;
revoke all on table public.financial_email_extraction_usage from anon;
revoke all on table public.financial_email_extraction_usage from authenticated;

create function public.claim_financial_email_extraction_slot()
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_window timestamptz :=
    date_trunc('hour', now() at time zone 'UTC') at time zone 'UTC';
  claimed_count smallint;
  retry_seconds integer := greatest(
    1,
    ceil(extract(epoch from (current_window + interval '1 hour' - now())))::integer
  );
begin
  if current_user_id is null then
    raise exception 'An authenticated user is required.'
      using errcode = '42501';
  end if;

  insert into public.financial_email_extraction_usage (
    user_id,
    window_started_at,
    request_count
  )
  values (current_user_id, current_window, 1)
  on conflict (user_id, window_started_at) do update
  set
    request_count = public.financial_email_extraction_usage.request_count + 1,
    updated_at = now()
  where public.financial_email_extraction_usage.request_count < 20
  returning request_count into claimed_count;

  if claimed_count is null then
    return query select false, 0, retry_seconds;
    return;
  end if;

  return query select true, 20 - claimed_count::integer, retry_seconds;
end;
$$;

revoke execute on function public.claim_financial_email_extraction_slot()
  from public;
revoke execute on function public.claim_financial_email_extraction_slot()
  from anon;
grant execute on function public.claim_financial_email_extraction_slot()
  to authenticated;
