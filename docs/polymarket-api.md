# Polymarket API 통합 문서

작성일: 2026-05-13  
기준 소스: Polymarket 공식 문서(`docs.polymarket.com`)와 현재 저장소 구현

이 문서는 두 목적을 같이 다룬다.

- Polymarket 공식 API 전체 구조를 한 번에 파악하기 위한 운영 문서
- `predixscore`가 현재 어떤 Polymarket 엔드포인트를 어떻게 쓰는지 정리한 내부 문서

공식 문서 원문:

- API 소개: https://docs.polymarket.com/api-reference/introduction
- 문서 인덱스: https://docs.polymarket.com/llms.txt
- 인증: https://docs.polymarket.com/api-reference/authentication
- Rate Limits: https://docs.polymarket.com/api-reference/rate-limits
- SDK: https://docs.polymarket.com/api-reference/clients-sdks
- WebSocket 개요: https://docs.polymarket.com/market-data/websocket/overview
- Quickstart: https://docs.polymarket.com/quickstart

## 1. API 계층 개요

Polymarket는 하나의 API가 아니라 역할이 다른 여러 API로 나뉜다.

| 계층 | Base URL | 용도 | 인증 |
|---|---|---|---|
| Gamma API | `https://gamma-api.polymarket.com` | 이벤트/마켓/태그/검색/댓글/스포츠 등 탐색용 메타데이터 | 불필요 |
| Data API | `https://data-api.polymarket.com` | 포지션, 활동, 거래, 리더보드, 분석 데이터 | 불필요 |
| CLOB API | `https://clob.polymarket.com` | 오더북, 가격, 스프레드, price history, 주문/취소/heartbeat | 읽기만 public, 거래는 인증 필요 |
| Bridge API | `https://bridge.polymarket.com` | 입출금용 브리지 프록시 | 엔드포인트별 상이 |
| Relayer API | 문서상 relayer 섹션 참고 | gasless transaction/nonce/wallet deploy 관련 | 엔드포인트별 상이 |
| WebSocket | `wss://ws-subscriptions-clob.polymarket.com/...` 등 | 실시간 오더북/가격/유저 이벤트 | 채널별 상이 |

핵심 분리 기준은 아래와 같다.

- 시장을 “찾는” 데는 보통 Gamma API를 쓴다.
- 유저 포지션/활동을 “조회”할 때는 Data API를 쓴다.
- 가격/호가/실제 주문 처리는 CLOB API를 쓴다.

## 2. 현재 저장소의 사용 범위

이 저장소는 현재 Polymarket를 `읽기 전용 데이터 소스`로 사용한다.

- 사용 중: `Gamma API`, `CLOB API`의 public read endpoint
- 미사용: `Data API`, `CLOB` 주문/취소/heartbeat, `Bridge`, `Relayer`, authenticated websocket
- 설치만 되어 있음: `@polymarket/clob-client-v2` (`package.json`)

현재 기준 외부 호출은 모두 [`src/lib/polymarket.ts`](../src/lib/polymarket.ts)에서 관리한다.

## 3. 인증 모델

공식 문서 기준:

- `Gamma API`와 `Data API`는 전부 public
- `CLOB API`도 read endpoint(`orderbook`, `prices`, `spreads` 등)는 public
- `CLOB`의 trading endpoint(`POST /order`, `DELETE /order`, `POST /orders`, `heartbeat` 등)는 인증 필요

Polymarket CLOB 인증은 2단계다.

### 3.1 L1 인증

- 지갑 private key로 EIP-712 메시지를 서명
- 용도: API credential 생성, 기존 credential derive, 로컬 주문 서명

### 3.2 L2 인증

- `apiKey`, `secret`, `passphrase` 기반 HMAC-SHA256
- 용도: 주문 조회/취소, allowance/balance 확인, signed order 제출

공식 문서는 authenticated CLOB 요청에 `POLY_*` L2 HTTP headers 5개가 필요하다고 명시한다. 실제 거래 연동은 가능하면 수동 header 조립보다 공식 SDK 사용이 안전하다.

### 3.3 새 API 사용자 관련 참고

공식 문서는 새 API 사용자는 deposit wallet 흐름을 쓰라고 안내한다. 향후 이 저장소가 실제 트레이딩까지 확장되면 아래 세 가지를 먼저 정해야 한다.

