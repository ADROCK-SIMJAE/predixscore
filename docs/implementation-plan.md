# PredixScore 개발 계획

> 실제 개발 순서의 현재 기준 문서.
> 마지막 갱신: 2026-05-13

## 1. 개발 원칙

제품 구현 트랙은 두 가지다.

- `Track A`: Supabase-only paper trading을 먼저 만든다.
- `Track B`: Supabase + 가스비 대납 blockchain commit-reveal을 처음부터 만든다.

두 트랙을 섞어서 애매하게 만들지 않는다.

Track A로 만들 경우:

- UI와 데이터 구조는 Track B로 바꾸기 쉽게 잡는다.
- 단, copy에서 onchain verification을 약속하면 안 된다.

Track B로 만들 경우:

- 별도 paper position 시스템을 메인 플로우로 만들지 않는다.
- paper flow는 local/dev fallback 정도로만 둔다.

## 2. Track A 일정: 블록체인 없이 먼저

목표:

- 빠르게 사용 가능한 paper trading 제품을 만든다.
- 시장 탐색, 예측 생성, 포트폴리오, 정산, 통계, 프로필, 리더보드를 검증한다.
- 이후 저장 동작만 sponsored commit으로 바꿀 수 있게 화면 흐름을 맞춘다.

### Phase A1: Supabase Paper Trading Core

예상: 1주

파일:

- [`supabase/migrations/0002_paper_trading.sql`](../supabase/migrations/0002_paper_trading.sql)
- [`src/app/api/paper/positions/route.ts`](../src/app/api/paper/positions/route.ts)
- [`src/app/api/paper/settle/route.ts`](../src/app/api/paper/settle/route.ts)
- [`src/app/api/paper/stats/route.ts`](../src/app/api/paper/stats/route.ts)
- [`src/lib/paper.ts`](../src/lib/paper.ts)

작업:

- migration 적용 여부 확인
- Supabase generated type과 DB 일치 확인
- `create_paper_position` 검증
- `list_paper_positions` 검증
- `settle_market` 검증
- `get_user_stats` 검증
- `list_leaderboard` 검증
- `get_profile_by_name` 검증
- `set_display_name` 검증

완료 기준:

- `POST /api/paper/positions`가 position을 생성한다.
- `GET /api/paper/positions`가 positions와 totals를 반환한다.
- `POST /api/paper/settle`이 명확한 binary 결과를 정산한다.
- `GET /api/paper/stats`가 balance/stats를 반환한다.

### Phase A2: Bet UX와 Market Guardrail

예상: 1주

파일:

- [`src/components/markets/BetModal.tsx`](../src/components/markets/BetModal.tsx)
- [`src/components/markets/MarketDetailClient.tsx`](../src/components/markets/MarketDetailClient.tsx)
- [`src/components/markets/MarketCard.tsx`](../src/components/markets/MarketCard.tsx)
- [`src/lib/polymarket.ts`](../src/lib/polymarket.ts)
- [`src/lib/polymarket-resolution.ts`](../src/lib/polymarket-resolution.ts)

작업:

- `tokenId + outcomeIndex + price` validation 적용
- unsupported market에서는 예측 CTA 비활성화
- read-only 사유 표시
- stake validation 강화
- loading/disabled 상태 정리
- 저장 성공 후 portfolio 반영
- 비로그인 flow 정리

완료 기준:

- 사용자가 이벤트 상세에서 valid paper position을 만들 수 있다.
- invalid price/token/outcome은 제출할 수 없다.
- unsupported market은 읽을 수 있지만 저장할 수 없다.

### Phase A3: Portfolio, Profile, Leaderboard

예상: 1-2주

파일:

- [`src/app/positions/page.tsx`](../src/app/positions/page.tsx)
- [`src/components/portfolio/PositionsList.tsx`](../src/components/portfolio/PositionsList.tsx)
- [`src/components/portfolio/BalanceChip.tsx`](../src/components/portfolio/BalanceChip.tsx)
- [`src/app/leaderboard/page.tsx`](../src/app/leaderboard/page.tsx)
- [`src/app/profile/me/page.tsx`](../src/app/profile/me/page.tsx)
- [`src/app/profile/[name]/page.tsx`](../src/app/profile/[name]/page.tsx)

작업:

- home, positions, stats, profile 숫자 기준 통일
- pending/won/lost view 정리
- realized PnL과 win rate 포맷 통일
- leaderboard 정렬 기준 확정
- empty/loading/error 상태 정리

완료 기준:

- home portfolio, positions page, stats API, profile, leaderboard 숫자가 맞다.
- 사용자가 pending stake, available balance, realized PnL을 구분할 수 있다.

### Phase A4: Locale과 QA

