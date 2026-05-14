# PredixScore Supabase + Blockchain 통합 명세서

> 마지막 갱신: 2026-05-13

## 1. 문서 목적

이 문서는 PredixScore를 `Supabase + Blockchain` 구조로 구현할 때 필요한 기준 문서다.

한 문서 안에 아래를 모두 포함한다.

- 제품 정의
- 시스템 아키텍처
- 역할 분리
- 기능 명세
- 데이터 모델
- API / onchain 흐름
- 보안 원칙
- 운영 원칙
- 단계별 로드맵

## 2. 제품 정의

PredixScore는 `Polymarket 시장 데이터`를 가져와 사용자에게 시장을 보여주고, 사용자는 그 데이터를 참고해 `모의 예측`을 남긴다.

다만 PredixScore의 핵심은 일반적인 paper trading 앱이 아니다.

- Polymarket는 `시장 데이터 소스`
- PredixScore는 `예측 기록 검증 시스템`
- 예측 평문은 `서버가 모르는 구조`
- 사용자는 시장 종료 전 `commit`
- 시장 종료 후 `reveal`
- 결과적으로 `검증 가능한 실력 기록(track record)`을 쌓음

즉 이 제품의 본질은 아래 문장으로 정리된다.

`Polymarket 시장을 기반으로, 서버가 내용을 알 수 없는 private prediction을 onchain commit-reveal로 기록하고, 이후 검증 가능한 score와 reputation으로 전환하는 시스템`

## 3. 핵심 원칙

### 3.1 역할 분리

- `Polymarket`
  - 공개 시장 데이터 제공
  - 이벤트, 마켓, 가격, 오더북, 히스토리, resolution source
- `Blockchain`
  - commit / reveal 의 진실 원장
  - 위변조 불가능한 기록
  - 검증 가능한 prediction lifecycle
- `Supabase`
  - 앱 백엔드
  - 공개 메타데이터 저장
  - ciphertext 저장
  - 인덱싱 결과 / 리더보드 / 프로필 / 댓글 / 운영성 기능 제공

### 3.2 서버 블라인드 원칙

최종 구조에서는 PredixScore 서버가 아래를 알면 안 된다.

- reveal 전 예측 방향
- reveal 전 실제 stake
- reveal 전 entry price 원문
- reveal 전 salt
- 복호화 키

서버가 알아도 되는 것은 아래다.

- wallet address
- commit id
- commit tx hash
- reveal tx hash
- ciphertext
- marketRef
- revealAfter
- status
- 공개 가능한 통계와 캐시

### 3.3 실거래 비목표

현재와 중기 계획 기준으로 PredixScore는 아래를 하지 않는다.

- 실거래 체결
- house account 주문
- 사용자 자금 수탁
- 지갑 내 자산 이동 중개

## 4. 현재 상태와 목표 상태

### 4.1 현재 상태

현재 앱은 `POC` 단계다.

- Polymarket 읽기 연동 완료
- 시장 목록 / 이벤트 상세 / 오더북 / 히스토리 조회 가능
- 서버 기반 paper position 저장 흐름 존재
- Supabase 기반 API/RPC 구조를 전제로 일부 코드가 작성됨
- 컨트랙트 초안과 Foundry 테스트 존재

즉 현재는 `off-chain paper trading POC`다.

### 4.2 목표 상태

최종 목표는 아래 구조다.

1. 사용자가 시장을 본다
2. 사용자가 예측을 만든다
3. 클라이언트가 plaintext를 암호화한다
4. 클라이언트가 hash를 계산한다
5. onchain `commit tx`를 보낸다
6. Supabase에는 `ciphertext + tx metadata`만 저장한다
7. 시장 종료 후 사용자가 `reveal tx`를 보낸다
8. Supabase가 onchain event + Polymarket resolution을 읽어 score를 계산한다

즉 최종 구조는 `server-stored paper position`이 아니라 `server-blind indexed prediction system`이다.

## 5. 시스템 구성

