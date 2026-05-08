-- 댓글 테이블 (이벤트 단위)
create table public.event_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_slug text not null,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index ix_event_comments_event on public.event_comments (event_slug, created_at desc);
create index ix_event_comments_user on public.event_comments (user_id, created_at desc);

alter table public.event_comments enable row level security;

create policy "comments are public"
  on public.event_comments for select using (true);

create policy "users insert own comments"
  on public.event_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users delete own comments"
  on public.event_comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- 좋아요 테이블 (한 사용자당 댓글 1개에 1번)
create table public.event_comment_likes (
  comment_id uuid not null references public.event_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index ix_event_comment_likes_comment on public.event_comment_likes (comment_id);

alter table public.event_comment_likes enable row level security;

create policy "likes are public"
  on public.event_comment_likes for select using (true);

create policy "users like for self"
  on public.event_comment_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users unlike own"
  on public.event_comment_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- 댓글 + 작성자 프로필 + 좋아요 카운트 + 내가 좋아요했는지 한방에 가져오는 RPC
create or replace function public.list_event_comments(
  p_event_slug text,
  p_sort text default 'newest',
  p_user_id uuid default null,
  p_limit int default 50
)
returns table (
  id uuid,
  user_id uuid,
  event_slug text,
  body text,
  created_at timestamptz,
  display_name text,
  avatar_url text,
  like_count bigint,
  liked_by_me boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.user_id,
    c.event_slug,
    c.body,
    c.created_at,
    p.display_name,
    p.avatar_url,
    coalesce(lc.cnt, 0) as like_count,
    case when p_user_id is null then false
         else exists (
           select 1 from public.event_comment_likes l
           where l.comment_id = c.id and l.user_id = p_user_id
         )
    end as liked_by_me
  from public.event_comments c
  left join public.user_profiles p on p.user_id = c.user_id
  left join lateral (
    select count(*)::bigint as cnt
    from public.event_comment_likes l
    where l.comment_id = c.id
  ) lc on true
  where c.event_slug = p_event_slug
  order by
    case when p_sort = 'popular' then coalesce(lc.cnt, 0) end desc nulls last,
    c.created_at desc
  limit greatest(coalesce(p_limit, 50), 1);
$$;

grant execute on function public.list_event_comments(text, text, uuid, int) to anon, authenticated;
