begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table(
  'public',
  'financial_email_extraction_usage',
  'financial email extraction usage table exists'
);
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.financial_email_extraction_usage'::regclass
  ),
  'financial email extraction usage has RLS enabled'
);
select ok(
  not has_table_privilege(
    'authenticated',
    'public.financial_email_extraction_usage',
    'select'
  )
  and not has_table_privilege(
    'authenticated',
    'public.financial_email_extraction_usage',
    'insert'
  )
  and not has_table_privilege(
    'authenticated',
    'public.financial_email_extraction_usage',
    'update'
  )
  and not has_table_privilege(
    'authenticated',
    'public.financial_email_extraction_usage',
    'delete'
  ),
  'authenticated clients have no direct usage-table privileges'
);
select ok(
  (
    select prosecdef
    from pg_proc
    where oid =
      'public.claim_financial_email_extraction_slot()'::regprocedure
  ),
  'rate-limit claim function is SECURITY DEFINER'
);
select is(
  (
    select provolatile::text
    from pg_proc
    where oid =
      'public.claim_financial_email_extraction_slot()'::regprocedure
  ),
  'v',
  'rate-limit claim function is VOLATILE'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.claim_financial_email_extraction_slot()',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.claim_financial_email_extraction_slot()',
    'execute'
  ),
  'only authenticated clients can claim extraction capacity'
);

insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at)
values
  (
    '00000000-0000-0000-0000-00000000005a',
    'authenticated',
    'authenticated',
    true,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-00000000005b',
    'authenticated',
    'authenticated',
    true,
    now(),
    now()
  );

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok(
  $$ select public.claim_financial_email_extraction_slot() $$,
  '42501',
  'An authenticated user is required.',
  'claim rejects a missing auth.uid()'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000005a","role":"authenticated"}',
  true
);

select is(
  (select allowed from public.claim_financial_email_extraction_slot()),
  true,
  'first claim is allowed'
);
select is(
  (select remaining from public.claim_financial_email_extraction_slot()),
  18,
  'second claim reports eighteen remaining slots'
);
select public.claim_financial_email_extraction_slot()
from generate_series(1, 18);
select is(
  (select allowed from public.claim_financial_email_extraction_slot()),
  false,
  'twenty-first claim is denied'
);
select is(
  (select remaining from public.claim_financial_email_extraction_slot()),
  0,
  'denied claim reports no remaining capacity'
);
select ok(
  (select retry_after_seconds > 0
   from public.claim_financial_email_extraction_slot()),
  'denied claim reports a positive retry interval'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000005b","role":"authenticated"}',
  true
);
select is(
  (select allowed from public.claim_financial_email_extraction_slot()),
  true,
  'User B has an independent rate-limit window'
);

reset role;
select is(
  (
    select request_count
    from public.financial_email_extraction_usage
    where user_id = '00000000-0000-0000-0000-00000000005a'
  ),
  20::smallint,
  'denied claims never increase User A beyond the limit'
);
select is(
  (
    select request_count
    from public.financial_email_extraction_usage
    where user_id = '00000000-0000-0000-0000-00000000005b'
  ),
  1::smallint,
  'User B usage remains isolated from User A'
);

select * from finish();
rollback;