- 서명 주체: EOA / Safe / Proxy
- funder address 관리 방식
- deposit wallet/relayer를 사용할지 여부

## 4. SDK 및 네트워크 정보

공식 SDK:

- TypeScript: `@polymarket/clob-client-v2`
- Python: `py-clob-client-v2`
- Rust: `polymarket_client_sdk_v2`

공식 Quickstart 기준 기본값:

- Host: `https://clob.polymarket.com`
- Chain ID: `137` (`Polygon mainnet`)
- Signature type 예시: `0` = EOA

이 저장소도 이미 TypeScript SDK 의존성을 포함한다.

```json
"@polymarket/clob-client-v2": "^1.0.5"
```

## 5. Rate Limits

2026-05-13 기준 공식 문서의 핵심 제한:

### 5.1 공통

- 전체 일반 제한: `15,000 req / 10s`
- health check(`/ok`): `100 req / 10s`

### 5.2 Gamma API

- 일반: `4,000 req / 10s`
- `/events`: `500 req / 10s`
- `/markets`: `300 req / 10s`
- `/markets` + `/events` listing 합산: `900 req / 10s`
- `/comments`: `200 req / 10s`
- `/tags`: `200 req / 10s`
- `/public-search`: `350 req / 10s`

### 5.3 Data API

- 일반: `1,000 req / 10s`
- `/trades`: `200 req / 10s`
- `/positions`: `150 req / 10s`
- `/closed-positions`: `150 req / 10s`

### 5.4 CLOB API

- 일반: `9,000 req / 10s`
- `/book`: `1,500 req / 10s`
- `/books`: `500 req / 10s`
- `/price`: `1,500 req / 10s`
- `/prices`: `500 req / 10s`
- `/midpoint`: `1,500 req / 10s`
- `/midpoints`: `500 req / 10s`
- `/prices-history`: `1,000 req / 10s`

거래 엔드포인트는 burst/sustained limit가 별도로 있다.

- `POST /order`: `5,000 req / 10s`, `48,000 req / 10 min`
- `DELETE /order`: `5,000 req / 10s`, `48,000 req / 10 min`
- `POST /orders`: `1,500 req / 10s`, `21,000 req / 10 min`
- `DELETE /orders`: `1,000 req / 10s`, `15,000 req / 10 min`
- `DELETE /cancel-all`: `250 req / 10s`, `6,000 req / 10 min`
- `DELETE /cancel-market-orders`: `1,500 req / 10s`, `21,000 req / 10 min`

주의:

- 공식 문서는 초과 시 Cloudflare throttling으로 `즉시 reject`보다 `delay/queue`가 먼저 걸릴 수 있다고 설명한다.
- 이 저장소는 이미 Next fetch revalidate를 걸어 과도한 반복 호출을 일부 줄이고 있다.

## 6. WebSocket 개요

공식 WebSocket 채널:

- Market channel: `wss://ws-subscriptions-clob.polymarket.com/ws/market`
- User channel: `wss://ws-subscriptions-clob.polymarket.com/ws/user`
- Sports channel: `wss://sports-api.polymarket.com/ws`
- RTDS: `wss://ws-live-data.polymarket.com`

### 6.1 Market channel

- 인증 불필요
- 구독 단위: `asset_id` 배열
- 주요 이벤트: `book`, `price_change`, `tick_size_change`, `last_trade_price`, `best_bid_ask`, `new_market`, `market_resolved`

`best_bid_ask`, `new_market`, `market_resolved`는 `custom_feature_enabled: true`가 있어야 받는다.

### 6.2 User channel

- 인증 필요
- 구독 단위: `conditionId` 배열
- 주의: market channel은 `asset_id`, user channel은 `conditionId`를 받는다

### 6.3 Heartbeat

- market/user channel 모두 `10초마다 PING` 전송 권장
- 서버는 `PONG` 응답

현재 저장소는 WebSocket을 아직 사용하지 않고 polling 기반이다.

## 7. 공식 API 카탈로그

아래 목록은 2026-05-13 기준 공식 문서 목차를 그대로 정리한 것이다. 상세 request/response schema는 각 공식 문서 페이지를 본다.

