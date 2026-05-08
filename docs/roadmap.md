# PredixScore 로드맵

> 마지막 갱신: 2026-05-08

## Product Thesis (변경 시 여기부터 수정)

- Polymarket 시장 데이터를 **읽기 전용 소스**로 사용
- 사용자는 **혼자만의 판단**으로 예측 (군중 심리 차단)
- 예측 기록은 **위변조 불가능 (onchain commit-reveal)**, 서버도 평문 모름 (지갑 파생 키로 클라이언트 암호화)
- 시장 종료 후 **reveal → 정답률 누적 = 실력 점수**
- 실거래/지갑 체결/하우스 어카운트 주문은 목표 아님

## 결정사항

| 항목 | 결정 | 근거 |
|---|---|---|
| 체인 | **Base** (Sepolia → Mainnet) | Coinbase Smart Wallet 패스키 + Paymaster 무료, 컨슈머 fit |
| 지갑 진입 | Coinbase Smart Wallet 우선, Privy 보류 | 어차피 Base 면 Smart Wallet 으로 충분, Privy 의 멀티체인 abstraction 불필요 |
| 가스 부담 | 앱 sponsor (Coinbase Paymaster) | 유저 0원, MVP 비용 무료 한도 내 |
| onchain 기록 범위 | **commit 해시 + reveal** (필요 시 batch 보강) | 가벼움 + 검증 가능, 서버도 평문 모름 |
| 인증 단계 | onchain wallet 만으로 식별, Google OAuth 보류 | wallet = identity. 멀티 디바이스 동기화 필요 시 추후 Supabase Auth 추가 |
| 실시간 % 표시 | **숨기기 옵션** 또는 commit 후에만 노출 (TBD) | 군중 심리 차단이 product thesis 핵심 |

---

## Phase 1 — Off-chain MVP (완료)

- [x] Supabase 레거시 스키마 드롭
- [x] `paper_positions` 테이블 + RLS + 트리거
- [x] `create_paper_position` RPC (security definer)
- [x] `list_paper_positions` RPC (security definer)
- [x] TypeScript 타입 (`src/types/database.ts`)
- [x] Polymarket API 연결 (markets/event/book/history)
- [x] 페이퍼 포지션 저장 흐름 (`POST /api/paper/positions`)

## Phase 2 — UI 정리 (진행 중) ← **지금 여기**

### 이미 한 것
- [x] MarketCard 의 "Start with YES 0%" 큰 카드 제거 → 인라인 `Yes ¢ / No ¢` 버튼
- [x] `BetModal` 신규 — Yes/No 50:50 토글 + quick stake + 라이브 계산
- [x] MarketDetailClient 재설계 — 컴팩트 outcome 리스트 + 검색·정렬, 단일 컬럼
- [x] 디자인 시스템 (글래스 패널, 그라디언트) 유지

### 군중심리 차단 — 핵심 thesis 반영
- [ ] 확률(%) 표시를 **commit 전엔 숨기는 모드** 도입
  - 옵션 A: 글로벌 토글 ("Solo mode") on/off
  - 옵션 B: 기본은 가리고 사용자가 명시적으로 "Show probabilities" 클릭 시 잠시 노출 (군중 심리 의식했다고 onchain 에 기록)
  - 옵션 C: outcome 리스트는 알파벳/볼륨 정렬로만 보여주고 % 자체를 노출 안 함
- [ ] BetModal 의 라이브 가격 표시 정책도 동일 원칙 적용
- [ ] "Polymarket 군중과 떨어진 너의 의견" 같은 카피로 thesis 강화

### 페이퍼 포트폴리오
- [ ] 홈 우측 포트폴리오 카드 디자인 검토
- [ ] 빈 상태(No positions yet) 카피 정리
- [ ] 포지션별 PnL 시각화 (현재가 vs 진입가 막대)
- [ ] 시장 종료 도래 시 "Reveal 하세요" CTA

### 인증/모달 정리
- [ ] AuthDialog 의 "Privy config required" 폴백을 "Coinbase Smart Wallet 으로 시작" 으로 교체 (Phase 4 후)
- [ ] 또는 Phase 4 까지는 sign-in 버튼 자체를 숨김

### 빈 상태/에러
- [ ] 마켓 로딩 실패 시 retry CTA
- [ ] 오더북 빈 placeholder 6행 → 더 나은 빈 메시지
- [ ] BetModal stake 0 입력 / 미선택 / 정수 외 입력 검증 시각

### 모바일
- [ ] 카드 그리드 모바일에서 1열
- [ ] BetModal 풀스크린 시트 형태 (max-width 무시)
- [ ] outcome 리스트 모바일 컬럼 축약 (확률 바 + Yes/No 만)

