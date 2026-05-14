# PredixScore 모의 투자 기능 명세서

> 마지막 갱신: 2026-05-13

## 1. 목적

이 문서는 PredixScore의 `모의 투자 / 모의 예측` 기능을 구현하기 위한 실무 명세서다.

이 문서가 다루는 범위:

- 제품 목표
- 사용자 플로우
- 기능 스펙
- 데이터 모델
- API 계약
- UI 요구사항
- 상태 전이
- i18n 요구사항
- 개발 체크리스트

## 2. 제품 목표

모의 투자 기능의 목적은 아래와 같다.

- 사용자가 Polymarket 시장 데이터를 보고 자기 판단으로 예측한다
- 실제 자금은 사용하지 않는다
- 사용자는 가상의 stake 와 entry price 로 포지션을 만든다
- 시장 진행 중에는 실시간 PnL 을 본다
- 시장 종료 후 결과를 정산한다
- 장기적으로는 이 흐름을 onchain commit-reveal 구조로 전환한다

즉 현재 단계의 핵심은:

`Polymarket 데이터를 기반으로 현실감 있는 paper prediction experience를 제공하는 것`

## 3. 범위

### 3.1 현재 범위

- 시장 읽기
- 모의 포지션 생성
- 포지션 목록 조회
- 현재가 기반 미실현 PnL 계산
- 종료 시장 정산
- 포트폴리오 요약

### 3.2 차기 범위

- wallet 기반 identity
- onchain commit
- reveal
- score / leaderboard

### 3.3 비범위

- 실거래 체결
- house account 주문
- 사용자 자금 custody
- Polymarket 주문 제출

## 4. 용어 정의

- `Event`: Polymarket 이벤트 단위
- `Market`: 이벤트 안의 개별 마켓
- `Outcome`: 예측 결과 선택지
- `Paper Position`: 사용자의 모의 포지션
- `Entry Price`: 포지션 생성 시점의 확률/가격
- `Stake Amount`: 사용자가 가상으로 배팅한 금액
- `Shares`: `stakeAmount / entryPrice`
- `Current Value`: `currentPrice * shares`
- `PnL`: `currentValue - stakeAmount`

## 5. 사용자 스토리

### 5.1 시장 탐색

- 사용자는 홈에서 Polymarket 이벤트 목록을 본다
- 사용자는 태그/검색/정렬로 시장을 찾는다
- 사용자는 이벤트 상세에서 결과, 가격, 오더북, 히스토리를 본다

### 5.2 포지션 생성

- 사용자는 특정 결과를 선택한다
- 사용자는 stake 금액을 입력한다
- 사용자는 현재 확률을 기준으로 포지션을 저장한다
- 저장 직후 자신의 포트폴리오에 반영된 것을 본다

### 5.3 포트폴리오 확인

- 사용자는 자신의 전체 스테이크, 현재 가치, 손익을 본다
- 사용자는 개별 포지션의 상태와 PnL을 본다
- 사용자는 아직 미정산 포지션과 정산된 포지션을 구분해서 본다

### 5.4 정산

- 사용자는 시장 종료 후 결과가 반영되면 승패를 확인한다
- 시스템은 실현 손익을 계산한다
- 사용자는 이후 리더보드/프로필에서 누적 기록을 본다

## 6. 기능 명세

### 6.1 시장 목록

요구사항:

- Polymarket 이벤트 목록을 홈에서 보여준다
- 카테고리 / 태그 / 검색 / 정렬을 지원한다
- active market 위주로 노출한다

입력:

- `q`
- `tag`
- `tagSlug`
- `sort`
- `limit`
- `offset`

출력:

- `markets[]`
- `total`
- `hasMore`

현재 코드:

- [`src/app/api/polymarket/markets/route.ts`](../src/app/api/polymarket/markets/route.ts)
- [`src/lib/polymarket.ts`](../src/lib/polymarket.ts)

### 6.2 이벤트 상세

요구사항:

- event metadata 표시
- 하위 markets 표시
- 결과별 확률 표시
- 오더북 / 가격 히스토리 표시

현재 코드:

