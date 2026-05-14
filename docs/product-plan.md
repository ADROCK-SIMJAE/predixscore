# PredixScore 제품 계획

> 제품 방향, 유저 플로우, 블록체인 전략의 현재 기준 문서.
> 마지막 갱신: 2026-05-13

## 1. 제품 정의

PredixScore는 Polymarket 실거래 클라이언트가 아니다.

PredixScore는 Polymarket를 공개 시장 데이터 소스로 사용하고, 사용자가 검증 가능한 예측 기록을 쌓게 하는 서비스다.

핵심 제품:

- 사용자는 Polymarket 이벤트와 마켓을 탐색한다.
- 사용자는 가상 stake로 모의 예측을 만든다.
- 앱은 PnL, 승률, ROI, 공개 평판을 추적한다.
- 최종 구조에서는 예측을 클라이언트 암호화 + onchain commit-reveal로 기록한다.
- 블록체인 트랜잭션이 필요한 핵심 플로우에서는 PredixScore가 유저 가스비를 대납한다.

하지 않는 것:

- Polymarket 실거래 주문 제출
- 사용자 자금 수탁
- house account 거래
- Polymarket 입출금 UX

## 2. 현재 핵심 결정

개발 방식은 두 가지다. 어떤 방식을 선택하느냐에 따라 일정과 리스크가 달라진다.

### Track A — 블록체인 없이 먼저 만들기

Supabase만으로 전체 제품 플로우를 먼저 만든다.

선택할 때:

- 빠르게 사용 가능한 제품이 필요하다.
- 시장 탐색, 예측 생성, 포트폴리오, 정산, 리더보드, 프로필 UX를 먼저 검증하고 싶다.
- 아직 Base/Polygon/Ronin/paymaster 스택을 결정하지 않았다.

특징:

- 예측 payload는 Supabase `paper_positions`에 저장된다.
- 서버는 예측 내용을 볼 수 있다.
- UI 문구는 `onchain commit`이 아니라 `paper prediction`으로 표현해야 한다.
- 데이터 모델은 가능한 한 최종 onchain 구조로 전환하기 쉽게 잡는다.
- 이후 저장 로직을 encrypted commit record로 교체한다.

예상 일정:

- paper trading MVP: 2-3주
- 프로필/리더보드/i18n polish: 1-2주
- 이후 블록체인/paymaster 전환: 추가 3-5주

### Track B — Supabase + 블록체인을 처음부터 만들기

가스비 대납 onchain commit-reveal을 중심으로 처음부터 만든다.

선택할 때:

- 첫 공개 버전부터 server-blind 예측 검증이 필요하다.
- 가스비 대납이 출시 약속이다.
- wallet, paymaster, chain, indexing, encryption 복잡도를 지금 감수할 수 있다.

특징:

- 클라이언트가 예측 plaintext를 암호화한다.
- 클라이언트가 commit hash를 계산한다.
- sponsor/paymaster를 통해 onchain commit tx를 보낸다.
- Supabase는 ciphertext, tx metadata, status, indexed public stats만 저장한다.
- reveal도 블록체인 트랜잭션이 필요하다.

예상 일정:

- chain/paymaster bake-off: 1-2주
- contract/testnet 배포: 2-3주
- wallet/signing/sponsored transaction UX: 2-3주
- encryption/reveal/indexing/scoring: 2-3주
- 안정적인 end-to-end MVP까지 총 7-11주

### 현재 권장

기본값은 `Track A`다.

단, 첫 공개 버전의 핵심 약속이 `가스비 대납 + server-blind onchain prediction`이면 `Track B`로 바로 간다.

이유:

- Polymarket 시장 커버, 가격, 정산, 포트폴리오, 리더보드 UX가 아직 검증 대상이다.
- Track A도 Track B와 같은 화면 흐름으로 만들 수 있다.
- Track B는 chain/paymaster 결정이 선행되어야 한다.

## 3. Polymarket 사용 정책

Polymarket API 사용 범위:

| API | 상태 | 용도 |
|---|---:|---|
| Gamma API | 사용 | 이벤트, 마켓, 태그, 검색, 메타데이터 |
| CLOB public read | 사용 | 오더북, 가격, 가격 히스토리 |
| Data API | 나중 | Polymarket 유저/활동 분석이 필요할 때 검토 |
| CLOB trading API | 사용 안 함 | 실거래는 비범위 |
| Bridge / Relayer API | 사용 안 함 | Polymarket 입출금은 비범위 |
| WebSocket | 나중 | V1 이후 실시간 가격 개선 후보 |

V1 시장 지원:

- normalize 가능한 active event는 최대한 읽는다.
- `clobTokenIds`, `outcomes`, price가 유효할 때만 예측을 허용한다.
- binary market을 먼저 지원한다.
- 미지원 market은 read-only로 보여준다.
- position은 `eventSlug + marketSlug + tokenId + outcomeIndex`에 묶는다.

가격 정책:

- V1 entry/current price는 normalized `outcomePrices`를 기준으로 한다.
- 가격이 없거나 유효하지 않으면 예측 CTA를 비활성화한다.
- CLOB midpoint/spread/last trade 조합은 V2 price resolver로 분리한다.

정산 정책:

- 명확한 binary closed market만 정산한다.
- winning price는 `0.99` 이상이어야 한다.
- losing price는 `0.01` 이하여야 한다.
- 모호한 market은 pending 유지한다.
- `voided` 상태는 준비하지만 V1 자동 정산에서는 보수적으로 사용하지 않는다.

## 4. 유저 플로우

### 4.1 Track A: Paper Trading Flow

1. 사용자가 홈에 진입한다.
2. 앱이 Gamma API에서 Polymarket 이벤트를 불러온다.
3. 사용자가 검색/태그/정렬로 시장을 찾는다.
4. 사용자가 이벤트 상세로 들어간다.
5. 앱이 이벤트 메타데이터, outcome, 오더북, 가격 히스토리를 보여준다.
6. 사용자가 outcome을 선택한다.
7. 사용자가 가상 stake를 입력한다.
8. 앱이 price, stake, token id, login/session을 검증한다.
9. 앱이 Supabase에 position을 저장한다.
10. 사용자가 포트폴리오에서 새 position을 본다.
11. 앱이 현재 Polymarket 가격으로 미실현 PnL을 계산한다.
12. 시장 종료 후 명확한 결과만 정산한다.
13. profile과 leaderboard가 realized result 기준으로 갱신된다.

### 4.2 Track B: Sponsored Onchain Flow

1. 사용자가 홈에 진입한다.
2. 앱이 Gamma API에서 Polymarket 이벤트를 불러온다.
3. 사용자가 wallet/passkey account를 연결하거나 만든다.
4. 앱은 PredixScore가 예측 기록 네트워크 수수료를 부담한다고 안내한다.
5. 사용자가 market, outcome, virtual stake를 선택한다.
6. 클라이언트가 prediction plaintext를 만든다.
7. 클라이언트가 salt를 생성한다.
8. 클라이언트가 plaintext를 로컬에서 암호화한다.
9. 클라이언트가 `marketRef`를 계산한다.
10. 클라이언트가 commit hash를 계산한다.
11. 앱이 선택된 paymaster stack으로 sponsored transaction을 요청한다.
12. wallet이 `commit(hash, marketRef, revealAfter)`를 서명/전송한다.
13. Supabase는 ciphertext, commit tx hash, wallet, marketRef, status를 저장한다.
14. 사용자는 prediction이 committed 상태인 것을 본다.
15. 시장 종료 후 reveal 가능한 상태가 된다.
16. 클라이언트가 ciphertext를 복호화한다.
17. 사용자가 sponsored 또는 조건부 sponsored reveal tx를 보낸다.
18. contract가 reveal payload를 기존 commit hash와 검증한다.
19. Supabase가 onchain event와 Polymarket resolution을 인덱싱한다.
20. profile과 leaderboard가 verified result 기준으로 갱신된다.

### 4.3 가스비 대납 UX 규칙

유저는 핵심 예측 플로우에서 native gas token을 갖고 있지 않아도 되어야 한다.

대납 정책:

- commit transaction은 기본 대납한다.
- MVP/testnet에서는 reveal transaction도 대납한다.
- production에서는 reveal을 항상 대납할지, 조건부로 대납할지 결정해야 한다.
- 스팸 방지를 위해 일일 commit 제한을 둔다.
- paymaster는 PredixScore contract call만 허용한다.
- sponsorship 실패 시 재시도/대체 경로를 보여준다.

유저 문구:

- 조건 없이 "무료 트랜잭션"이라고 쓰지 않는다.
- "PredixScore가 이 예측 기록의 네트워크 수수료를 부담합니다"처럼 표현한다.
- sponsorship 실패 시 바로 재시도할 수 있어야 한다.

## 5. 최종 Server-Blind 모델

Reveal 전 Supabase가 저장해도 되는 것:

- wallet address
- commit id
- commit tx hash
- ciphertext
- marketRef
- revealAfter
- status
- 공개 market metadata

Reveal 전 Supabase가 몰라야 하는 것:

- 예측 방향
- 정확한 virtual stake
- entry price plaintext
- salt
- 복호화 키

Reveal 후:

- reveal된 예측 필드는 공개/인덱싱 가능하다.
- scoring은 reveal field와 Polymarket resolution을 기준으로 계산한다.
- unrevealed prediction은 제외, 패널티, 별도 표시 중 정책을 정해야 한다.

## 6. 남은 결정

일정과 구현을 바꾸는 결정들:

- 다음 마일스톤을 Track A로 갈지 Track B로 갈지
- 체인: Base, Polygon PoS, Ronin 중 선택
- wallet 모델: 외부 지갑, embedded wallet, passkey smart account, hybrid
- paymaster provider와 sponsorship 정책
- reveal sponsorship 정책
- unrevealed prediction 패널티
- leaderboard 최소 예측 수