### 7.1 Gamma API / 탐색 계층

#### Events

- `GET List events (keyset pagination)`
- `GET List events`
- `GET Get event by id`
- `GET Get event by slug`
- `GET Get event tags`

#### Markets

- `GET List markets (keyset pagination)`
- `GET List markets`
- `GET Get market by id`
- `GET Get market by slug`
- `GET Get market tags by id`
- `GET Get market by token`
- `GET Get top holders for markets`
- `GET Get open interest`
- `GET Get live volume for an event`

#### Search

- `GET Search markets, events, and profiles`

#### Tags

- `GET List tags`
- `GET Get tag by id`
- `GET Get tag by slug`
- `GET Get related tags (relationships) by tag id`
- `GET Get related tags (relationships) by tag slug`
- `GET Get tags related to a tag id`
- `GET Get tags related to a tag slug`

#### Series

- `GET List series`
- `GET Get series by id`

#### Comments

- `GET List comments`
- `GET Get comments by comment id`
- `GET Get comments by user address`

#### Sports

- `GET Get sports metadata information`
- `GET Get valid sports market types`
- `GET List teams`

### 7.2 Data API / 유저 데이터 계층

#### Profile / Positions / Activity

- `GET Get public profile by wallet address`
- `GET Get current positions for a user`
- `GET Get closed positions for a user`
- `GET Get user activity`
- `GET Get total value of a user's positions`
- `GET Get trades for a user or markets`
- `GET Get total markets a user has traded`
- `GET Get positions for a market`
- `GET Download an accounting snapshot (ZIP of CSVs)`

#### Leaderboard

- `GET Get trader leaderboard rankings`

#### Builders

- `GET Get aggregated builder leaderboard`
- `GET Get daily builder volume time-series`

### 7.3 CLOB API / 가격 및 거래 계층

#### Orderbook & Pricing

- `GET Get order book`
- `POST Get order books (request body)`
- `GET Get market price`
- `GET Get market prices (query parameters)`
- `POST Get market prices (request body)`
- `GET Get midpoint price`
- `GET Get midpoint prices (query parameters)`
- `POST Get midpoint prices (request body)`
- `GET Get spread`
- `POST Get spreads`
- `GET Get last trade price`
- `GET Get last trade prices (query parameters)`
- `POST Get last trade prices (request body)`
- `GET Get prices history`
- `POST Get batch prices history`
- `GET Get fee rate`
- `GET Get fee rate by path parameter`
- `GET Get tick size`
- `GET Get tick size by path parameter`
- `GET Get CLOB market info`
- `GET Get server time`

#### Orders

- `POST Post a new order`
- `DEL Cancel single order`
- `GET Get single order by ID`
- `POST Post multiple orders`
- `GET Get user orders`
- `DEL Cancel multiple orders`
- `DEL Cancel all orders`
- `DEL Cancel orders for a market`
- `GET Get order scoring status`
- `POST Send heartbeat`

#### Trades

- `GET Get trades`
- `GET Get builder trades`

#### CLOB Markets

- `GET Get simplified markets`
- `GET Get sampling markets`
- `GET Get sampling simplified markets`

#### Rebates

- `GET Get current rebated fees for a maker`

#### Rewards

- `GET Get current active rewards configurations`
- `GET Get raw rewards for a specific market`
- `GET Get multiple markets with rewards`
- `GET Get earnings for user by date`
- `GET Get total earnings for user by date`
- `GET Get reward percentages for user`
- `GET Get user earnings and markets configuration`

### 7.4 Bridge API

- `GET Get supported assets`
- `POST Create deposit addresses`
- `POST Get a quote`
- `GET Get transaction status`
- `POST Create withdrawal addresses`

### 7.5 Relayer API

- `POST Submit a transaction`
- `GET Get a transaction by ID`
- `GET Get recent transactions for a user`
- `GET Get current nonce for a user`
- `GET Get relayer address and nonce`
- `GET Check if a wallet is deployed`
- `GET Get all relayer API keys`

### 7.6 WebSocket

- `WSS Market Channel`
- `WSS User Channel`
- `WSS Sports Channel`

## 8. 이 저장소의 실제 호출 매핑

현재 Polymarket 연동 핵심 파일:

- [`src/lib/polymarket.ts`](../src/lib/polymarket.ts)
- [`src/types/polymarket.ts`](../src/types/polymarket.ts)
- [`src/app/api/polymarket/markets/route.ts`](../src/app/api/polymarket/markets/route.ts)
- [`src/app/api/polymarket/event/route.ts`](../src/app/api/polymarket/event/route.ts)
- [`src/app/api/polymarket/book/route.ts`](../src/app/api/polymarket/book/route.ts)
- [`src/app/api/polymarket/history/route.ts`](../src/app/api/polymarket/history/route.ts)

### 8.1 외부 엔드포인트별 사용처

| 내부 함수 | 외부 API | 용도 | 캐시 |
|---|---|---|---|
| `fetchEventsPage()` | `GET https://gamma-api.polymarket.com/events` | 홈/디렉토리용 이벤트 목록 | `revalidate=120` |
| `searchEvents()` | `GET https://gamma-api.polymarket.com/public-search` | 검색어 기반 이벤트 검색 | `revalidate=120` |
| `fetchDirectoryTags()` | `GET https://gamma-api.polymarket.com/tags` | 태그/카테고리 메타데이터 | `revalidate=120` |
| `fetchEventBySlug()` | `GET /events/slug/{slug}` | 이벤트 상세 조회 | `revalidate=120` |
| `fetchEventBySlug()` fallback | `GET /markets/slug/{slug}` 후 `GET /events/slug/{eventSlug}` | event slug가 아니라 market slug가 들어온 경우 보정 | `revalidate=120` |
| `fetchOrderBook()` | `GET https://clob.polymarket.com/book?token_id=...` | 선택 outcome의 오더북/호가 조회 | `revalidate=20` |
| `fetchPriceHistory()` | `GET https://clob.polymarket.com/prices-history?market=...` | 차트용 히스토리 가격 조회 | `revalidate=60` |

### 8.2 내부 API route 매핑

| 내부 route | 연결 함수 | 프론트 용도 |
|---|---|---|
| `/api/polymarket/markets` | `fetchMarketsDirectory()` | 목록/검색/태그 필터 |
| `/api/polymarket/event` | `fetchEventBySlug()` | 이벤트 상세 |
| `/api/polymarket/book` | `fetchOrderBook()` | orderbook panel |
| `/api/polymarket/history` | `fetchPriceHistory()` | price chart |

### 8.3 UI 사용처

- 홈: [`src/app/page.tsx`](../src/app/page.tsx) → `getHomeSnapshot()`
- 상세: [`src/app/event/[slug]/page.tsx`](../src/app/event/[slug]/page.tsx) → `fetchEventBySlug()`
- 상세 클라이언트: [`src/components/markets/MarketDetailClient.tsx`](../src/components/markets/MarketDetailClient.tsx)
- 상세 클라이언트 내부 호출: 오더북 `/api/polymarket/book`, 히스토리 `/api/polymarket/history`
- 디렉토리: [`src/components/markets/MarketsHome.tsx`](../src/components/markets/MarketsHome.tsx)
- 디렉토리 내부 호출: 목록 로딩 `/api/polymarket/markets`

## 9. 이 저장소의 데이터 정규화 방식

Polymarket 응답은 숫자와 배열이 문자열 JSON으로 들어오는 경우가 있어서 이 저장소는 자체 normalize 단계를 둔다.

### 9.1 공통 파서

- `toArray()`: 배열 그대로 사용하고, 문자열이면 `JSON.parse()`를 시도하며, 실패 시 빈 배열 반환
- `toNumber()`: number/string 모두 허용하고 파싱 실패 시 `0`
- `toText()`: string만 허용

### 9.2 `MarketSnapshot`으로 정규화

앱에서 주로 쓰는 필드:

- 식별자: `id`, `slug`, `eventSlug`, `marketSlug`
- 거래/가격: `clobTokenIds`, `outcomes`, `outcomePrices`, `yesPrice`, `noPrice`, `probability`, `minimumTickSize`, `negRisk`
- 메타: `question`, `subtitle`, `description`, `category`, `image`, `icon`
- 상태/규모: `active`, `closed`, `featured`, `volume`, `volume24h`, `volume1wk`, `volume1mo`, `liquidity`, `openInterest`, `competitive`, `endDate`, `creationDate`, `isNew`