예상: 1주

파일:

- [`messages/ko.json`](../messages/ko.json)
- [`messages/en.json`](../messages/en.json)
- [`src/lib/format.ts`](../src/lib/format.ts)

작업:

- 필요한 곳의 `en-US` 하드코딩 제거
- paper trading 상태 문구 ko/en 추가
- unsupported market 문구 추가
- 수동 QA 시나리오 수행

완료 기준:

- 핵심 화면이 한국어/영어에서 모두 동작한다.
- 통화, 퍼센트, 날짜, 상대 시간이 locale-aware로 표시된다.

## 3. Track B 일정: 가스비 대납 블록체인 먼저

목표:

- server-blind, gas-sponsored prediction commit을 첫 제품 구조로 만든다.
- Supabase는 plaintext prediction이 아니라 encrypted/indexed metadata를 저장한다.

### Phase B0: Chain / Paymaster Bake-off

예상: 1-2주

후보:

- Base
- Polygon PoS
- Ronin

작업:

- 동일한 registry interface를 testnet에 배포
- 후보별 commit transaction 최소 100회 테스트
- 후보별 reveal transaction 최소 100회 테스트
- 성공률, 지연, 예상 비용, 모바일 wallet friction 측정
- paymaster setup과 contract allowlist 검증
- 최종 체인과 fallback 체인 결정

완료 기준:

- 최종 체인 결정
- paymaster/provider 결정
- sponsorship 비용 모델 문서화

### Phase B1: Contract와 Hash 규칙

예상: 2-3주

작업:

- `PredixScoreRegistry` 확정
- `marketRef` 계산 규칙 확정
- commit hash 입력 필드 확정
- `revealAfter` 규칙 확정
- 중복 commit 방지
- reveal validation
- indexing용 event schema 확정
- Foundry 테스트 확대

완료 기준:

- testnet contract에서 commit/reveal이 동작한다.
- frontend/backend/contract가 같은 hash 규칙을 사용한다.

### Phase B2: Wallet과 Sponsored Commit UX

예상: 2-3주

작업:

- 선택한 wallet stack 연동
- paymaster/sponsored transaction flow 연동
- commit transaction 상태 UI 추가
- sponsorship 실패 retry path 추가
- Supabase에 commit tx metadata 저장
- prediction plaintext는 client-side에만 유지

완료 기준:

- 유저가 native gas token 없이 commit할 수 있다.
- Supabase는 ciphertext와 tx metadata만 저장한다.
- 서버는 reveal 전 prediction payload를 읽을 수 없다.

### Phase B3: Encryption, Reveal, Indexing

예상: 2-3주

작업:

- client-side encryption 구현
- key recovery/signature flow 정의
- reveal transaction 구현
- onchain event indexing
- reveal payload와 Polymarket resolution 매칭
- verified result 기준 profile/leaderboard 업데이트

완료 기준:

- 유저가 commit, reveal, verified score까지 완료할 수 있다.
- unrevealed/failed reveal 상태가 화면에 보인다.
- leaderboard는 verified prediction 기준으로 계산된다.

## 4. 공통 QA 시나리오

### Market Browsing

- 홈에서 active Polymarket event가 로드된다.
- 검색이 동작한다.
- 태그/카테고리 필터가 동작한다.
- 이벤트 상세에서 metadata, markets, orderbook, history가 로드된다.
- unsupported market도 read-only로 볼 수 있다.

### Position Creation

- valid market은 예측 가능하다.
- token id가 없으면 예측 CTA가 비활성화된다.
- price가 없으면 예측 CTA가 비활성화된다.
- stake `0`은 거절된다.
- entry price가 `0 < price <= 1` 범위를 벗어나면 거절된다.

### Settlement

- 명확한 `1/0` 결과의 closed binary market은 정산된다.
- ambiguous closed market은 pending 유지된다.
- won/lost position의 realized PnL이 맞다.
- 정산 후 stats/profile/leaderboard가 갱신된다.

### Sponsored Blockchain

- 유저가 gas token 없이 commit할 수 있다.
- sponsorship 실패 시 retry/fallback이 있다.
- reveal 전 Supabase는 plaintext를 받지 않는다.
- reveal이 원래 commit hash와 검증된다.
- failed/unrevealed prediction 상태가 명확하다.

## 5. 기본 다음 단계

첫 공개 버전에서 onchain verification이 필수가 아니라면 Track A를 먼저 진행한다.

순서:

1. Supabase migration/RPC 확인
2. paper API end-to-end 검증
3. Bet UX와 unsupported market 처리 강화
4. portfolio/profile/leaderboard 연결
5. chain/paymaster 우선순위가 확정되면 Track B bake-off 시작