- [`src/app/api/polymarket/event/route.ts`](../src/app/api/polymarket/event/route.ts)
- [`src/components/markets/MarketDetailClient.tsx`](../src/components/markets/MarketDetailClient.tsx)

### 6.2.1 Polymarket API 사용 정책

현재 단계에서 Polymarket는 `읽기 전용 시장 데이터 소스`로만 사용한다.

API 계층별 역할:

| API | 사용 여부 | PredixScore 용도 |
|---|---:|---|
| Gamma API | 사용 | 이벤트/마켓/태그/검색/메타데이터 |
| CLOB API public read | 사용 | 오더북, 가격, 가격 히스토리 |
| Data API | V1 미사용 | Polymarket 유저 포지션/활동 분석이 필요할 때 검토 |
| CLOB trading API | 미사용 | 실거래 주문/취소는 비범위 |
| Bridge / Relayer API | 미사용 | 입출금/Polymarket 거래 UX는 비범위 |
| WebSocket | V1 미사용 | 실시간 가격감 개선이 필요할 때 V2 후보 |

V1 구현 원칙:

- `Gamma API`의 event/market 데이터를 탐색과 상세 화면의 기준 데이터로 사용한다.
- `CLOB API`의 public endpoint는 오더북/가격 히스토리 표시용으로만 사용한다.
- Polymarket 인증이 필요한 API는 호출하지 않는다.
- Polymarket 주문, 취소, 입출금, allowance, balance 조회는 구현하지 않는다.
- 우리 앱의 position은 Polymarket position이 아니라 `paper_positions`에 저장되는 자체 모의 포지션이다.

### 6.2.2 가격 산정 정책

가격은 paper position의 `entryPrice`, `currentPrice`, PnL 계산에 직접 영향을 주므로 아래 우선순위를 따른다.

Entry price:

1. 사용자가 outcome을 선택한 시점의 normalized market `outcomePrices[outcomeIndex]`
2. 값이 없거나 유효하지 않으면 CLOB midpoint/price 조회를 검토
3. 그래도 없으면 해당 outcome은 예측 CTA를 비활성화

Current price:

1. position의 `tokenId`가 현재 event market의 `clobTokenIds`와 매칭되면 같은 index의 `outcomePrices` 사용
2. `outcomeIndex` 매칭이 실패하면 `tokenId` 기준으로 fallback index를 찾는다
3. 가격이 없으면 `currentPrice`, `currentValue`, `pnl`은 `null`로 둔다

Polymarket 표시 가격과의 차이:

- Polymarket UI는 일반적으로 midpoint를 확률처럼 표시하고, spread가 넓으면 last traded price를 사용할 수 있다.
- 현재 V1은 Gamma normalized `outcomePrices`를 우선 사용한다.
- 따라서 V1의 가격은 Polymarket UI와 완전히 동일한 tick-by-tick 표시가 아니라 `paper trading 계산용 기준 가격`이다.
- V2에서 CLOB midpoint, spread, last trade fallback을 명시적으로 합성하는 price resolver를 도입한다.

### 6.3 모의 포지션 생성

입력:

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

처리 규칙:

- `entryPrice > 0`
- `entryPrice <= 1`
- `stakeAmount > 0`
- `outcomeIndex >= 0`
- `shares = stakeAmount / entryPrice`
- 소수점은 현재 기준 `toFixed(6)` 사용

출력:

- 생성된 position 1건

현재 코드:

- [`src/app/api/paper/positions/route.ts`](../src/app/api/paper/positions/route.ts)
- [`src/components/markets/BetModal.tsx`](../src/components/markets/BetModal.tsx)

### 6.4 포지션 목록 조회

요구사항:

- guest session 또는 user 기준으로 포지션 목록 반환
- 상태 필터 지원
- 현재가 / 현재가치 / 미실현 손익 계산

출력:

```ts
{
  positions: PaperPositionSummary[];
  totals: {
    staked: number;
    currentValue: number;
    pnl: number;
    pnlPercent: number;
  };
  identity: {
    userId: string | null;
    guestSessionId: string;
  };
}
```

현재 코드:

- [`src/app/api/paper/positions/route.ts`](../src/app/api/paper/positions/route.ts)
- [`src/lib/paper.ts`](../src/lib/paper.ts)

