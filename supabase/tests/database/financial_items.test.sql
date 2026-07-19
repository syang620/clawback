begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'financial_items', 'financial_items exists');
select has_table(
  'public',
  'financial_item_bootstrap',
  'financial_item_bootstrap exists'
);
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.financial_items'::regclass
  ),
  'financial_items has RLS enabled'
);
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.financial_item_bootstrap'::regclass
  ),
  'financial_item_bootstrap has RLS enabled'
);
select has_index(
  'public',
  'financial_items',
  'financial_items_user_status_due_idx',
  'user-scoped query index exists'
);

select ok(
  has_table_privilege('authenticated', 'public.financial_items', 'select')
  and has_table_privilege('authenticated', 'public.financial_items', 'insert')
  and has_table_privilege('authenticated', 'public.financial_items', 'update')
  and has_table_privilege('authenticated', 'public.financial_items', 'delete'),
  'authenticated has financial item CRUD privileges'
);
select ok(
  not has_table_privilege('anon', 'public.financial_items', 'insert'),
  'anon has no financial item insert privilege'
);
select ok(
  has_table_privilege(
    'authenticated',
    'public.financial_item_bootstrap',
    'select'
  )
  and has_table_privilege(
    'authenticated',
    'public.financial_item_bootstrap',
    'insert'
  )
  and not has_table_privilege(
    'authenticated',
    'public.financial_item_bootstrap',
    'update'
  )
  and not has_table_privilege(
    'authenticated',
    'public.financial_item_bootstrap',
    'delete'
  ),
  'bootstrap grants only select and insert'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.bootstrap_financial_items()'::regprocedure
  ),
  'bootstrap function is narrowly scoped SECURITY DEFINER'
);
select is(
  (
    select provolatile::text
    from pg_proc
    where oid = 'public.bootstrap_financial_items()'::regprocedure
  ),
  'v',
  'bootstrap function is VOLATILE'
);
select ok(
  (
    select pronargs = 0 and proargnames is null
    from pg_proc
    where oid = 'public.bootstrap_financial_items()'::regprocedure
  ),
  'bootstrap function accepts no customizable arguments'
);
select is(
  to_regprocedure('public.bootstrap_financial_items(date)'),
  null::regprocedure,
  'the prior customizable date overload no longer exists'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.bootstrap_financial_items()',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.bootstrap_financial_items()',
    'execute'
  ),
  'only authenticated clients can execute bootstrap'
);

insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at)
values
  (
    '00000000-0000-0000-0000-00000000000a',
    'authenticated',
    'authenticated',
    true,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-00000000000b',
    'authenticated',
    'authenticated',
    true,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-00000000000c',
    'authenticated',
    'authenticated',
    true,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-00000000000d',
    'authenticated',
    'authenticated',
    true,
    now(),
    now()
  );