### 5.1 프론트엔드

- Next.js App Router
- React UI
- wallet connect / tx signing
- client-side encryption
- Polymarket 데이터 표시
- commit / reveal UX

### 5.2 Supabase

- Postgres
- Auth 또는 wallet-linked identity layer
- RLS
- RPC / Edge Function / Cron
- 공개 메타데이터 저장
- ciphertext 및 인덱싱 결과 저장

### 5.3 Blockchain

- EVM 계열 체인 우선
- `PredixScoreRegistry` 컨트랙트 배포
- commit / reveal 상태 저장
- event log emit

### 5.4 Polymarket

- Gamma API
- CLOB API
- 향후 필요 시 resolution source 보강

## 6. 기능 명세

### 6.1 시장 탐색

사용자는 우리 사이트에서 Polymarket처럼 시장을 탐색할 수 있어야 한다.

포함 기능:

- 홈 시장 목록
- 이벤트 상세
- outcome 목록
- 오더북
- 가격 히스토리
- 카테고리 / 태그
- 검색

데이터 소스:

- Polymarket Gamma API
- Polymarket CLOB API

비고:

- 이 단계는 읽기 전용
- 온체인과 직접 관련 없음

### 6.2 모의 예측 작성

사용자는 시장을 보고 자기 판단으로 예측을 작성할 수 있어야 한다.

입력 요소:

- eventSlug
- marketSlug
- outcomeIndex
- stakeAmount
- entryPrice
- revealAfter

정책:

- 시장 종료 전까지만 commit 허용
- outcome 은 최소 `Yes / No`를 지원
- 향후 multi-outcome 확장 가능

### 6.3 Commit

사용자가 예측을 저장하면 실제로는 onchain `commit`이 발생해야 한다.

동작:

1. 클라이언트에서 prediction plaintext 생성
2. salt 생성
3. plaintext 암호화
4. `marketRef` 계산
5. `hash` 계산
6. wallet signing
7. `commit(hash, marketRef, revealAfter)` tx 전송
8. tx 성공 후 Supabase에 ciphertext와 메타 저장

결과:

- 사용자는 “예측 저장됨”을 보지만
- 서버는 내용을 모른다

### 6.4 Reveal

시장이 종료되면 사용자는 예측을 reveal 할 수 있어야 한다.

동작:

1. 앱이 reveal 가능한 commit 목록 조회
2. 클라이언트가 ciphertext를 복호화
3. `reveal(id, outcomeIndex, stakeAmount, entryPrice, salt)` tx 전송
4. 컨트랙트가 기존 commit hash와 대조
5. 성공 시 예측 내용이 검증된 것으로 간주

예외:

- salt 분실
- ciphertext 손상
- 잘못된 payload
- 조기 reveal 시도

### 6.5 Resolution Sync

시장이 종료되고 reveal 이 끝나면, PredixScore는 Polymarket 결과와 매칭해 정답을 판정해야 한다.

동작:

- eventSlug / marketSlug 기준 resolution 확인
- winning outcome 계산
- reveal 결과와 매칭
- accuracy / ROI / performance 계산

### 6.6 Profile / Track Record

사용자별 검증 가능한 예측 기록을 보여줘야 한다.

포함 항목:

- 총 예측 수
- reveal 완료 수
- 적중률
- ROI
- 카테고리별 성과
- 대표 예측
- streak

### 6.7 Leaderboard

전체 사용자 기준 랭킹이 필요하다.

포함 항목:

- global leaderboard
- 카테고리별 leaderboard
- 기간별 leaderboard
- 예측 수 최소 기준
- unrevealed 비율 관련 필터 또는 패널티 정책

### 6.8 커뮤니티 기능

Supabase가 담당하는 부가 기능이다.

- 댓글
- 프로필
- 공개 닉네임
- 공개 통계 캐시
- 알림

### 6.9 Polymarket 전체 시장 커버