### 6.5 정산

요구사항:

- 종료된 시장을 찾는다
- Polymarket 결과를 읽는다
- winning outcome을 계산한다
- 개별 포지션을 `won / lost / voided` 중 하나로 정산한다
- 실현 손익을 기록한다

현재 코드:

- [`src/app/api/paper/settle/route.ts`](../src/app/api/paper/settle/route.ts)
- [`src/lib/polymarket-resolution.ts`](../src/lib/polymarket-resolution.ts)

### 6.5.1 Polymarket 정산 감지 정책

V1 정산은 보수적으로 처리한다.

정산 가능한 market 조건:

- `market.closed === true`
- `outcomePrices`가 존재한다
- winning outcome price가 `0.99` 이상이다
- losing outcome price가 `0.01` 이하이다
- winning index와 losing index가 다르다

정산하지 않는 케이스:

- market이 아직 closed가 아니다
- outcome price가 모호하다
- 결과가 void/cancel/ambiguous일 가능성이 있는데 winning outcome을 확정할 수 없다
- multi-outcome 결과에서 단일 winning index를 안정적으로 계산할 수 없다

처리 정책:

- 확정 가능한 binary market만 `won / lost`로 정산한다.
- 모호한 market은 pending 유지한다.
- `voided`는 DB 상태로 준비하지만, V1 자동 정산에서는 적극 사용하지 않는다.
- void/cancel 정책은 별도 resolution source 확인 로직이 생긴 뒤 활성화한다.

## 7. 시장 커버 전략

모의 투자 기능은 장기적으로 Polymarket의 폭넓은 시장 범위를 수용해야 한다.

원칙:

- 데이터 모델은 처음부터 범용적으로 설계
- UI 지원 범위는 단계 확장

### 7.1 지원해야 하는 데이터 구조

- binary market
- multi-market event
- multi-outcome market
- 카테고리/태그 기반 필터링

### 7.1.1 V1 지원 판정

V1에서 예측 CTA를 활성화할 수 있는 market:

- `clobTokenIds.length >= 2`
- `outcomes.length >= 2`
- 선택 outcome의 `tokenId`가 존재한다
- 선택 outcome의 `entryPrice`가 `0 < price <= 1` 범위다
- market이 active이고 closed가 아니다

V1에서 읽기만 허용할 market:

- token id가 없거나 outcome/token 매칭이 불완전한 market
- 가격이 없거나 0 이하인 outcome
- 이미 closed된 market
- event는 표시 가능하지만 하위 market 구조가 betting ticket과 맞지 않는 경우

V1에서 명시적으로 제한할 것:

- Polymarket 실거래 가능 여부(`enableOrderBook`)를 paper trading 가능 여부와 동일하게 취급하지 않는다.
- 단, CLOB token id가 없으면 가격/히스토리/오더북 연동이 불안정하므로 예측 저장은 막는다.
- multi-market event는 event 단위로 보여주되, position은 반드시 특정 `marketSlug + tokenId + outcomeIndex`에 묶는다.

### 7.2 제품 단계별 범위

- `V1`
  - 전체 카테고리 읽기
  - binary market 중심 모의 투자
  - unsupported market은 read-only 처리
  - 가격은 Gamma normalized outcome price 중심
- `V2`
  - multi-market event 정교화
  - multi-outcome 지원
  - CLOB midpoint / spread / last trade 기반 price resolver
  - WebSocket 기반 가격 업데이트 검토
- `V3`
  - 카테고리별 점수/리더보드
  - 시장 타입별 성과 분리

### 7.3 미지원 시장 처리

- 읽기는 허용
- 예측 UX는 제한 가능
- 필요 시 `read only` 또는 `coming soon` 처리
- 제한 사유는 UI에서 짧게 표시한다
- 저장 API에서도 같은 validation을 반복해 클라이언트 우회를 방지한다

## 8. 포지션 상태 모델

### 8.1 사용자 관점 상태

- `pending`
- `won`
- `lost`
- `voided`

### 8.2 DB 관점 상태

현재/권장 구분:

- 내부 raw status: `open`, `closed`, `settled`
- 사용자 노출 status: `pending`, `won`, `lost`, `voided`

### 8.3 상태 전이

```text
create -> pending
pending -> won
pending -> lost
pending -> voided
```

향후 onchain 전환 시:

```text
pending_commit -> committed -> reveal_available -> revealed -> settled
```

## 9. 계산 규칙

### 9.1 Shares

```text
shares = stakeAmount / entryPrice
```

### 9.2 현재 가치

```text
currentValue = currentPrice * shares
```

### 9.3 미실현 손익

```text
pnlAmount = currentValue - stakeAmount
pnlPercent = pnlAmount / stakeAmount
```

### 9.4 정산 후 손익

- 적중: `currentPrice = 1`
- 실패: `currentPrice = 0`
- 무효: 별도 정책 정의 필요

현재 구현상 적중/실패는 `currentPrice`를 각각 `1 / 0`으로 간주한다.

## 10. Supabase 데이터 모델

### 10.1 POC 테이블

현재 문서 기준 핵심 테이블:

- `paper_positions`

필수 필드:

- `id`
- `guest_session_id`
- `user_id`
- `event_slug`
- `event_title`
- `market_slug`
- `market_question`
- `token_id`
- `outcome_index`
- `outcome_label`
- `entry_price`
- `stake_amount`
- `shares`
- `status`
- `created_at`
- `updated_at`

정산 확장 필드:

- `status_resolved`
- `resolved_outcome_index`
- `realized_pnl`
- `settled_at`

### 10.2 인덱스

- `(guest_session_id, created_at desc)`
- `(user_id, created_at desc)`
- `(event_slug)`
- `(market_slug)`
- `(token_id)`
- `(status)`

### 10.3 권한 모델

- RPC 기반 접근
- `security definer`
- `anon`, `authenticated` 모두 필요한 범위만 실행 허용

## 11. API 명세

### 11.1 `GET /api/paper/positions`

역할:

- 현재 사용자의 모의 포지션 조회

Query:

- `status?`

응답:

- positions
- totals
- identity

오류:

- `502` 로드 실패

### 11.2 `POST /api/paper/positions`

역할:

- 새 모의 포지션 생성

검증:

- 필수 입력 존재 여부
- `entryPrice`, `stakeAmount` 유효성
- `outcomeIndex` 정수 여부
- 로그인 여부

응답:

- `201 { position }`

오류:

- `400` 잘못된 payload
- `401` 로그인 필요
- `502` 저장 실패

### 11.3 `POST /api/paper/settle`

역할:

- 종료 시장 정산 트리거

요구사항:

- pending 포지션 기준으로 대상 이벤트 수집
- Polymarket 결과와 매칭
- DB 정산 RPC 호출

### 11.4 `GET /api/paper/stats`

역할:

- 요약 통계 조회

## 12. UI 명세

### 12.1 홈

필수 요소:

- 시장 목록
- 태그 필터
- 검색
- 정렬
- 포트폴리오 미리보기

### 12.2 상세 페이지

필수 요소:

- 이벤트 설명
- 결과 목록
- 예측 버튼
- 오더북
- 가격 히스토리
- 댓글

### 12.3 Bet Modal

필수 요소:

- Yes/No 또는 outcome 선택
- stake 입력
- 확률 표시
- shares 계산
- 예상 payout / profit 표시
- 저장 CTA

필수 검증:

- stake 0 금지
- 잔액 부족 처리
- 미인증 유저 처리

### 12.4 포지션 페이지

필수 요소:

- 전체 / pending / won / lost 탭
- 포지션 표
- 총 스테이크
- 현재 가치
- 손익
- 정산 버튼

## 13. i18n 명세

모의 투자 기능은 처음부터 언어팩을 지원해야 한다.

현재 기반:

- [`messages/ko.json`](../messages/ko.json)
- [`messages/en.json`](../messages/en.json)

번역 대상:

- 시장 탐색 UI
- BetModal 문구
- 포지션 상태
- 손익 용어
- 정산 버튼
- 저장 성공/실패 토스트
- 인증 안내
- empty / loading / error 상태

원문 유지 대상:

- Polymarket 시장 제목
- Polymarket 이벤트 설명
- wallet address
- tx hash

추가 요구사항:

- 숫자 / 퍼센트 / 통화 / 날짜 포맷 locale 대응
- `src/lib/format.ts` 의 `en-US` 하드코딩 제거 필요

## 14. 비기능 요구사항

### 14.1 성능

- 포지션 목록은 즉시 렌더링 가능해야 함
- 시장 목록 pagination 지원
- 이벤트 상세의 오더북/히스토리 호출은 적절한 캐시 사용

### 14.2 안정성

- Polymarket 응답 실패 시 graceful fallback
- 정산 실패 시 재시도 가능
- 잘못된 resolution 데이터 방어 필요

### 14.3 보안

- guest cookie 는 httpOnly
- 인증 사용 시 user 기반 접근 제어
- RPC 는 필요한 권한만 노출

## 15. 테스트 명세

### 15.1 API 테스트

- position 생성 성공
- 잘못된 payload 거절
- 미로그인 저장 거절
- position 목록 조회
- status 필터 조회

### 15.2 계산 테스트

- shares 계산
- 미실현 PnL 계산
- 적중/실패 시 정산 계산
- tokenId 와 currentPrice 매칭

### 15.3 정산 테스트

- 종료 이벤트 정산 성공
- closed + outcomePrices = `[1,0]`
- closed + outcomePrices = `[0,1]`
- 정산 불가능 시장 무시

### 15.4 UI 테스트

- BetModal 입력 검증
- 저장 후 포트폴리오 반영
- positions 탭 동작
- empty / loading / error 상태

## 16. 개발 체크리스트

### 16.1 DB

- `paper_positions` 테이블 생성
- `touch_updated_at()` 생성
- `create_paper_position` RPC 생성
- `list_paper_positions` RPC 생성
- `settle_market` 또는 동등 정산 RPC 검증
- 타입 재생성

### 16.2 API

- `/api/paper/positions` GET/POST 검증
- `/api/paper/settle` 정산 플로우 검증
- `/api/paper/stats` 검증
- 에러 메시지 정리

### 16.3 프론트

- BetModal 검증 UX 보강
- Portfolio preview / positions page 연결 검증
- 미지원 시장 타입 처리
- 모바일 반응형 점검

### 16.4 i18n

- paper trading 관련 문구 키 점검
- 신규 문구 ko/en 추가
- locale-aware formatter 도입

### 16.5 정산

- Polymarket resolution 추출 로직 검증
- resolved state 반영
- realized pnl 반영

### 16.6 분석/운영

- position 생성 이벤트 로깅
- 정산 성공/실패 로깅
- API 오류 추적

## 17. 다음 단계

모의 투자 기능의 현실적인 개발 순서는 아래다.

1. Supabase `paper_positions`와 RPC 완성
2. 현재 POC 저장/조회/정산 플로우 안정화
3. 포지션 UI와 i18n 마감
4. 리더보드/프로필용 집계 구조 추가
5. 이후 onchain commit-reveal 구조로 전환

## 18. 관련 파일

- [`src/app/api/paper/positions/route.ts`](../src/app/api/paper/positions/route.ts)
- [`src/app/api/paper/settle/route.ts`](../src/app/api/paper/settle/route.ts)
- [`src/app/api/paper/stats/route.ts`](../src/app/api/paper/stats/route.ts)
- [`src/lib/paper.ts`](../src/lib/paper.ts)
- [`src/lib/polymarket.ts`](../src/lib/polymarket.ts)
- [`src/lib/polymarket-resolution.ts`](../src/lib/polymarket-resolution.ts)
- [`src/components/markets/BetModal.tsx`](../src/components/markets/BetModal.tsx)
- [`src/components/markets/MarketDetailClient.tsx`](../src/components/markets/MarketDetailClient.tsx)
- [`src/components/portfolio/PositionsList.tsx`](../src/components/portfolio/PositionsList.tsx)
- [`docs/paper-trading-handoff.md`](./paper-trading-handoff.md)
- [`docs/supabase-blockchain-spec.md`](./supabase-blockchain-spec.md)
