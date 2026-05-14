# PredixScore 로드맵

> 마지막 갱신: 2026-05-13

## Product Thesis

- Polymarket는 `시장 데이터 소스`로 사용
- 우리 서비스는 `실거래`가 아니라 `모의 예측 + 검증 가능한 기록`을 제공
- 최종 목표는 `서버도 예측 평문을 모르는 구조`
- 예측 내용은 `클라이언트 암호화 + onchain commit-reveal`로 기록
- 시장 종료 후 reveal 과 resolution 매칭으로 `정답률 / ROI / track record`를 계산

## 현재 상태

### 이미 되어 있는 것

- Polymarket 읽기 전용 연동
- 시장 목록 / 이벤트 상세 / 오더북 / 가격 히스토리 UI
- 서버 기반 paper position POC
- Foundry 컨트랙트 초안과 테스트

### 아직 최종 구조가 아닌 부분

- 현재 POC 는 서버가 paper payload 를 받는다
- 즉 현재는 `server-blind onchain 구조`가 아니라 `off-chain 임시 구조`
- 다음 단계는 이 구조를 `commit-reveal + client-side encryption`으로 치환하는 것이다

## 핵심 의사결정

PredixScore 의 체인 선택은 `가스 대납 단가`와 `온보딩 UX` 사이의 트레이드오프다.

### 체인 후보 비교

| 체인 | 장점 | 단점 | PredixScore 적합도 |
|---|---|---|---|
| Polygon PoS | 낮은 원가, EIP-4337/Paymaster 가능, EVM 호환, 대규모 사용자 기반 | Base 만큼 제품/지갑 스토리가 강하게 묶여 있진 않음 | 가스 대납 중심이면 가장 실용적 |
| Base | Base Account, Paymaster, passkey/smart wallet, 배포와 UX 가 잘 정리됨 | ETH 기반이라 장기 대납 원가가 Polygon/Ronin보다 보수적일 수 있음 | 제품 완성도와 소비자 UX 중심이면 강함 |
| Ronin | Waypoint, keyless wallet, gas sponsorship, 낮은 수수료, 게임 UX 강함 | 생태계 색이 게임 중심, 예측/평판 제품과는 다소 결이 다름 | 게임형 경험을 원하면 유효 |
| Optimism | EVM, gas sponsorship 가능한 흐름, Superchain | Base 대비 차별점이 약함 | Base 대안 |
| Arbitrum | EVM, 풍부한 인프라 | 본 프로젝트에 특화된 온보딩 강점은 상대적으로 약함 | 후보군이지만 1순위는 아님 |
| Solana | 매우 낮은 수수료, 높은 처리량 | 현재 Solidity/EVM 스택과 비호환, 사실상 재개발 | 원가만 극단적으로 추구할 때만 고려 |

### 공식 문서 기준 포인트

- `Base`
  - Base Account 는 smart wallet 기반 universal sign-on, one-tap payments, paymaster sponsorship 을 강조
  - 공식 Paymaster 가이드와 gas credits 프로그램 존재
- `Polygon`
  - Polygon PoS 는 공식 문서에서 `ERC-4337`, `Paymasters`, `Embedded Wallets`, `Sponsored Gas`, `Session-based signing`을 지원
  - 공식 사이트는 `평균 트랜잭션 비용 $0.002`를 전면에 제시
- `Ronin`
  - Ronin 은 `Ronin Waypoint`, keyless wallet, gas sponsorship, 게임/마켓플레이스 중심 UX 를 강조
- `Solana`
  - 공식 문서는 수수료가 대체로 `fractions of a cent` 라고 설명하지만, 현재 코드를 유지한 채 옮길 수는 없다

### 현재 권장안

#### 옵션 A — 가스 대납 원가 최적화 우선

- `Polygon PoS` 권장
- 이유:
  - 단가가 매우 낮음
  - EVM 이라 현재 Solidity / Foundry / viem 흐름 유지 가능
  - sponsored gas / account abstraction / embedded wallet 조합이 현실적

