-- POC blockchain commit/reveal tracking for paper positions.
-- All onchain heavy lifting happens client-side. Supabase stores tx metadata
-- only — never plaintext (outcome/stake/price/salt) before reveal.

create table if not exists public.blockchain_commits (
  id uuid primary key default gen_random_uuid(),
  paper_position_id uuid not null references public.paper_positions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  chain_id integer not null,
  contract_address text not null,
  commit_id numeric null,
  commit_hash text not null,
  market_ref text not null,
  tx_hash text not null,
  block_number bigint null,
  reveal_after timestamptz not null,
  -- encrypted salt + plaintext payload (only client can decrypt with wallet password)
  encrypted_payload text null,
  status text not null default 'committed'
    check (status in ('committed', 'revealed', 'failed')),
  reveal_tx_hash text null,
  revealed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tx_hash)
);

create index if not exists ix_blockchain_commits_user
  on public.blockchain_commits (user_id, created_at desc);
create index if not exists ix_blockchain_commits_position
  on public.blockchain_commits (paper_position_id);
create index if not exists ix_blockchain_commits_status
  on public.blockchain_commits (status);

create trigger trg_blockchain_commits_updated_at
before update on public.blockchain_commits
for each row
execute function public.touch_updated_at();

alter table public.blockchain_commits enable row level security;

drop policy if exists "users read own commits" on public.blockchain_commits;
create policy "users read own commits"
  on public.blockchain_commits for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert own commits" on public.blockchain_commits;
create policy "users insert own commits"
  on public.blockchain_commits for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update own commits" on public.blockchain_commits;
create policy "users update own commits"
  on public.blockchain_commits for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Convenience: store wallet → user mapping so we can show "verified wallet" badge.
create table if not exists public.user_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  wallet_address text not null,
  chain_id integer not null,
  linked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ix_user_wallets_address
  on public.user_wallets (wallet_address);

create trigger trg_user_wallets_updated_at
before update on public.user_wallets
for each row
execute function public.touch_updated_at();

alter table public.user_wallets enable row level security;

drop policy if exists "wallets are public for read" on public.user_wallets;
create policy "wallets are public for read"
  on public.user_wallets for select using (true);

drop policy if exists "users upsert own wallet" on public.user_wallets;
create policy "users upsert own wallet"
  on public.user_wallets for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update own wallet" on public.user_wallets;
create policy "users update own wallet"
  on public.user_wallets for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RPC to record commit metadata + bind wallet in one shot.
create or replace function public.record_blockchain_commit(
  p_paper_position_id uuid,
  p_wallet_address text,
  p_chain_id integer,
  p_contract_address text,
  p_commit_id numeric,
  p_commit_hash text,
  p_market_ref text,
  p_tx_hash text,
  p_block_number bigint,
  p_reveal_after timestamptz,
  p_encrypted_payload text
)
returns public.blockchain_commits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.blockchain_commits;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;

  -- bind wallet to user (idempotent)
  insert into public.user_wallets (user_id, wallet_address, chain_id)
  values (v_uid, p_wallet_address, p_chain_id)
  on conflict (user_id) do update
    set wallet_address = excluded.wallet_address,
        chain_id = excluded.chain_id,
        updated_at = now();

  insert into public.blockchain_commits (
    paper_position_id,
    user_id,
    wallet_address,
    chain_id,
    contract_address,
    commit_id,
    commit_hash,
    market_ref,
    tx_hash,
    block_number,
    reveal_after,
    encrypted_payload
  )
  values (
    p_paper_position_id,
    v_uid,
    p_wallet_address,
    p_chain_id,
    p_contract_address,
    p_commit_id,
    p_commit_hash,
    p_market_ref,
    p_tx_hash,
    p_block_number,
    p_reveal_after,
    p_encrypted_payload
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.record_blockchain_reveal(
  p_commit_row_id uuid,
  p_reveal_tx_hash text
)
returns public.blockchain_commits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.blockchain_commits;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;

  update public.blockchain_commits
  set
    status = 'revealed',
    reveal_tx_hash = p_reveal_tx_hash,
    revealed_at = now(),
    updated_at = now()
  where id = p_commit_row_id
    and user_id = v_uid
  returning * into v_row;

  if v_row is null then
    raise exception 'commit row not found or not owned';
  end if;

  return v_row;
end;
$$;

create or replace function public.list_blockchain_commits(
  p_user_id uuid default null
)
returns setof public.blockchain_commits
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.blockchain_commits
  where (p_user_id is not null and user_id = p_user_id)
     or (p_user_id is null and user_id = auth.uid())
  order by created_at desc;
$$;

grant execute on function public.record_blockchain_commit(uuid, text, integer, text, numeric, text, text, text, bigint, timestamptz, text) to authenticated;
grant execute on function public.record_blockchain_reveal(uuid, text) to authenticated;
grant execute on function public.list_blockchain_commits(uuid) to authenticated;