select throws_ok(
  $$
    insert into public.financial_items (user_id, kind, title, due_at)
    values (
      '00000000-0000-0000-0000-00000000000a',
      'unsupported',
      'Invalid kind',
      '2026-08-01T12:00:00Z'
    )
  $$,
  '23514',
  'new row for relation "financial_items" violates check constraint "financial_items_kind_check"',
  'database rejects unsupported item kinds'
);
select throws_ok(
  $$
    insert into public.financial_items (user_id, kind, title, due_at)
    values (
      '00000000-0000-0000-0000-00000000000a',
      'trial',
      '   ',
      '2026-08-01T12:00:00Z'
    )
  $$,
  '23514',
  'new row for relation "financial_items" violates check constraint "financial_items_title_check"',
  'database rejects blank titles'
);
select throws_ok(
  $$
    insert into public.financial_items (
      user_id, kind, title, due_at, value_cents
    ) values (
      '00000000-0000-0000-0000-00000000000a',
      'perk',
      'Negative value',
      '2026-08-01T12:00:00Z',
      -1
    )
  $$,
  '23514',
  'new row for relation "financial_items" violates check constraint "financial_items_value_cents_check"',
  'database rejects negative available value'
);
select throws_ok(
  $$
    insert into public.financial_items (
      user_id, kind, title, due_at, charge_amount_cents
    ) values (
      '00000000-0000-0000-0000-00000000000a',
      'trial',
      'Negative charge',
      '2026-08-01T12:00:00Z',
      -1
    )
  $$,
  '23514',
  'new row for relation "financial_items" violates check constraint "financial_items_charge_amount_cents_check"',
  'database rejects negative charge at risk'
);
select throws_ok(
  $$
    insert into public.financial_items (
      user_id, kind, title, due_at, recurrence
    ) values (
      '00000000-0000-0000-0000-00000000000a',
      'perk',
      'Invalid recurrence',
      '2026-08-01T12:00:00Z',
      'weekly'
    )
  $$,
  '23514',
  'new row for relation "financial_items" violates check constraint "financial_items_recurrence_check"',
  'database rejects unsupported recurrence'
);
select throws_ok(
  $$
    insert into public.financial_items (
      user_id, kind, title, due_at, action_url
    ) values (
      '00000000-0000-0000-0000-00000000000a',
      'trial',
      'Unsafe URL',
      '2026-08-01T12:00:00Z',
      'http://example.com'
    )
  $$,
  '23514',
  'new row for relation "financial_items" violates check constraint "financial_items_action_url_check"',
  'database rejects non-HTTPS action URLs'
);
select throws_ok(
  $$
    insert into public.financial_items (
      user_id, kind, title, due_at, status
    ) values (
      '00000000-0000-0000-0000-00000000000a',
      'trial',
      'Invalid status',
      '2026-08-01T12:00:00Z',
      'deleted'
    )
  $$,
  '23514',
  'new row for relation "financial_items" violates check constraint "financial_items_status_check"',
  'database rejects unsupported status'
);
select throws_ok(
  $$
    insert into public.financial_items (
      user_id, kind, title, due_at, source
    ) values (
      '00000000-0000-0000-0000-00000000000a',
      'trial',
      'Invalid source',
      '2026-08-01T12:00:00Z',
      'import'
    )
  $$,
  '23514',
  'new row for relation "financial_items" violates check constraint "financial_items_source_check"',
  'database rejects unsupported source'
);
select throws_ok(
  $$
    insert into public.financial_items (
      user_id, kind, title, due_at, extraction_confidence
    ) values (
      '00000000-0000-0000-0000-00000000000a',
      'trial',
      'Invalid confidence',
      '2026-08-01T12:00:00Z',
      1.1
    )
  $$,
  '23514',
  'new row for relation "financial_items" violates check constraint "financial_items_extraction_confidence_check"',
  'database rejects confidence outside zero to one'
);
select throws_ok(
  $$
    insert into public.financial_items (
      user_id, kind, title, due_at, status
    ) values (
      '00000000-0000-0000-0000-00000000000a',
      'trial',
      'Missing completion timestamp',
      '2026-08-01T12:00:00Z',
      'completed'
    )
  $$,
  '23514',
  'new row for relation "financial_items" violates check constraint "financial_items_completion_check"',
  'database enforces completion timestamp consistency'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}',
  true
);

insert into public.financial_items (
  id,
  user_id,
  kind,
  title,
  due_at,
  charge_amount_cents
)
values (
  '10000000-0000-0000-0000-00000000000a',
  '00000000-0000-0000-0000-00000000000a',
  'trial',
  'User A task',
  '2026-08-01T12:00:00Z',
  1000
);

select is(
  (select count(*) from public.financial_items),
  1::bigint,
  'User A can create and read User A rows'
);
update public.financial_items
set status = 'completed'
where id = '10000000-0000-0000-0000-00000000000a';
select ok(
  (
    select completed_at is not null and updated_at >= created_at
    from public.financial_items
    where id = '10000000-0000-0000-0000-00000000000a'
  ),
  'completion transition maintains server timestamps'
);
update public.financial_items
set status = 'active'
where id = '10000000-0000-0000-0000-00000000000a';
select ok(
  (
    select completed_at is null
    from public.financial_items
    where id = '10000000-0000-0000-0000-00000000000a'
  ),
  'restore transition clears completed_at'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok(
  $$ select public.bootstrap_financial_items() $$,
  '42501',
  'An authenticated user is required.',
  'bootstrap rejects a missing auth.uid()'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}',
  true
);

insert into public.financial_items (
  id,
  user_id,
  kind,
  title,
  due_at,
  value_cents
)
values (
  '10000000-0000-0000-0000-00000000000b',
  '00000000-0000-0000-0000-00000000000b',
  'perk',
  'User B task',
  '2026-08-02T12:00:00Z',
  2000
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)
    from public.financial_items
    where user_id = '00000000-0000-0000-0000-00000000000b'
  ),
  0::bigint,
  'User A cannot read User B rows'
);
select results_eq(
  $$
    update public.financial_items
    set title = 'Unauthorized update'
    where id = '10000000-0000-0000-0000-00000000000b'
    returning id
  $$,
  $$ values (null::uuid) limit 0 $$,
  'User A cannot update User B rows'
);
select results_eq(
  $$
    delete from public.financial_items
    where id = '10000000-0000-0000-0000-00000000000b'
    returning id
  $$,
  $$ values (null::uuid) limit 0 $$,
  'User A cannot delete User B rows'
);

insert into public.financial_item_bootstrap (user_id)
values ('00000000-0000-0000-0000-00000000000a');

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}',
  true
);

