// Hash helpers matching contracts/src/PredixScoreRegistry.sol.
// Keeping this in one place lets frontend / API / Foundry tests stay in sync.

import { AbiCoder, keccak256, randomBytes, hexlify } from "ethers";
import { PRICE_SCALE, STAKE_SCALE } from "./config";

const abi = AbiCoder.defaultAbiCoder();

export function computeMarketRef(eventSlug: string, marketSlug: string): `0x${string}` {
  return keccak256(abi.encode(["string", "string"], [eventSlug, marketSlug])) as `0x${string}`;
}

export type PredictionPayload = {
  user: string;
  marketRef: `0x${string}`;
  outcomeIndex: number;
  stakeAmount: number; // human-readable USD (e.g. 25)
  entryPrice: number; // 0..1
  salt: `0x${string}`;
};

export function toScaledStake(stakeAmount: number): bigint {
  return BigInt(Math.round(stakeAmount * Number(STAKE_SCALE)));
}

export function toScaledPrice(entryPrice: number): bigint {
  // multiply through Number then to BigInt; keep precision via toFixed.
  return BigInt(Math.round(entryPrice * Number(PRICE_SCALE)));
}

export function computeCommitHash(payload: PredictionPayload): `0x${string}` {
  const stake = toScaledStake(payload.stakeAmount);
  const price = toScaledPrice(payload.entryPrice);
  return keccak256(
    abi.encode(
      ["address", "bytes32", "uint8", "uint128", "uint128", "bytes32"],
      [payload.user, payload.marketRef, payload.outcomeIndex, stake, price, payload.salt],
    ),
  ) as `0x${string}`;
}

export function generateSalt(): `0x${string}` {
  return hexlify(randomBytes(32)) as `0x${string}`;
}
