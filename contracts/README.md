# PredixScore Contracts

PredixScore 의 onchain 예측 기록 컨트랙트. Base 에 배포.

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

## 배포 — Base Sepolia (testnet)

테스트넷 ETH 받기: https://www.alchemy.com/faucets/base-sepolia

```bash
source .env
forge script script/DeployRegistry.s.sol:DeployRegistry \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv
```

배포 주소가 콘솔에 출력됨. `frontend` 의 `.env.local` 에 다음 추가:

```
NEXT_PUBLIC_PREDIX_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_PREDIX_CHAIN_ID=84532
```

## 배포 — Base Mainnet

```bash
forge script script/DeployRegistry.s.sol:DeployRegistry \
  --rpc-url base_mainnet \
  --broadcast \
  --verify \
  -vvvv
```

`NEXT_PUBLIC_PREDIX_CHAIN_ID=8453` 로 변경.

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

## 가스 예상 (Base mainnet 기준, 1 gwei 가정)

- `commit`: ~70k gas ≈ $0.0002
- `reveal`: ~85k gas ≈ $0.00025
- Coinbase Paymaster 활성 시 → 무료 (월 한도 내)

## 보안 노트

- 컨트랙트는 자금을 보유하지 않음 — paper trading 만 기록
- Reveal 강제 메커니즘 없음 — 유저가 의도적으로 reveal 안 하면 그 commit 은 영원히 비공개. 정답률 계산에선 미reveal 은 제외
- Salt 분실 시 reveal 불가능 → 클라이언트는 salt 를 안전하게 저장 (encrypted ciphertext in Supabase)