정규화 규칙의 핵심:

- `outcomes`와 `outcomePrices`는 문자열 JSON이어도 파싱
- `clobTokenIds[0]`을 Yes, `[1]`을 No로 취급
- `question`, `title`, `marketQuestion` 중 존재하는 값을 질문으로 사용
- `description`이 없으면 `rules`나 기본 문구로 대체
- `minimum_tick_size`와 `minimumTickSize` 둘 다 허용
- `neg_risk`와 `negRisk` 둘 다 허용

### 9.3 Event card 구성 방식

이벤트 목록 카드(`normalizeEventCard`)는 event 안의 하위 markets 중 `liquidity`가 가장 큰 market 하나를 대표 market으로 선택한다.

의미:

- 이벤트 목록 화면은 엄밀히 “market 목록”이 아니라 “event 대표 카드 목록”이다
- 카드의 확률/가격/이미지는 대표 market 기준으로 보인다

### 9.4 이벤트 상세 slug 보정

`fetchEventBySlug(slug)`는 먼저 event slug로 조회하고, 실패하면 market slug로 한 번 더 조회한다.

이유:

- URL에 event slug 대신 market slug가 들어오는 경우를 흡수하기 위함

## 10. 현재 쿼리 전략

### 10.1 홈/디렉토리

`fetchMarketsDirectory()`는 두 경로로 동작한다.

- 검색어 없음:
  `GET /events`에 `active=true`, `closed=false`, `limit`, `offset`, 정렬별 `order`, `ascending`을 붙여 조회
- 검색어 있음:
  `GET /public-search`에 `q`, `events_status=active`, `limit_per_type`, `page`, `search_tags=false`, `search_profiles=false`, `optimized=true`, 필요 시 `events_tag`를 붙여 조회

정렬 매핑:

- `trending` → `order=volume_24hr&ascending=false`
- `liquidity` → `order=liquidity&ascending=false`
- `ending` → `order=end_date&ascending=true`
- `new` → `order=start_date&ascending=false`

### 10.2 오더북

현재는 단일 token 기준으로만 조회한다.

- 엔드포인트: `GET /book`
- query: `token_id`
- 응답 활용 필드: `market`, `asset_id`, `bids`, `asks`, `min_order_size`, `tick_size`, `neg_risk`, `last_trade_price`, `timestamp`

### 10.3 히스토리 차트

현재는 CLOB의 `prices-history`를 그대로 사용한다.

- query: `market`(token id), `interval`, `fidelity`
- 응답: `history[]`, 각 원소는 `t`(timestamp), `p`(price)

## 11. 자주 헷갈리는 식별자

Polymarket는 ID 종류가 여러 개라서 혼동이 많다.

| 이름 | 의미 | 현재 저장소에서의 쓰임 |
|---|---|---|
| `event slug` | 이벤트 URL 식별자 | 상세 페이지 진입 |
| `market slug` | 개별 마켓 slug | 상세 초기 마켓 선택 |
| `conditionId` | 시장(condition) 식별자 | user websocket, 일부 market 식별 |
| `token_id` / `asset_id` | Yes/No outcome token 식별자 | CLOB `book`, `prices-history`, market websocket |
| `clobTokenIds` | outcome token id 배열 | `Yes`, `No` 가격/히스토리 조회 |

실무적으로 기억할 점:

- `event` 1개 안에 `market` 여러 개가 있을 수 있다
- `market` 1개는 보통 2개의 outcome token(`Yes`, `No`)을 가진다
- market websocket은 `asset_id`
- user websocket은 `conditionId`
- `prices-history`의 `market` 파라미터는 실제로 token id를 넣고 있다

## 12. 예시 호출

### 12.1 활성 이벤트 목록

```bash
curl "https://gamma-api.polymarket.com/events?active=true&closed=false&limit=60&offset=0&order=volume_24hr&ascending=false"
```

### 12.2 이벤트 상세

```bash
curl "https://gamma-api.polymarket.com/events/slug/<event-slug>"
```

### 12.3 검색

```bash
curl "https://gamma-api.polymarket.com/public-search?q=trump&events_status=active&limit_per_type=20&page=1&search_tags=false&search_profiles=false&optimized=true"
```