PredixScore는 장기적으로 `Polymarket의 다양한 카테고리와 시장 구조를 모두 수용`할 수 있어야 한다.

이 말은 `처음부터 모든 시장 UX를 완벽히 지원`해야 한다는 뜻은 아니다.

올바른 원칙은 아래다.

- 백엔드와 데이터 모델은 처음부터 전체 시장을 수용 가능하게 설계
- 프론트 노출과 예측 UX는 단계적으로 확장

지원해야 하는 범주의 예:

- 정치
- 스포츠
- 크립토
- 거시경제
- 기업/실적
- 문화/연예
- 기술
- 세계 이슈

지원해야 하는 구조의 예:

- 단일 binary market
- 하나의 event 안에 여러 market 이 달린 multi-market event
- multi-outcome market
- 종료 시점이 서로 다른 하위 market 묶음
- 태그/시리즈/토너먼트형 구조

정책:

- `V1`
  - 읽기: 가능한 한 전체 카테고리 지원
  - 예측: binary market 중심
- `V2`
  - multi-market event 완전 지원
  - multi-outcome market 지원
- `V3`
  - 카테고리별 score / leaderboard / resolution 예외 처리 강화

즉 제품 전략은 아래다.

`전체 시장을 읽을 수 있게 설계하고, 예측 가능한 시장 유형은 단계적으로 넓혀간다`

### 6.10 다국어 지원

PredixScore는 처음부터 `언어팩(i18n)`을 전제로 설계해야 한다.

현재 코드베이스에는 이미 한국어/영어 메시지 파일이 존재한다.

- [`messages/ko.json`](../messages/ko.json)
- [`messages/en.json`](../messages/en.json)

최종적으로 번역 대상은 UI 문구만이 아니다.

포함 대상:

- 공통 UI 라벨
- 버튼 / 상태 / 에러 문구
- 시장 탐색 UI
- commit / reveal UX
- 포트폴리오 / 프로필 / 리더보드
- onboarding / wallet / auth 문구
- 댓글 / 알림 / 토스트
- 빈 상태 / 실패 상태

번역 비대상 또는 원문 유지 대상:

- Polymarket에서 내려오는 시장 제목 원문
- Polymarket 이벤트 설명 원문
- 카테고리 원문이 필요한 경우의 source label
- tx hash / wallet address / onchain technical field

다국어 원칙:

- `사용자 인터페이스 문구`는 전부 번역 키로 관리
- `시장 원문 데이터`는 source fidelity 를 위해 원문 우선 유지
- 필요한 경우에만 `원문 + 현지화 보조 라벨` 병행
- DB 에 저장하는 enum/status 도 가능하면 `표시 문자열`이 아니라 `stable code`로 저장

권장 locale 범위:

- `ko`
- `en`
- 향후 필요 시 `ja`, `zh`, `es`

예측/온체인 기능에서 추가로 번역해야 할 영역:

- commit pending / success / fail
- reveal available / revealed / failed
- sponsor gas 관련 안내
- wallet signing 안내
- score / accuracy / ROI / streak 용어
- unsupported market type 안내

즉 i18n 도 기능 요구사항의 일부로 취급해야 한다.

## 7. 데이터 소유권 모델

### 7.1 Blockchain 에 저장되는 것

- commit hash
- marketRef
- revealAfter
- commit id
- reveal payload 검증 결과
- 관련 event logs

### 7.2 Supabase 에 저장되는 것

- wallet address
- user profile
- ciphertext
- commit tx hash
- reveal tx hash
- commit/reveal status
- marketRef
- eventSlug / marketSlug 같은 인덱싱용 메타
- Polymarket resolution cache
- score cache
- leaderboard snapshots
- comments / notifications / analytics

### 7.3 Supabase 에 저장하면 안 되는 것

- reveal 전 평문 outcome
- reveal 전 평문 stake
- reveal 전 평문 entryPrice
- 복호화 키
- 서버가 직접 읽을 수 있는 raw prediction payload

## 8. 데이터 모델 명세

