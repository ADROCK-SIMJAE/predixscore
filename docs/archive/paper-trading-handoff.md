# Paper Trading Handoff

## Goal

- Polymarket는 `시장 데이터 소스`로만 사용
- 우리 서비스는 `모의 예측 / 모의 포지션 / 포트폴리오 추적`만 제공
- 실거래, 지갑 체결, house-account 주문은 현재 목표가 아님

## Current App State

- 홈 화면은 Polymarket 이벤트 목록을 읽어옴
- 이벤트 상세는 Polymarket 이벤트/오더북/히스토리를 읽어옴
- 상세 우측 티켓은 `실거래 주문창`이 아니라 `mock position 저장` 기준으로 바뀜
- 홈 우측에는 `Paper Portfolio` 카드가 추가되어 `/api/paper/positions` 를 조회함
- 서버 코드는 이미 Supabase RPC 계약을 기대하도록 연결되어 있음

관련 파일:

- [src/app/api/paper/positions/route.ts](/Users/simjaehyeong/Desktop/adrock/predixscore/src/app/api/paper/positions/route.ts:1)
- [src/lib/paper.ts](/Users/simjaehyeong/Desktop/adrock/predixscore/src/lib/paper.ts:1)
- [src/lib/supabase/server.ts](/Users/simjaehyeong/Desktop/adrock/predixscore/src/lib/supabase/server.ts:1)
- [src/components/markets/MarketDetailClient.tsx](/Users/simjaehyeong/Desktop/adrock/predixscore/src/components/markets/MarketDetailClient.tsx:1)
- [src/components/markets/MarketsHome.tsx](/Users/simjaehyeong/Desktop/adrock/predixscore/src/components/markets/MarketsHome.tsx:1)

## Important Status

- `paper_positions` 테이블은 아직 Supabase에 없음
- nested Codex 세션에서 `Supabase MCP execute_sql` 쓰기 호출이 반복 취소되어 DB 반영이 안 됨
- 확인 결과 `public.paper_positions` 는 아직 존재하지 않음
- 앱 빌드는 현재 코드 기준 통과함

## DB Work Claude Code Should Do

Claude Code 세션에서 Supabase MCP로 아래를 직접 생성하면 됨.

### 1. Table

`public.paper_positions`

필드:

- `id uuid primary key default gen_random_uuid()`
- `guest_session_id uuid not null`
- `user_id uuid null references auth.users(id) on delete set null`
- `event_slug text not null`
- `event_title text not null`
- `market_slug text not null`
- `market_question text not null`
- `token_id text not null`
- `outcome_index integer not null check (outcome_index >= 0)`
- `outcome_label text not null`
- `entry_price numeric not null check (entry_price > 0 and entry_price <= 1)`
- `stake_amount numeric not null check (stake_amount > 0)`
- `shares numeric not null check (shares > 0)`
- `status text not null default 'open' check (status in ('open','closed','settled'))`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

인덱스:

- `(guest_session_id, created_at desc)`
- `(user_id, created_at desc)`
- `(event_slug)`
- `(token_id)`

### 2. Trigger Helper

`public.touch_updated_at()`

- `before update` 시 `new.updated_at = now()`

트리거:

- `trg_paper_positions_updated_at`

### 3. RPC Functions

`public.create_paper_position(...) returns public.paper_positions`

파라미터:

- `p_guest_session_id uuid`
- `p_event_slug text`
- `p_event_title text`
- `p_market_slug text`
- `p_market_question text`
- `p_token_id text`
- `p_outcome_index integer`
- `p_outcome_label text`
- `p_entry_price numeric`
- `p_stake_amount numeric`
- `p_shares numeric`

동작:

- `paper_positions` insert
- inserted row 그대로 반환

`public.list_paper_positions(p_guest_session_id uuid) returns setof public.paper_positions`

동작:

- 해당 `guest_session_id` rows 반환
- `created_at desc` 정렬

권한:

- 두 함수 모두 `security definer`
- `grant execute` to `anon, authenticated`

## API Contract Already Expected By App

### GET `/api/paper/positions`

서버는 아래 RPC를 호출함:

- `list_paper_positions(p_guest_session_id := cookie value)`

응답 shape:

```ts
{
  positions: Array<{
    id: string;
    eventSlug: string;
    eventTitle: string;
    marketSlug: string;
    marketQuestion: string;
    outcomeLabel: string;
    entryPrice: number;
    currentPrice: number | null;
    stakeAmount: number;
    shares: number;
    currentValue: number | null;
    pnlAmount: number | null;
    pnlPercent: number | null;
    createdAt: string;
  }>;
  totals: {
    staked: number;
    currentValue: number;
    pnl: number;
    pnlPercent: number;
  };
}
```

### POST `/api/paper/positions`

입력 shape:

```ts
{
  eventSlug: string;
  eventTitle: string;
  marketSlug: string;
  marketQuestion: string;
  tokenId: string;
  outcomeIndex: number;
  outcomeLabel: string;
  entryPrice: number;
  stakeAmount: number;
}
```

서버가 내부 계산:

- `shares = stakeAmount / entryPrice`

호출 RPC:

- `create_paper_position(...)`

## Cookie Contract

- 쿠키명: `predixscore-paper-session`
- 위치: [src/lib/paper.ts](/Users/simjaehyeong/Desktop/adrock/predixscore/src/lib/paper.ts:1)
- 인증 없이 브라우저별 mock portfolio를 유지하기 위한 guest session key

## Notes About Existing Tables

현재 Supabase에는 기존 앱 구조의 아래 테이블이 이미 있음:

- `public.profiles`
- `public.predictions`
- `public.user_predictions`

이들은 기존 서비스용 구조라서 재사용하지 않고 `paper_*` 로 분리하는 게 맞음.

## Suggested Claude Code Prompt

Claude Code 쪽에서는 대략 이런 식으로 바로 진행하면 됨:

```text
Supabase MCP로 public.paper_positions 테이블과 create_paper_position, list_paper_positions, touch_updated_at trigger를 직접 생성해줘. 계약은 docs/paper-trading-handoff.md 기준으로 맞추고, 끝나면 실제로 테이블/함수 존재 확인까지 해줘.
```

## After DB Creation

DB 생성이 끝나면 바로 확인할 것:

1. `paper_positions` 존재 여부
2. `create_paper_position` RPC 호출 가능 여부
3. `list_paper_positions` RPC 호출 가능 여부
4. 브라우저에서 이벤트 상세 페이지에서 mock position 저장 시 201 응답 여부
5. 홈 `Paper Portfolio` 카드에 저장 결과 표시 여부

## Non-DB Follow-up

DB가 붙은 뒤 다음 구현 후보:

- guest session 대신 auth user merge
- position close / settle
- realized PnL
- leaderboard / profile portfolio
