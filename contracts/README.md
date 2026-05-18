# PredixScore Contracts

PredixScore 의 onchain 예측 기록 컨트랙트. **Ronin Mainnet 배포 완료** (blockpick 패턴 — chain 2020, legacy gas).

## 배포 주소 (Ronin Mainnet — chain 2020)

| 컨트랙트 | 주소 |
|---|---|
| `PredixScoreRegistry` | [`0x21d60B982Fd076C3aAD668e2FC8E9C9A220547b6`](https://app.roninchain.com/address/0x21d60B982Fd076C3aAD668e2FC8E9C9A220547b6) |

프론트엔드 `.env.local`에 다음 추가:

```
NEXT_PUBLIC_PREDIX_CHAIN_ID=2020
NEXT_PUBLIC_PREDIX_RPC_URL=https://api.roninchain.com/rpc
NEXT_PUBLIC_PREDIX_REGISTRY_ADDRESS=0x21d60B982Fd076C3aAD668e2FC8E9C9A220547b6
```

## 핵심 컨트랙트

- `PredixScoreRegistry` — commit-reveal 방식의 예측 기록기
  - `commit(hash, marketRef, revealAfter)` — 시장 종료 전 해시만 기록
  - `reveal(id, outcome, stake, price, salt)` — 시장 종료 후 평문 공개 + 검증

## 셋업

### 1. Foundry 설치

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. 의존성 설치

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
```

### 3. 환경변수

```bash
cp .env.example .env
# DEPLOYER_PRIVATE_KEY 채우기 (mainnet 키 절대 금지 — 테스트넷 전용 키)
```

### 4. 빌드 + 테스트

```bash
forge build
forge test -vvv
```

## 배포 — Ronin Mainnet (chain 2020, 이미 배포됨)

Ronin은 EIP-1559 미지원 → `--legacy` 필수. blockpick `BlockchainConfig.kt` 동일 패턴.

```bash
source .env
forge script script/DeployRegistry.s.sol:DeployRegistry \
  --rpc-url ronin \
  --legacy \
  --broadcast \
  --slow \
  -vvvv
```

가스 모델: 21 gwei * ~530k = ~0.011 RON 배포 비용. `commit()` 약 70k gas → 0.0015 RON, `reveal()` 약 85k gas → 0.0018 RON.

## 배포 — Ronin Saigon (testnet, chain 2021)

Saigon faucet: https://faucet.roninchain.com/

```bash
forge script script/DeployRegistry.s.sol:DeployRegistry \
  --rpc-url ronin_saigon \
  --legacy \
  --broadcast \
  -vvvv
```

`NEXT_PUBLIC_PREDIX_CHAIN_ID=2021` 로 변경.

## 데이터 모델

### Commit hash 계산 규칙 (offchain 에서 동일하게)

```
hash = keccak256(abi.encode(
  address user,
  bytes32 marketRef,
  uint8   outcomeIndex,    // 0 = Yes, 1 = No
  uint128 stakeAmount,     // USD * 1e6 (USDC convention)
  uint128 entryPrice,      // 확률 * 1e18 (0..1e18)
  bytes32 salt             // 클라이언트 랜덤
))
```

```
marketRef = keccak256(abi.encode(string eventSlug, string marketSlug))
```

JS/TS 측 `viem` 으로 동일하게 계산:

```ts
import { encodeAbiParameters, keccak256, parseAbiParameters } from 'viem'

const marketRef = keccak256(
  encodeAbiParameters(parseAbiParameters('string, string'), [eventSlug, marketSlug])
)

const hash = keccak256(
  encodeAbiParameters(
    parseAbiParameters('address, bytes32, uint8, uint128, uint128, bytes32'),
    [user, marketRef, outcomeIndex, stakeAmount, entryPrice, salt],
  ),
)
```

### Reveal 시점

`revealAfter` = 시장 resolution 시각. Polymarket 이벤트의 `endDate` 그대로 사용 가능.

## 가스 예상 (Ronin Mainnet, 20 gwei 기준)

- `commit`: ~70k gas ≈ 0.0014 RON
- `reveal`: ~85k gas ≈ 0.0017 RON
- 배포(deploy): ~530k gas ≈ 0.011 RON
- 가스 대납이 필요하면 blockpick의 `BlockchainTransactionServiceImpl` 패턴 참고 (API 서버가 user 주소로 대신 서명).

## 보안 노트

- 컨트랙트는 자금을 보유하지 않음 — paper trading 만 기록
- Reveal 강제 메커니즘 없음 — 유저가 의도적으로 reveal 안 하면 그 commit 은 영원히 비공개. 정답률 계산에선 미reveal 은 제외
- Salt 분실 시 reveal 불가능 → 클라이언트는 salt 를 안전하게 저장 (encrypted ciphertext in Supabase)
