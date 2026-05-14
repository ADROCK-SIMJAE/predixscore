# PredixScore 모의 투자 개발 작업표

> 마지막 갱신: 2026-05-13

## 1. 목적

이 문서는 모의 투자 기능을 실제 개발 작업으로 쪼갠 실행 문서다.

기준 문서:

- [`docs/mock-investing-spec.md`](./mock-investing-spec.md)
- [`docs/supabase-blockchain-spec.md`](./supabase-blockchain-spec.md)
- [`docs/roadmap.md`](./roadmap.md)

## 2. 전체 우선순위

1. Supabase schema / RPC 안정화
2. POC 저장/조회/정산 플로우 완성
3. UI 검증과 예외 처리 보강
4. i18n / locale formatting 정리
5. profile / leaderboard 집계 안정화
6. onchain 전환 준비

## 3. 작업 스트림

### Stream A — DB / Supabase

목표:

- 현재 앱이 기대하는 DB/RPC를 실제로 동작시키기

파일:

- [`supabase/migrations/0002_paper_trading.sql`](../supabase/migrations/0002_paper_trading.sql)
- [`src/types/database.ts`](../src/types/database.ts)

작업:

- `paper_positions` 스키마 검증
- `market_resolutions` 스키마 검증
- `user_profiles` 스키마 검증
- `create_paper_position` RPC 검증
- `list_paper_positions` RPC 검증
- `settle_market` RPC 검증
- `get_user_stats` RPC 검증
- `list_leaderboard` RPC 검증
- `get_profile_by_name` RPC 검증
- `set_display_name` RPC 검증
- migration 적용 후 타입 재생성

Acceptance:

- `/api/paper/positions` GET/POST 정상 동작
- `/api/paper/settle` 정상 동작
- `/api/paper/stats` 정상 동작
- `/api/leaderboard` 정상 동작
- `/api/profile/[name]` 정상 동작

### Stream B — Paper Position API

목표:

- 서버 API 계약을 실제 앱 UX와 맞추기

파일:

- [`src/app/api/paper/positions/route.ts`](../src/app/api/paper/positions/route.ts)
- [`src/app/api/paper/settle/route.ts`](../src/app/api/paper/settle/route.ts)
- [`src/app/api/paper/stats/route.ts`](../src/app/api/paper/stats/route.ts)
- [`src/lib/paper.ts`](../src/lib/paper.ts)

작업:

- payload validation 메시지 정리
- guest/user identity merge 정책 결정
- `shares` 계산 단위 고정
- current price lookup fallback 검증
- 정산 응답 shape 정리
- stats 응답 shape 정리
- API 에러 코드를 UI 에서 쓰기 쉽게 정리

Acceptance:

- 저장 실패 사유가 UI 에서 분명히 보임
- 포지션 목록과 stats 수치가 일관됨
- 정산 후 상태와 realized pnl 이 정상 반영됨

### Stream C — Market Data Integration

목표:

- Polymarket 전체 시장을 읽는 기반을 안정화

파일:

- [`src/lib/polymarket.ts`](../src/lib/polymarket.ts)
- [`src/lib/polymarket-resolution.ts`](../src/lib/polymarket-resolution.ts)
- [`src/types/polymarket.ts`](../src/types/polymarket.ts)

작업:

- binary / multi-market / multi-outcome 식별 규칙 추가
- category / tag normalization 검증
- Gamma API 기반 event/market normalization 기준 점검
- CLOB public read 기반 orderbook/history 호출 파라미터 점검
- V1 가격 기준을 `outcomePrices` 중심으로 고정하고 midpoint/last trade fallback은 V2로 분리
- resolution detection 예외 케이스 보강
- event endDate 비어 있는 케이스 보강
- unsupported market shape 분기 설계
- token id / outcome index 매칭 실패 시 read-only 처리

Acceptance:

- 홈/상세에서 다양한 시장 구조를 읽을 수 있음
- 정산 로직이 최소한 binary market 에 대해 안정적임
- unsupported market에서 예측 저장 CTA가 노출되지 않음
- Polymarket trading/auth/bridge API를 호출하지 않음

### Stream D — Bet UX

목표:

- 사용자가 모의 예측을 자연스럽게 저장할 수 있게 하기

파일:

- [`src/components/markets/BetModal.tsx`](../src/components/markets/BetModal.tsx)
- [`src/components/markets/MarketCard.tsx`](../src/components/markets/MarketCard.tsx)
- [`src/components/markets/MarketDetailClient.tsx`](../src/components/markets/MarketDetailClient.tsx)

작업:

- stake validation 강화
- save loading / disabled 상태 정리
- insufficient balance UX 보강
- unauthenticated flow 정리
- multi-outcome 지원 대비 selector 구조 정리
- unsupported market read-only 처리
- read-only 사유 표시
- commit-reveal 전환을 고려한 CTA 명칭 정리

Acceptance:

- 사용자가 모달에서 입력 실수를 바로 이해함
- 저장 직후 포지션에 반영됨
- 모바일에서도 모달 사용성 확보
- 가격/token/outcome 정보가 불완전한 market에서는 저장을 시도할 수 없음

### Stream E — Portfolio / Positions

목표:

- 사용자의 모의 투자 상태를 명확하게 보여주기