select is(
  (select count(*) from public.financial_item_bootstrap),
  0::bigint,
  'User B cannot read User A bootstrap marker'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok(
  $$
    insert into public.financial_items (
      user_id,
      kind,
      title,
      due_at
    ) values (
      '00000000-0000-0000-0000-00000000000a',
      'trial',
      'Unauthenticated write',
      '2026-08-03T12:00:00Z'
    )
  $$,
  '42501',
  'permission denied for table financial_items',
  'an unauthenticated client cannot write financial items'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    insert into public.financial_items (
      user_id,
      kind,
      title,
      due_at,
      source
    ) values (
      '00000000-0000-0000-0000-00000000000c',
      'trial',
      'Caller supplied demo row',
      '2026-08-03T12:00:00Z',
      'demo'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "financial_items"',
  'authenticated callers cannot directly insert demo rows'
);

select ok(
  public.bootstrap_financial_items(),
  'first bootstrap call seeds an empty user'
);
select ok(
  not public.bootstrap_financial_items(),
  'repeated bootstrap is a no-op'
);
select is(
  (select count(*) from public.financial_items),
  3::bigint,
  'bootstrap inserts exactly three owned rows'
);
select is(
  (
    select count(*)
    from public.financial_items
    where source = 'demo'
  ),
  3::bigint,
  'bootstrap preserves demo source'
);
select is(
  (
    select count(*)
    from public.financial_items
    where user_id = '00000000-0000-0000-0000-00000000000c'
      and title in (
        'Cancel free trial',
        'Use monthly Dunkin'' credit',
        'Use quarterly airline benefit'
      )
      and extraction_confidence is null
  ),
  3::bigint,
  'bootstrap inserts only its fixed version-controlled demo descriptors'
);
select is(
  (
    select due_at
    from public.financial_items
    where provider = 'FoundersCard'
  ),
  (
    ((timezone('UTC', statement_timestamp()))::date + 3)::timestamp
    + interval '12 hours'
  ) at time zone 'UTC',
  'bootstrap uses the canonical noon-UTC deadline'
);
select is(
  (
    select min(due_at)
    from public.financial_items
  ),
  (
    select due_at
    from public.financial_items
    where provider = 'FoundersCard'
  ),
  'FoundersCard remains the earliest seeded deadline'
);

update public.financial_items
set status = 'completed'
where provider = 'FoundersCard';
delete from public.financial_items
where provider = 'Amex Gold';
select ok(
  not public.bootstrap_financial_items(),
  'bootstrap remains claimed after seed rows are changed or deleted'
);
select is(
  (select count(*) from public.financial_items),
  2::bigint,
  'bootstrap does not reinsert deleted or completed demo rows'
);
select ok(
  (
    select status = 'completed'
    from public.financial_items
    where provider = 'FoundersCard'
  )
  and not exists (
    select 1
    from public.financial_items
    where provider = 'Amex Gold'
  ),
  'bootstrap preserves the caller changes made after initial seeding'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}',
  true
);

insert into public.financial_items (
  user_id,
  kind,
  title,
  due_at,
  source,
  extraction_confidence
)
values
  (
    '00000000-0000-0000-0000-00000000000d',
    'trial',
    'Direct manual row',
    '2026-08-04T12:00:00Z',
    'manual',
    null
  ),
  (
    '00000000-0000-0000-0000-00000000000d',
    'subscription',
    'Direct email row',
    '2026-08-05T12:00:00Z',
    'email',
    0.75
  );
select is(
  (
    select count(*)
    from public.financial_items
    where source in ('manual', 'email')
  ),
  2::bigint,
  'authenticated clients can insert owned manual and email rows'
);
select throws_ok(
  $$
    update public.financial_items
    set source = 'email', extraction_confidence = 0.5
    where title = 'Direct manual row'
  $$,
  '42501',
  'Financial item provenance cannot be changed.',
  'authenticated clients cannot change source or confidence'
);
select throws_ok(
  $$
    insert into public.financial_items (
      user_id,
      kind,
      title,
      due_at,
      source,
      extraction_confidence
    ) values (
      '00000000-0000-0000-0000-00000000000d',
      'trial',
      'Manual row with confidence',
      '2026-08-06T12:00:00Z',
      'manual',
      0.5
    )
  $$,
  '23514',
  'new row for relation "financial_items" violates check constraint "financial_items_source_confidence_check"',
  'manual rows cannot carry extraction confidence'
);
select throws_ok(
  $$
    insert into public.financial_items (
      user_id,
      kind,
      title,
      due_at,
      source,
      extraction_confidence
    ) values (
      '00000000-0000-0000-0000-00000000000d',
      'subscription',
      'Email row without confidence',
      '2026-08-07T12:00:00Z',
      'email',
      null
    )
  $$,
  '23514',
  'new row for relation "financial_items" violates check constraint "financial_items_source_confidence_check"',
  'email rows require validated extraction confidence'
);

select * from finish();
rollback;