### 잡일
- [ ] 코드 내 영문 카피 한국어로 통일 (현재 영문 혼재)
- [ ] favicon, OG image, 메타데이터
- [ ] 로딩 스켈레톤

---

## Phase 3 — 인증 (Coinbase Smart Wallet)

- [ ] `wagmi` + `viem` + `@coinbase/wallet-sdk` 설치
- [ ] `wagmi.config.ts` — Base/Base Sepolia chain, Smart Wallet connector
- [ ] `<WagmiProvider>` 으로 layout 감싸기
- [ ] AuthDialog 교체 — Smart Wallet 패스키 로그인 흐름
- [ ] 로그인 시 `wallet_address` 를 사용자 식별자로 사용 (paper_positions.user_id 와 별도 컬럼 추가)
- [ ] 기존 guest_session_id → wallet_address 마이그레이션 흐름
- [ ] (옵션) Privy 의존성 제거

---

## Phase 4 — Onchain (Base) — Phase A 완료

### Foundry 셋업 (완료)
- [x] `contracts/` 디렉토리 + foundry.toml
- [x] `PredixScoreRegistry.sol` — commit / reveal / 인덱싱 / 헬퍼
- [x] 6개 단위 테스트 통과
- [x] DeployRegistry.s.sol 배포 스크립트

### Base Sepolia 배포
- [ ] 배포자 지갑 생성 (`cast wallet new`)
- [ ] Base Sepolia 테스트넷 ETH 받기 (Alchemy/Coinbase faucet)
- [ ] `contracts/.env` 에 `DEPLOYER_PRIVATE_KEY` 채우기
- [ ] `forge script ... --rpc-url base_sepolia --broadcast` 실행
- [ ] 배포된 주소를 `frontend/.env.local` 에 `NEXT_PUBLIC_PREDIX_REGISTRY_ADDRESS` 로 등록
- [ ] (옵션) Basescan verify

### 프론트 통합
- [ ] `src/lib/predix-onchain.ts` — viem 클라이언트, hash/marketRef 계산, commit/reveal 호출 래퍼
- [ ] `src/lib/predix-encrypt.ts` — 지갑 서명 → AES-GCM 키 파생 + plaintext encrypt/decrypt
- [ ] `paper_positions` 테이블 컬럼 추가: `wallet_address`, `commit_id`, `commit_tx_hash`, `salt`, `ciphertext`
- [ ] BetModal Save 흐름 변경:
  1. salt 생성
  2. plaintext = {market, outcome, stake, entryPrice, salt}
  3. ciphertext = AES-GCM(plaintext, walletKey)
  4. hash = keccak256(...)
  5. wallet 서명 → `commit(hash, marketRef, revealAfter)` tx
  6. tx confirm 후 `paper_positions` insert (ciphertext, commit_id, commit_tx_hash 포함)
- [ ] Reveal UI — 시장 종료 시점 도래한 commit 들 모아서 "Reveal" 버튼

---

## Phase 5 — Track Record / Leaderboard

- [ ] reveal 결과 인덱싱 (Supabase 또는 onchain event listener)
- [ ] 정답률 계산 — Polymarket 의 resolution 결과를 oracle/cron 으로 가져와서 매칭
- [ ] 프로필 페이지 — wallet_address 별 정답률, ROI, 대표 예측
- [ ] 글로벌 리더보드
- [ ] 시장별 "이 시장에 N명이 commit 했고 X명이 reveal" 통계

---

## Phase 6 — Mainnet & 본격화

- [ ] 컨트랙트 audit (간단 review, MVP 단계라 외부 audit 옵션)
- [ ] Base mainnet 배포 + verify
- [ ] Coinbase Paymaster 연결 (앱 등록 필요)
- [ ] mainnet 환경변수로 swap
- [ ] 운영 모니터링 (tx 실패율, gas 추세)

---

## 보강 옵션 (필요시 도입)

- [ ] **배치 커밋** — 서버가 N 개 EIP-712 서명을 모아 Merkle root 1 tx 로 commit (per-prediction 비용 1/N)
- [ ] **시장 resolution oracle** — UMA/Chainlink/자체 — Polymarket resolution 그대로 따라갈지 자체 검증할지 결정
- [ ] **Supabase Auth (Google OAuth)** — wallet 외 멀티 디바이스 동기화 필요해지면
- [ ] **다크 모드**
- [ ] **알림** — reveal 시점 도래, leaderboard 변화

---

## 참고 링크

- Polymarket Gamma API: https://gamma-api.polymarket.com
- Polymarket CLOB: https://clob.polymarket.com
- Base docs: https://docs.base.org
- Coinbase Smart Wallet: https://www.smartwallet.dev
- Base Sepolia faucet: https://www.alchemy.com/faucets/base-sepolia
- Foundry book: https://book.getfoundry.sh