#### 옵션 B — 사용자 온보딩과 제품 완성도 우선

- `Base` 권장
- 이유:
  - Base Account + Paymaster + passkey UX 가 정돈되어 있음
  - consumer app 으로 확장하기 좋음
  - sponsored tx 운영 경험과 문서가 좋음

#### 옵션 C — 게임 생태계 편승 우선

- `Ronin` 권장
- 이유:
  - Waypoint 와 keyless wallet 흐름이 강함
  - 게임형 prediction product 로 포지셔닝할 때 잘 맞음

### 현재 추천 결론

- `가스 대납이 핵심 KPI` 이면 `Polygon PoS`
- `제품/온보딩/브랜드`가 더 중요하면 `Base`
- `Ronin`은 game-native 전략일 때 선택

## 가스 대납 관점의 운영 원칙

가스 자체보다 중요한 것은 `유저 1명당 전체 라이프사이클 비용`이다.

PredixScore 의 비용은 대략 다음으로 구성된다.

- commit 1회
- reveal 1회
- 인덱싱 및 정산용 보조 호출
- 실패 트랜잭션 / 재시도 / 사용자 이탈 비용

### 예산 산식

```
월 비용 = (월 commit 수 x commit 평균 비용)
       + (월 reveal 수 x reveal 평균 비용)
       + (실패/재시도 버퍼 10~30%)
       + (인덱서/서버/RPC 비용)
```

### 제품 설계로 비용을 낮추는 방법

- commit 만 sponsor 하고 reveal 은 사용자 호출 또는 특정 조건부 sponsor
- 저품질 스팸 예측을 막기 위해 1일 commit 횟수 제한
- 계약 allowlist 기반 paymaster 정책 사용
- 향후 `batch commit` 또는 smart session 도입
- reveal 을 개별 즉시 처리하지 말고 묶어서 UX 설계

### 체인별 비용 해석

- `Polygon PoS`
  - 장기 대납 운영에 가장 유리한 편
  - 단가를 크게 걱정하지 않고 예측량을 늘리기 좋음
- `Base`
  - 충분히 싸지만, 운영팀 입장에서는 “무시 가능한 수준”인지 직접 측정이 필요
  - 대신 paymaster 와 지갑 UX 가 좋다
- `Ronin`
  - 낮은 비용과 keyless UX 는 장점
  - 다만 생태계 핏을 먼저 확인해야 한다
- `Solana`
  - 원가는 매우 유리하지만 재플랫폼 비용이 너무 크다

## 체인 선택 로드맵

체인은 감으로 고르지 말고 `2주 bake-off`로 고르는 것이 맞다.

### Phase 0 — Chain Bake-off

기간: `1~2주`

목표:

- Base, Polygon, Ronin 중 어디가 `PredixScore + sponsored mock prediction`에 가장 잘 맞는지 실측

해야 할 일:

- 동일한 `PredixScoreRegistry` 인터페이스를 세 체인에 맞춰 배포 가능한지 확인
- testnet 에서 commit/reveal 트랜잭션 100회씩 실행
- 평균 tx 성공률, 평균 지연, 예상 원가, wallet UX 난이도 측정
- paymaster / sponsorship setup 난이도 기록
- 모바일 기준 로그인/서명 흐름 캡처

판정 기준:

- 가스 대납 예상 원가
- wallet onboarding friction
- 개발 난이도
- 운영 복잡도
- 제품 포지셔닝 일치도

Exit Criteria:

- `최종 체인 1개` 결정
- `Fallback 체인 1개` 결정

## 온체인 전환 전체 로드맵

### Phase 1 — POC 와 최종 구조 분리

목표:

- 현재 paper trading POC 를 `임시 오프체인 구조`로 명확히 분리
- 최종 온체인 구조와 데이터 모델을 고정

작업:

- 어떤 필드가 plaintext 인지 정의
- 어떤 필드만 서버가 저장할지 정의
- 현재 `paper_positions` 와 최종 `encrypted commit record`의 차이를 문서화
- UX copy 에서 “paper save” 와 “onchain commit”을 구분

Exit Criteria:

- 서버가 최종적으로 알지 못해야 할 필드 목록이 확정됨

### Phase 2 — 컨트랙트 규칙 확정

목표:

- commit/reveal 데이터 모델을 고정

작업:

- `marketRef` 계산 규칙 고정
- `hash` 입력 필드 고정
- `revealAfter` 규칙 고정
- 미reveal 정책 결정
- score 계산 대상 필드 결정

Exit Criteria:

- 프론트, 백엔드, 컨트랙트가 동일한 해시 규칙을 사용

### Phase 3 — 스마트 컨트랙트 MVP

목표:

- testnet 에서 commit/reveal 동작 검증

작업:

- `PredixScoreRegistry` 정리
- commit / reveal / 중복 방지 / 시간 검증
- event emit 구조 확정
- Foundry 테스트 확대
- 실패 케이스 테스트 추가

Exit Criteria:

- testnet 에서 commit/reveal 100회 이상 문제 없이 재현

### Phase 4 — 지갑/서명/가스 대납

목표:

- 사용자가 앱 안에서 예측을 저장할 때 실제로 sponsor 된 onchain commit 이 발생

작업:

- 선택 체인에 맞는 wallet stack 연결
- paymaster / gas sponsorship 연결
- allowlist 와 spending policy 설정
- testnet 기준 sponsor 트랜잭션 성공률 검증
- failed sponsorship fallback UX 정의

Exit Criteria:

- 유저가 native gas token 없이 commit 가능

### Phase 5 — 클라이언트 암호화

목표:

- 서버가 예측 평문을 읽지 못하도록 구조 전환

작업:

- 지갑 서명으로 암호화 키 파생
- plaintext 생성 후 client-side encryption
- 서버에는 `ciphertext`, `commitId`, `txHash`, 최소 인덱싱 필드만 저장
- salt / ciphertext 복구 전략 정의

Exit Criteria:

- DB 를 봐도 예측 평문을 읽을 수 없음

### Phase 6 — 저장소 구조 전환

목표:

- 기존 `paper_positions` 중심 구조를 `server-blind` 구조로 바꿈

작업:

- DB schema 수정
- plaintext 필드 제거 또는 deprecated 처리
- `walletAddress`, `commitId`, `commitTxHash`, `marketRef`, `ciphertext`, `revealAfter`, `status` 중심으로 정리
- 기존 API route 를 commit 중심으로 교체

Exit Criteria:

- 서버는 내용을 모른 채 commit record 만 다룸

### Phase 7 — Commit UX 전환

목표:

- 현재 Save Prediction 흐름을 onchain commit 으로 대체

작업:

- BetModal 흐름 교체
- salt 생성
- plaintext 생성
- ciphertext 생성
- hash 계산
- wallet sign / paymaster sponsored tx
- tx 확정 후 서버에 최소 메타 저장

Exit Criteria:

- 사용자 입장에서 “예측 저장”이 실제 onchain commit 으로 작동

### Phase 8 — Reveal UX

목표:

- 시장 종료 후 사용자가 자기 예측을 reveal 할 수 있음

작업:

- reveal 가능 포지션 목록 계산
- reveal 버튼과 복호화 UX
- reveal 실패 / salt 분실 / mismatch 처리
- unrevealed 상태를 profile 과 score 에서 어떻게 취급할지 확정

Exit Criteria:

- commit -> reveal 전체 흐름이 앱에서 완결

### Phase 9 — Resolution / Score 엔진

목표:

- Polymarket resolution 과 reveal 결과를 매칭해 점수 계산

작업:

- resolution polling / cron / indexer 설계
- marketSlug 기준 winner 결정
- accuracy / ROI / hit rate 계산
- category / time range / confidence 별 통계 산출