### 8.1 Onchain 모델

컨트랙트 개념:

- `commit(hash, marketRef, revealAfter)`
- `reveal(id, outcomeIndex, stakeAmount, entryPrice, salt)`

해시 규칙:

```text
hash = keccak256(abi.encode(
  user,
  marketRef,
  outcomeIndex,
  stakeAmount,
  entryPrice,
  salt
))
```

시장 참조 규칙:

```text
marketRef = keccak256(abi.encode(eventSlug, marketSlug))
```

### 8.2 Supabase 핵심 테이블 제안

#### `profiles`

- 공개 프로필
- wallet address 또는 auth user 와 연결

#### `prediction_commits`

최종 구조의 핵심 테이블.

권장 필드:

- `id uuid primary key`
- `wallet_address text not null`
- `chain_id integer not null`
- `contract_address text not null`
- `commit_id bigint null`
- `commit_tx_hash text not null`
- `reveal_tx_hash text null`
- `event_slug text not null`
- `market_slug text not null`
- `market_ref text not null`
- `ciphertext text not null`
- `ciphertext_version text not null`
- `reveal_after timestamptz not null`
- `status text not null`
- `resolution_status text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

권장 status:

- `pending_commit`
- `committed`
- `reveal_available`
- `revealed`
- `settled`
- `failed`

#### `prediction_results`

정산 결과 캐시.

권장 필드:

- `id uuid primary key`
- `prediction_commit_id uuid not null`
- `resolved_outcome_index integer not null`
- `is_correct boolean not null`
- `roi numeric null`
- `score_delta numeric null`
- `resolved_at timestamptz not null`

#### `market_resolutions`

Polymarket resolution 캐시.

- `event_slug text`
- `market_slug text`
- `resolution_source text`
- `resolved_outcome_index integer`
- `resolved_at timestamptz`
- `raw_payload jsonb`

#### `leaderboard_snapshots`

- 집계 캐시
- 랭킹 계산 비용 절감용

#### `market_catalog_cache`

Polymarket의 넓은 시장 범위를 안정적으로 다루기 위한 캐시 테이블.

권장 필드:

- `event_slug text primary key`
- `event_title text not null`
- `category text null`
- `subcategory text null`
- `tags jsonb not null`
- `markets jsonb not null`
- `market_count integer not null`
- `is_binary_only boolean not null`
- `has_multi_outcome boolean not null`
- `has_multi_market boolean not null`
- `source_updated_at timestamptz null`
- `synced_at timestamptz not null`

용도:

- 전체 카테고리 탐색 성능 개선
- unsupported market type 필터링
- UI 노출 정책 제어
- 다국어 라벨 보조 처리

### 8.3 POC 테이블과의 관계

현재 `paper_positions` 구조는 임시 POC 용이다.

향후 방향:

- 초기에는 유지 가능
- onchain 전환 이후 deprecated 처리
- 최종적으로는 `prediction_commits` 중심 구조로 이동

## 9. API / 서비스 명세

### 9.1 Polymarket read API

현재처럼 읽기 전용으로 유지.

- `/api/polymarket/markets`
- `/api/polymarket/event`
- `/api/polymarket/book`
- `/api/polymarket/history`

### 9.2 Commit 저장 API

역할:

- commit tx 성공 후 Supabase에 최소 메타 저장

예시 입력:

```ts
{
  walletAddress: string;
  chainId: number;
  contractAddress: string;
  commitTxHash: string;
  eventSlug: string;
  marketSlug: string;
  marketRef: string;
  ciphertext: string;
  ciphertextVersion: string;
  revealAfter: string;
}
```

주의:

- 서버는 plaintext 를 입력받지 않는다

### 9.3 Reveal 상태 동기화 API

역할:

- reveal tx 이후 상태 반영
- 인덱서 또는 cron 이 사용 가능

### 9.4 Resolution Sync Job

역할:

- Polymarket 종료 시장 조회
- resolution 결과 캐시
- revealed prediction 과 매칭
- score 계산

### 9.5 Profile / Leaderboard API

역할:

- 집계 결과 노출
- 공개 프로필 및 랭킹 제공

### 9.6 Market Catalog Sync Job

역할:

- Polymarket 이벤트/시장 구조를 주기적으로 캐시
- category / tags / market shape 정보를 정규화
- binary / multi-outcome / multi-market 여부 계산
- 프론트에서 지원 가능한 시장만 분리 노출

## 10. 클라이언트 암호화 명세

최소 원칙:

- plaintext 는 서버로 보내기 전에 클라이언트에서 암호화
- salt 는 클라이언트가 생성
- 복호화 키는 지갑 서명 기반으로 파생

plaintext 예시:

```ts
{
  eventSlug: string;
  marketSlug: string;
  outcomeIndex: number;
  stakeAmount: string;
  entryPrice: string;
  salt: string;
}
```

암호화 결과:

- `ciphertext`
- `version`
- 필요 시 `iv`, `aad`, `kdf metadata`

보안 요구사항:

- 키는 서버에 저장하지 않음
- salt 평문 저장 금지
- 버전 필드로 향후 스킴 마이그레이션 가능하게 설계

## 11. 보안 원칙

### 11.1 서버 신뢰 최소화

- 서버는 평문을 모른다
- 서버는 복호화 키를 모른다
- 서버는 commit/reveal 사실만 인덱싱한다

### 11.2 체인 신뢰 모델

- commit hash 는 위변조 불가
- reveal 은 사후 검증 가능
- 미reveal 은 영원히 비공개일 수 있음

### 11.3 운영 보안

- paymaster spend limit 설정
- tx replay / duplicate handling
- RPC failover
- rate limiting
- wallet spam 방지

## 12. UX 원칙

### 12.1 사용자 경험

사용자는 복잡한 암호화/commit-reveal을 몰라도 된다.

사용자가 보는 흐름은 단순해야 한다.

1. 시장을 본다
2. 예측한다
3. 저장한다
4. 나중에 공개한다
5. 점수를 본다

### 12.2 가스 UX

- commit 은 가능하면 sponsor
- reveal 도 sponsor 할지 여부는 정책 결정 필요
- 실패 시 fallback UX 제공

### 12.3 군중심리 차단

제품 thesis 상 확률 표시 정책은 별도 검토 대상이다.

옵션:

- commit 전 확률 숨김
- explicit reveal UX 후 잠시 노출
- solo mode

### 12.4 카테고리/시장 타입 UX

모든 시장을 같은 화면으로 억지로 보여주면 안 된다.

지원 원칙:

- binary market 은 full prediction UX 제공
- multi-market event 는 하위 market 탐색 UX 제공
- multi-outcome market 은 별도 outcome selector 제공
- 현재 미지원 구조는 `read only` 또는 `coming soon` 으로 노출

즉 unsupported 를 숨기기보다, `읽기는 가능하되 예측 UX는 제한`하는 전략이 바람직하다.

### 12.5 언어 UX

언어 전환 시 아래가 보장돼야 한다.

- 공통 UI 가 즉시 번역됨
- 시장 원문 제목은 깨지지 않음
- 숫자/통화/날짜 형식이 locale 에 맞게 표시됨
- score / percentage / ROI 표기가 locale 정책에 맞게 일관됨

## 13. 체인 전략

현재 기준 추천:

- `1순위`: Polygon PoS
- `2순위`: Base
- `3순위`: Ronin

이유:

- Polygon PoS 는 가스 대납 원가 관점에서 가장 실용적
- Base 는 wallet/paymaster UX 가 강함
- Ronin 은 게임 생태계 전략이 있을 때 유효

체인 결정 방식:

- 감이 아니라 `bake-off`
- testnet commit/reveal 성공률
- wallet UX
- sponsorship setup 난이도
- 월 운영 비용 추정

## 14. 로드맵

### Phase 0 — Chain Bake-off

- Polygon / Base / Ronin testnet 비교
- commit/reveal 실측
- sponsorship setup 비교
- 최종 체인 선택

### Phase 1 — POC 정리

- 현재 `paper_positions` 구조를 임시 구조로 명확화
- 최종 `prediction_commits` 구조 설계
- plaintext 와 server-visible metadata 분리

### Phase 2 — 컨트랙트 확정

- commit/reveal 인터페이스 확정
- marketRef / hash 규칙 고정
- Foundry 테스트 강화

### Phase 3 — Wallet + Paymaster

- wallet onboarding 구현
- sponsored tx 연결
- testnet commit 성공

### Phase 4 — Client-side Encryption

- prediction plaintext 암호화
- ciphertext only 저장
- 서버 블라인드 보장

### Phase 5 — Commit Flow Migration

- 기존 save prediction 흐름 제거
- onchain commit 중심으로 치환
- Supabase에는 메타만 저장

### Phase 6 — Reveal Flow

- reveal 가능한 포지션 목록
- reveal tx UX
- 예외 처리

### Phase 7 — Resolution / Score

- Polymarket resolution sync
- correctness / ROI 계산
- score 집계

### Phase 7.5 — Market Coverage Expansion

- binary market 외 구조 지원 확대
- multi-market event UX 정교화
- multi-outcome 지원
- category-specific resolution 예외 처리

### Phase 7.6 — I18n Hardening

- commit/reveal/onchain UX 번역 키 전면 적용
- locale 별 숫자/날짜/통화 형식 정리
- unsupported market / sponsor gas / wallet signing 문구 번역
- 다국어 QA

### Phase 8 — Profile / Leaderboard

- 공개 프로필
- leaderboard
- category stats

### Phase 9 — Mainnet Launch

- mainnet deploy
- paymaster budget 운영
- 모니터링 / 알림 / 장애 대응

## 15. KPI

- first commit conversion
- sponsored commit success rate
- sponsored reveal success rate
- commit 당 평균 원가
- prediction lifecycle 당 평균 원가
- reveal completion rate
- score calculation latency
- monthly active predictors
- monthly revealed predictions

## 16. Non-goals

- 실거래 브로커리지
- 사용자 자산 custody
- Polymarket 주문 대행
- reveal 전 예측 평문 서버 저장

## 17. 구현 기준 파일

현재 코드 기준 주요 참조 파일:

- [`src/lib/polymarket.ts`](../src/lib/polymarket.ts)
- [`src/app/api/polymarket/markets/route.ts`](../src/app/api/polymarket/markets/route.ts)
- [`src/app/api/polymarket/event/route.ts`](../src/app/api/polymarket/event/route.ts)
- [`src/app/api/polymarket/book/route.ts`](../src/app/api/polymarket/book/route.ts)
- [`src/app/api/polymarket/history/route.ts`](../src/app/api/polymarket/history/route.ts)
- [`src/app/api/paper/positions/route.ts`](../src/app/api/paper/positions/route.ts)
- [`contracts/src/PredixScoreRegistry.sol`](../contracts/src/PredixScoreRegistry.sol)
- [`contracts/README.md`](../contracts/README.md)
- [`docs/polymarket-api.md`](./polymarket-api.md)
- [`docs/roadmap.md`](./roadmap.md)

## 18. 최종 결론

PredixScore는 `Supabase로 만드는 앱`이면서 동시에 `Blockchain으로 검증되는 기록 시스템`이어야 한다.

이 둘은 대체 관계가 아니다.

- Supabase는 운영 백엔드
- Blockchain은 신뢰 레이어
- Polymarket는 시장 데이터 레이어

따라서 올바른 최종 구조는 아래다.

`Polymarket로 시장을 읽고, 클라이언트가 예측을 암호화하고, blockchain에 commit/reveal을 기록하고, Supabase가 그 결과를 인덱싱하고 제품 기능으로 노출하는 구조`
