create extension if not exists pgcrypto;

-- Shared updated_at helper
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Public user profile table used by comments / leaderboard / profile pages.
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_display_name_length
    check (display_name is null or char_length(trim(display_name)) between 2 and 20)
);

create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.touch_updated_at();

alter table public.user_profiles enable row level security;

drop policy if exists "profiles are public" on public.user_profiles;
create policy "profiles are public"
  on public.user_profiles for select using (true);

drop policy if exists "users insert own profile" on public.user_profiles;
create policy "users insert own profile"
  on public.user_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update own profile" on public.user_profiles;
create policy "users update own profile"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional bootstrap profile row on signup.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_profile_created'
  ) then
    create trigger on_auth_user_profile_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user_profile();
  end if;
end;
$$;

-- Cached resolution rows used by settlement and future score jobs.
create table if not exists public.market_resolutions (
  event_slug text not null,
  market_slug text not null,
  winning_outcome_index integer not null,
  source text not null default 'polymarket',
  resolved_at timestamptz not null default now(),
  primary key (event_slug, market_slug)
);

alter table public.market_resolutions enable row level security;

drop policy if exists "market resolutions are public" on public.market_resolutions;
create policy "market resolutions are public"
  on public.market_resolutions for select using (true);

-- POC paper position table.
create table if not exists public.paper_positions (
  id uuid primary key default gen_random_uuid(),
  guest_session_id uuid not null,
  user_id uuid null references auth.users(id) on delete set null,
  event_slug text not null,
  event_title text not null,
  market_slug text not null,
  market_question text not null,
  token_id text not null,
  outcome_index integer not null check (outcome_index >= 0),
  outcome_label text not null,
  entry_price numeric not null check (entry_price > 0 and entry_price <= 1),
  stake_amount numeric not null check (stake_amount > 0),
  shares numeric not null check (shares > 0),
  status text not null default 'open' check (status in ('open', 'closed', 'settled')),
  status_resolved text not null default 'pending'
    check (status_resolved in ('pending', 'won', 'lost', 'voided')),
  resolved_outcome_index integer null,
  realized_pnl numeric null,
  settled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_paper_positions_guest_created
  on public.paper_positions (guest_session_id, created_at desc);
create index if not exists ix_paper_positions_user_created
  on public.paper_positions (user_id, created_at desc);
create index if not exists ix_paper_positions_event_slug
  on public.paper_positions (event_slug);
create index if not exists ix_paper_positions_market_slug
  on public.paper_positions (market_slug);
create index if not exists ix_paper_positions_token_id
  on public.paper_positions (token_id);
create index if not exists ix_paper_positions_status_resolved
  on public.paper_positions (status_resolved);

create trigger trg_paper_positions_updated_at
before update on public.paper_positions
for each row
execute function public.touch_updated_at();

alter table public.paper_positions enable row level security;

drop policy if exists "users read own paper positions" on public.paper_positions;
create policy "users read own paper positions"
  on public.paper_positions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert own paper positions" on public.paper_positions;
create policy "users insert own paper positions"
  on public.paper_positions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update own paper positions" on public.paper_positions;
create policy "users update own paper positions"
  on public.paper_positions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_display_name(
  p_name text
)
returns public.user_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_trimmed text := nullif(trim(p_name), '');
  v_row public.user_profiles;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;

  if v_trimmed is null or char_length(v_trimmed) < 2 or char_length(v_trimmed) > 20 then
    raise exception 'display name must be 2-20 characters';
  end if;

  insert into public.user_profiles (user_id, display_name)
  values (v_uid, v_trimmed)
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.create_paper_position(
  p_guest_session_id uuid,
  p_user_id uuid,
  p_event_slug text,
  p_event_title text,
  p_market_slug text,
  p_market_question text,
  p_token_id text,
  p_outcome_index integer,
  p_outcome_label text,
  p_entry_price numeric,
  p_stake_amount numeric,
  p_shares numeric
)
returns public.paper_positions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.paper_positions;
begin
  if p_event_slug is null or p_market_slug is null or p_token_id is null then
    raise exception 'event, market, and token are required';
  end if;

  if p_outcome_index < 0 then
    raise exception 'outcome index must be >= 0';
  end if;

  if p_entry_price <= 0 or p_entry_price > 1 then
    raise exception 'entry price must be between 0 and 1';
  end if;

  if p_stake_amount <= 0 or p_shares <= 0 then
    raise exception 'stake and shares must be > 0';
  end if;

  insert into public.paper_positions (
    guest_session_id,
    user_id,
    event_slug,
    event_title,
    market_slug,
    market_question,
    token_id,
    outcome_index,
    outcome_label,
    entry_price,
    stake_amount,
    shares
  )
  values (
    p_guest_session_id,
    p_user_id,
    p_event_slug,
    p_event_title,
    p_market_slug,
    p_market_question,
    p_token_id,
    p_outcome_index,
    p_outcome_label,
    p_entry_price,
    p_stake_amount,
    p_shares
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.list_paper_positions(
  p_guest_session_id uuid,
  p_user_id uuid default null,
  p_status_filter text default null
)
returns setof public.paper_positions
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.paper_positions p
  where (
    p.guest_session_id = p_guest_session_id
    or (p_user_id is not null and p.user_id = p_user_id)
  )
  and (
    p_status_filter is null
    or p.status_resolved = p_status_filter
  )
  order by p.created_at desc;
$$;

create or replace function public.settle_market(
  p_event_slug text,
  p_market_slug text,
  p_winning_outcome_index integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  insert into public.market_resolutions (
    event_slug,
    market_slug,
    winning_outcome_index,
    source,
    resolved_at
  )
  values (
    p_event_slug,
    p_market_slug,
    p_winning_outcome_index,
    'polymarket',
    now()
  )
  on conflict (event_slug, market_slug) do update
    set winning_outcome_index = excluded.winning_outcome_index,
        source = excluded.source,
        resolved_at = excluded.resolved_at;

  with updated as (
    update public.paper_positions p
    set
      status = 'settled',
      status_resolved = case
        when p.outcome_index = p_winning_outcome_index then 'won'
        else 'lost'
      end,
      resolved_outcome_index = p_winning_outcome_index,
      realized_pnl = case
        when p.outcome_index = p_winning_outcome_index then p.shares - p.stake_amount
        else -p.stake_amount
      end,
      settled_at = now(),
      updated_at = now()
    where p.event_slug = p_event_slug
      and p.market_slug = p_market_slug
      and p.status_resolved = 'pending'
    returning 1
  )
  select count(*)::integer into v_count from updated;

  return v_count;
end;
$$;

create or replace function public.get_user_stats(
  p_user_id uuid default null,
  p_guest_session_id uuid default null
)
returns table (
  total_predictions bigint,
  pending_count bigint,
  won_count bigint,
  lost_count bigint,
  win_rate numeric,
  total_staked numeric,
  pending_staked numeric,
  realized_pnl numeric,
  available_balance numeric,
  starting_balance numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with scoped as (
    select *
    from public.paper_positions p
    where (
      (p_guest_session_id is not null and p.guest_session_id = p_guest_session_id)
      or (p_user_id is not null and p.user_id = p_user_id)
    )
  ),
  agg as (
    select
      count(*)::bigint as total_predictions,
      count(*) filter (where status_resolved = 'pending')::bigint as pending_count,
      count(*) filter (where status_resolved = 'won')::bigint as won_count,
      count(*) filter (where status_resolved = 'lost')::bigint as lost_count,
      coalesce(sum(stake_amount), 0)::numeric as total_staked,
      coalesce(sum(stake_amount) filter (where status_resolved = 'pending'), 0)::numeric as pending_staked,
      coalesce(sum(realized_pnl), 0)::numeric as realized_pnl
    from scoped
  )
  select
    total_predictions,
    pending_count,
    won_count,
    lost_count,
    case
      when (won_count + lost_count) > 0
        then won_count::numeric / (won_count + lost_count)::numeric
      else 0
    end as win_rate,
    total_staked,
    pending_staked,
    realized_pnl,
    (10000 - pending_staked + realized_pnl)::numeric as available_balance,
    10000::numeric as starting_balance
  from agg;
$$;

create or replace function public.list_leaderboard(
  p_limit int default 50
)
returns table (
  user_id uuid,
  display_name text,
  total_predictions bigint,
  won_count bigint,
  lost_count bigint,
  win_rate numeric,
  realized_pnl numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with agg as (
    select
      p.user_id,
      count(*) filter (where p.status_resolved in ('won', 'lost'))::bigint as total_predictions,
      count(*) filter (where p.status_resolved = 'won')::bigint as won_count,
      count(*) filter (where p.status_resolved = 'lost')::bigint as lost_count,
      coalesce(sum(p.realized_pnl), 0)::numeric as realized_pnl
    from public.paper_positions p
    where p.user_id is not null
    group by p.user_id
  )
  select
    up.user_id,
    coalesce(up.display_name, up.user_id::text) as display_name,
    a.total_predictions,
    a.won_count,
    a.lost_count,
    case
      when (a.won_count + a.lost_count) > 0
        then a.won_count::numeric / (a.won_count + a.lost_count)::numeric
      else 0
    end as win_rate,
    a.realized_pnl
  from agg a
  join public.user_profiles up on up.user_id = a.user_id
  where a.total_predictions > 0
  order by win_rate desc, realized_pnl desc, total_predictions desc, display_name asc
  limit greatest(coalesce(p_limit, 50), 1);
$$;

create or replace function public.get_profile_by_name(
  p_name text
)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  total_predictions bigint,
  won_count bigint,
  lost_count bigint,
  win_rate numeric,
  realized_pnl numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with target as (
    select *
    from public.user_profiles
    where lower(display_name) = lower(trim(p_name))
    limit 1
  ),
  agg as (
    select
      p.user_id,
      count(*) filter (where p.status_resolved in ('won', 'lost'))::bigint as total_predictions,
      count(*) filter (where p.status_resolved = 'won')::bigint as won_count,
      count(*) filter (where p.status_resolved = 'lost')::bigint as lost_count,
      coalesce(sum(p.realized_pnl), 0)::numeric as realized_pnl
    from public.paper_positions p
    join target t on t.user_id = p.user_id
    group by p.user_id
  )
  select
    t.user_id,
    t.display_name,
    t.avatar_url,
    coalesce(a.total_predictions, 0)::bigint as total_predictions,
    coalesce(a.won_count, 0)::bigint as won_count,
    coalesce(a.lost_count, 0)::bigint as lost_count,
    case
      when coalesce(a.won_count, 0) + coalesce(a.lost_count, 0) > 0
        then coalesce(a.won_count, 0)::numeric / (coalesce(a.won_count, 0) + coalesce(a.lost_count, 0))::numeric
      else 0
    end as win_rate,
    coalesce(a.realized_pnl, 0)::numeric as realized_pnl
  from target t
  left join agg a on a.user_id = t.user_id;
$$;

grant execute on function public.set_display_name(text) to authenticated;
grant execute on function public.create_paper_position(uuid, uuid, text, text, text, text, text, integer, text, numeric, numeric, numeric) to anon, authenticated;
grant execute on function public.list_paper_positions(uuid, uuid, text) to anon, authenticated;
grant execute on function public.settle_market(text, text, integer) to authenticated;
grant execute on function public.get_user_stats(uuid, uuid) to anon, authenticated;
grant execute on function public.list_leaderboard(int) to anon, authenticated;
grant execute on function public.get_profile_by_name(text) to anon, authenticated;
