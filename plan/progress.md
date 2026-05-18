# Development Progress

> 마지막 갱신: 2026-05-18 KST

## 현재 트랙

- Track A+B 병행 (POC): 기존 Supabase paper trading 유지 + 블록체인 commit-reveal POC 추가

## 현재 단계

- Phase A1/A2 안정화
- Phase B (POC): 동기 commit-reveal 통합 — 버너 지갑 + PredixScoreRegistry on Base Sepolia

## 진행 상태

| 영역 | 상태 | 메모 |
|---|---|---|
| 문서 정리 | 완료 | 기준 문서 4개 + archive 구조로 정리 |
| Supabase migration 확인 | 부분 완료 | API/RPC 호출 기준 테이블/함수 존재 확인됨 |
| paper positions API | 부분 완료 | GET 정상, 비로그인 POST 401 정상, 서버 market/token/price 검증 추가 |
| settlement API | 부분 완료 | pending 없음 기준 POST 정상, service role 미설정이라 실제 정산 적용은 미검증 |
| stats/profile/leaderboard | 부분 완료 | stats/leaderboard API 정상, profile은 데이터 있는 계정으로 추가 검증 필요 |
| Bet UX guardrail | 부분 완료 | token/price/outcome/closed validation을 CTA, modal, 저장 API에 반영. 브라우저 클릭 QA 필요 |

## 이번 작업 목표

1. 현재 코드와 migration 상태를 점검한다. 완료
2. Phase A1에서 바로 막히는 부분을 찾는다. 완료
3. 가능한 경우 paper API end-to-end 검증까지 진행한다. 부분 완료
4. Bet UX guardrail을 반영한다. 완료

## 작업 로그

- 2026-05-13: `plan/` 진행판 생성.
- 2026-05-13: `npm run build` 통과. Tailwind arbitrary duration 경고와 Polymarket data cache 2MB 초과 경고 확인.
- 2026-05-13: `/api/paper/positions` GET 정상, 비로그인 POST 401 정상 확인.
- 2026-05-13: `/api/paper/stats`, `/api/leaderboard`, `/api/paper/settle` empty-case 정상 확인.
- 2026-05-13: `/api/polymarket/markets?limit=3` 정상 확인.
- 2026-05-13: BetModal과 MarketDetailClient에 unsupported market guardrail 추가.
- 2026-05-13: `POST /api/paper/positions`에 서버 측 Polymarket event/market/token/outcome/price 검증 추가.
- 2026-05-13: Tailwind duration 경고 제거.
- 2026-05-13: Polymarket home snapshot page size를 10으로 낮춰 Next data cache 2MB 초과 경고 제거.
- 2026-05-13: `npm run build` 경고 없이 통과.

## 다음 액션

- 로그인 세션으로 `POST /api/paper/positions` 실제 저장 검증
- 저장 후 positions/stats/home portfolio 숫자 일치 확인
- `SUPABASE_SERVICE_ROLE_KEY` 설정 후 settlement 실제 적용 검증
- 브라우저에서 unsupported market CTA disabled 상태 확인

## POC: 블록체인 commit-reveal (2026-05-18 추가)

블록체인 기술은 blockpick (ethers v6 + IndexedDB 버너 지갑 + ECDSA secp256k1)을 참고.
스마트 컨트랙트 호출은 **동기** — 페이퍼 포지션 저장 직후 같은 흐름에서 `commit()` 트랜잭션을 await 한다.

### 배포 (Ronin Mainnet, chain 2020)

| 컨트랙트 | 주소 | 비고 |
|---|---|---|
| `PredixScoreRegistry` | `0x21d60B982Fd076C3aAD668e2FC8E9C9A220547b6` | 2026-05-18 배포, 21 gwei * ~530k gas ≈ 0.013 RON |

배포자: `0xa4385a0d6D76c213d1D3B6CD390aD477ee7EAb84`

프론트엔드 `.env.local`:

```
NEXT_PUBLIC_PREDIX_CHAIN_ID=2020
NEXT_PUBLIC_PREDIX_RPC_URL=https://api.roninchain.com/rpc
NEXT_PUBLIC_PREDIX_REGISTRY_ADDRESS=0x21d60B982Fd076C3aAD668e2FC8E9C9A220547b6
```

### 추가된 파일

- `supabase/migrations/0003_blockchain_commits.sql` — `blockchain_commits`, `user_wallets` 테이블 + RPC
- `src/lib/blockchain/config.ts` — Base Sepolia 기본 (NEXT_PUBLIC_PREDIX_* 환경변수로 오버라이드)
- `src/lib/blockchain/hash.ts` — 컨트랙트와 동일한 `keccak256(abi.encode(...))` 해시 계산
- `src/lib/blockchain/registry-abi.ts` — `PredixScoreRegistry` ABI subset
- `src/lib/blockchain/wallet.ts` — 버너 지갑 생성/암호화/IndexedDB 저장 (blockpick 패턴)
- `src/lib/blockchain/registry.ts` — `commit()` / `reveal()` 동기 호출 + 페이로드 암호화
- `src/components/providers/WalletProvider.tsx` — 지갑 컨텍스트 (auto-create / unlock)
- `src/app/api/blockchain/commits/route.ts` — 커밋 메타데이터 저장 (GET / POST)
- `src/app/api/blockchain/reveals/route.ts` — reveal tx hash 기록

### 변경된 파일

- `src/components/markets/BetModal.tsx` — 지갑 비밀번호 입력 + 페이퍼 저장 → 온체인 commit 동기 실행
- `src/components/portfolio/PositionsList.tsx` — `committed` / `revealed` / `failed` 배지 표시
- `src/lib/paper.ts` — `PaperPositionSummary.chainCommit` 필드 추가
- `src/app/api/paper/positions/route.ts` — GET 응답에 chain commit join
- `package.json` — `ethers@^6.15.0` 추가
- `messages/{en,ko}.json` — 지갑/체인 관련 카피 추가
- `.env.example` — `NEXT_PUBLIC_PREDIX_*` 추가

### POC 가정 / 한계

- 가스 대납 없음. 유저는 본인 버너 지갑에 Sepolia ETH를 직접 충전해야 한다.
- `encryptedPayload`는 JSON 평문(`registry.encryptReveal Payload`) — 추후 wallet 패스워드 기반 AES-GCM 으로 교체.
- Reveal UI는 아직 없음. 컨트랙트와 API endpoint만 준비. 다음 사이클에서 PositionsList에 Reveal CTA 추가.
- 컨트랙트 주소(`NEXT_PUBLIC_PREDIX_REGISTRY_ADDRESS`)가 비어 있으면 BetModal은 onchain 단계를 자동으로 스킵한다.