Exit Criteria:

- 최소 1개의 완전한 prediction lifecycle 이 점수로 반영

### Phase 10 — Profile / Leaderboard

목표:

- PredixScore 의 핵심 가치인 `검증 가능한 실력 기록` 노출

작업:

- wallet 별 profile
- global leaderboard
- 시장별 commit 수 / reveal 수 통계
- streak / category score / historical performance

Exit Criteria:

- 다른 사용자가 특정 wallet 의 실력 기록을 해석 가능

### Phase 11 — Mainnet Launch

목표:

- 선택 체인 mainnet 에서 운영

작업:

- mainnet 배포
- explorer verify
- RPC failover 구성
- paymaster 운영 정책 배포
- 모니터링 / 알림 / 실패 복구 설계

Exit Criteria:

- mainnet 에서 sponsor commit/reveal 운영 가능

## 구현 우선순위

1. 체인 선택 bake-off
2. 컨트랙트 규칙 고정
3. testnet commit/reveal
4. paymaster / wallet integration
5. client-side encryption
6. server-blind storage migration
7. reveal / resolution / score
8. leaderboard
9. mainnet

## 마일스톤

### M1 — Chain Decision

- Base / Polygon / Ronin 비교 종료
- 최종 체인 선택

### M2 — Testnet Commit MVP

- 사용자가 가스 없이 commit 가능
- 서버는 tx 메타만 저장

### M3 — Server-Blind Prediction

- ciphertext 저장
- 서버는 평문을 모름

### M4 — Reveal + Score

- reveal 후 Polymarket resolution 과 매칭
- 프로필 점수 산출

### M5 — Mainnet Launch

- sponsor 정책 운영
- leaderboard 공개

## KPI

- sponsored commit 성공률
- sponsored reveal 성공률
- commit 당 평균 원가
- reveal 당 평균 원가
- 예측 1건 라이프사이클 평균 원가
- wallet connect -> first commit 전환율
- reveal completion rate
- score 계산 완료까지 걸리는 평균 시간

## 현재 추천 실행안

가장 실용적인 순서는 아래다.

1. `Polygon PoS` 와 `Base`만 먼저 bake-off
2. 가스 예산이 실제로 압박이면 `Polygon PoS` 선택
3. 원가 차이가 충분히 작고 UX 차이가 크면 `Base` 선택
4. `Ronin`은 별도 distribution 전략이 있을 때만 재검토

즉 현재 우선순위는:

- `1순위 후보`: Polygon PoS
- `2순위 후보`: Base
- `3순위 후보`: Ronin

## 참고 링크

- Base Account Overview: https://docs.base.org/base-account/overview/what-is-base-account
- Base Sponsor Gas: https://docs.base.org/base-account/improve-ux/sponsor-gas/paymasters
- Polygon EIP-4337: https://docs.polygon.technology/pos/concepts/transactions/eip-4337
- Polygon Embedded Wallets: https://docs.polygon.technology/wallets/embedded-wallets
- Polygon Gas Station: https://docs.polygon.technology/tools/gas/polygon-gas-station
- Polygon 공식 사이트: https://polygon.technology/
- Ronin Docs: https://docs.roninchain.com/
- Ronin Wallet vs Waypoint: https://support.roninchain.com/hc/en-us/articles/32995542884251-Interacting-with-the-Ronin-Ecosystem-Ronin-Wallet-vs-Ronin-Waypoint
- Ronin Gas Fee Guide: https://support.roninchain.com/hc/en-us/articles/14036214140827-How-to-Edit-Gas-Fee-in-Transactions
- Optimism Wallet Integration: https://docs.optimism.io/app-developers/reference/actions/integrating-wallets
- Solana Fees: https://solana.com/docs/core/fees
- Solana Fee Explainer: https://solana.com/learn/understanding-solana-transaction-fees
- Polymarket Gamma API: https://gamma-api.polymarket.com
- Polymarket CLOB: https://clob.polymarket.com