### 12.4 태그 목록

```bash
curl "https://gamma-api.polymarket.com/tags"
```

### 12.5 오더북

```bash
curl "https://clob.polymarket.com/book?token_id=<asset-id>"
```

### 12.6 가격 히스토리

```bash
curl "https://clob.polymarket.com/prices-history?market=<asset-id>&interval=1d&fidelity=15"
```

### 12.7 향후 트레이딩 연동용 TypeScript SDK 예시

```ts
import { ClobClient } from "@polymarket/clob-client-v2";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const HOST = "https://clob.polymarket.com";
const CHAIN_ID = 137;

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const signer = createWalletClient({ account, transport: http() });

const tempClient = new ClobClient({ host: HOST, chain: CHAIN_ID, signer });
const creds = await tempClient.createOrDeriveApiKey();

const client = new ClobClient({
  host: HOST,
  chain: CHAIN_ID,
  signer,
  creds,
  signatureType: 0,
  funderAddress: account.address,
});
```

## 13. 이 저장소에 바로 적용 가능한 확장 포인트

### 13.1 Data API 연동

아직 안 붙어 있지만 다음 기능은 Data API로 바로 확장 가능하다.

- 실제 유저 포지션 불러오기
- closed positions / realized pnl
- trader leaderboard
- user activity feed

### 13.2 실시간화

현재 상세 화면은 polling이다. 아래는 websocket 전환 후보.

- market detail orderbook → market websocket
- 차트 실시간 갱신 → `price_change` / `last_trade_price`
- resolution 반영 → `market_resolved`

### 13.3 실제 주문 연동

현재 베팅 모달은 paper trading 용도다. 실거래로 바꾸려면 최소 아래가 필요하다.

- private key / signer 관리
- L1 → L2 credential 생성 및 저장
- funder address/deposit wallet 설계
- geographic restriction 검토
- order signing / order posting / cancel / allowance 관리

## 14. 주의사항

- Polymarket 응답은 필드명이 `camelCase`와 `snake_case`가 섞여 있다.
- 숫자 필드가 문자열로 오는 경우가 많다.
- 배열 필드(`outcomes`, `outcomePrices`, `clobTokenIds`)가 문자열 JSON인 경우가 있다.
- `prices-history`는 path 이름만 보면 market history 같지만 실제 사용은 outcome token 기준이다.
- 이벤트 상세의 `endDate`가 비어 있는 multi-market event가 존재한다.
- 트레이딩은 지역 제한과 지갑/deposit wallet 구조를 반드시 확인해야 한다.

## 15. 이 문서와 코드가 일치하는지 빠르게 점검하는 체크리스트

- `src/lib/polymarket.ts`의 base URL이 여전히 `Gamma + CLOB`만 사용하는가
- `/api/polymarket/*` route가 여전히 4개(`markets`, `event`, `book`, `history`)인가
- `package.json`에 `@polymarket/clob-client-v2`가 유지되는가
- 공식 docs 목차에 새로운 API 섹션이 추가되지 않았는가
- 공식 rate limit 값이 바뀌지 않았는가

## 16. 공식 참고 링크

- Introduction: https://docs.polymarket.com/api-reference/introduction
- Authentication: https://docs.polymarket.com/api-reference/authentication
- Rate Limits: https://docs.polymarket.com/api-reference/rate-limits
- Clients & SDKs: https://docs.polymarket.com/api-reference/clients-sdks
- Quickstart: https://docs.polymarket.com/quickstart
- Events list: https://docs.polymarket.com/api-reference/events/list-events
- Event by slug: https://docs.polymarket.com/api-reference/events/get-event-by-slug
- Markets list: https://docs.polymarket.com/api-reference/markets/list-markets
- Search: https://docs.polymarket.com/api-reference/search/search-markets-events-and-profiles
- Tags: https://docs.polymarket.com/api-reference/tags/list-tags
- Order book: https://docs.polymarket.com/api-reference/market-data/get-order-book
- Prices history: https://docs.polymarket.com/api-reference/markets/get-prices-history
- Current positions: https://docs.polymarket.com/api-reference/core/get-current-positions-for-a-user
- WebSocket overview: https://docs.polymarket.com/market-data/websocket/overview