파일:

- [`src/app/positions/page.tsx`](../src/app/positions/page.tsx)
- [`src/components/portfolio/PositionsList.tsx`](../src/components/portfolio/PositionsList.tsx)
- [`src/components/portfolio/BalanceChip.tsx`](../src/components/portfolio/BalanceChip.tsx)
- [`src/app/page.tsx`](../src/app/page.tsx)

작업:

- totals / balance / pnl 표시 일관성 점검
- pending/won/lost 탭 UX 보강
- 정산 버튼 노출 정책 점검
- 포트폴리오 미리보기 정보량 조정
- empty / loading / error 상태 개선

Acceptance:

- positions page 와 home preview 수치가 맞음
- pending locked / available balance 가 혼동되지 않음

### Stream F — Profile / Leaderboard

목표:

- 모의 투자 결과를 공개 기록으로 보여주기

파일:

- [`src/app/leaderboard/page.tsx`](../src/app/leaderboard/page.tsx)
- [`src/app/profile/me/page.tsx`](../src/app/profile/me/page.tsx)
- [`src/app/profile/[name]/page.tsx`](../src/app/profile/[name]/page.tsx)
- [`src/app/api/leaderboard/route.ts`](../src/app/api/leaderboard/route.ts)
- [`src/app/api/profile/[name]/route.ts`](../src/app/api/profile/[name]/route.ts)

작업:

- leaderboard 정렬 기준 확정
- 최소 예측 수 필터 도입 여부 결정
- display name flow 정리
- profile stats 표현 정리
- realized pnl / win rate 포맷팅 통일

Acceptance:

- 리더보드와 프로필 숫자가 같은 기준으로 계산됨
- display name 설정/조회 흐름 정상

### Stream G — I18n / Locale

목표:

- 모의 투자 기능 전체를 언어팩 기반으로 운영하기

파일:

- [`messages/ko.json`](../messages/ko.json)
- [`messages/en.json`](../messages/en.json)
- [`src/lib/format.ts`](../src/lib/format.ts)
- [`src/i18n/request.ts`](../src/i18n/request.ts)
- [`src/components/i18n/LocaleToggle.tsx`](../src/components/i18n/LocaleToggle.tsx)

작업:

- paper trading 관련 문구 누락 확인
- commit/reveal 대비 문구 예약
- unsupported market type 문구 추가
- locale-aware format util 설계
- currency / percent / date / relative time locale 대응

Acceptance:

- ko/en 모두 주요 화면 깨짐 없음
- 숫자/날짜/통화 포맷이 locale 에 맞음

### Stream H — QA / Observability

목표:

- 모의 투자 흐름을 운영 가능한 상태로 만들기

파일:

- [`src/app/api/paper/positions/route.ts`](../src/app/api/paper/positions/route.ts)
- [`src/app/api/paper/settle/route.ts`](../src/app/api/paper/settle/route.ts)
- [`src/app/api/paper/stats/route.ts`](../src/app/api/paper/stats/route.ts)

작업:

- API failure logging
- settlement failure logging
- malformed market data guard
- regression checklist 작성
- seed / demo flow 정리

Acceptance:

- 실패 원인을 로그로 식별 가능
- 주요 API 에 대해 수동 회귀 테스트 가능

## 4. 구현 순서

### Phase 1

- Stream A
- Stream B
- Stream D 기본 저장 UX

완료 기준:

- 사용자가 저장/조회/정산을 끝까지 수행 가능

### Phase 2

- Stream E
- Stream F
- Stream G 기본 번역

완료 기준:

- 포트폴리오, 프로필, 리더보드까지 하나의 제품 경험으로 연결

### Phase 3

- Stream C
- Stream G locale formatting 심화
- Stream H

완료 기준:

- 시장 커버 범위 확대와 운영 안정성 확보

### Phase 4

- onchain commit-reveal 전환 준비

완료 기준:

- POC 에서 blockchain 구조로 넘어갈 준비 완료

## 5. 빠른 착수 체크리스트

지금 바로 먼저 해야 할 일:

- `0002_paper_trading.sql` 적용
- Supabase 타입 재생성
- `/api/paper/positions` 실동작 확인
- `/api/paper/settle` 실동작 확인
- `/api/paper/stats` 실동작 확인
- leaderboard/profile 데이터 연결 확인
- `src/lib/format.ts` locale 대응 설계

## 6. 구현 후 검증 시나리오

### 시나리오 1 — 저장

1. 로그인
2. 이벤트 상세 진입
3. Yes 또는 No 선택
4. stake 입력
5. 저장
6. positions page 에 새 포지션 표시

### 시나리오 2 — 정산

1. 종료된 시장의 pending position 존재
2. 정산 호출
3. won/lost 반영
4. realized pnl 반영
5. leaderboard/profile 업데이트 확인

### 시나리오 3 — 언어 전환

1. 한국어에서 화면 확인
2. 영어로 전환
3. 주요 UI 문구/포맷 정상 여부 확인

## 7. 다음 단계

이 문서 다음으로 이어질 실제 구현 산출물:

- SQL migration 적용
- 타입 재생성
- API 회귀 테스트
- locale-aware formatter 리팩터
- onchain 전환 준비 문서 갱신
