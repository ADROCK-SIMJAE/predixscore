// Client-side helpers (no signing, no tx submission).
// Hash computation matches contracts/src/PredixScoreRegistry.sol.

import { computeCommitHash, computeMarketRef, generateSalt } from "./hash";
import { getChainConfig } from "./config";

export type PreparedCommit = {
  user: `0x${string}`;
  marketRef: `0x${string}`;
  commitHash: `0x${string}`;
  salt: `0x${string}`;
  revealAfterUnix: number;
  eventSlug: string;
  marketSlug: string;
  outcomeIndex: number;
  stakeAmount: number;
  entryPrice: number;
};

export function prepareCommit(input: {
  user: `0x${string}`;
  eventSlug: string;
  marketSlug: string;
  outcomeIndex: number;
  stakeAmount: number;
  entryPrice: number;
  revealAfterUnix: number;
}): PreparedCommit {
  const marketRef = computeMarketRef(input.eventSlug, input.marketSlug);
  const salt = generateSalt();
  const commitHash = computeCommitHash({
    user: input.user,
    marketRef,
    outcomeIndex: input.outcomeIndex,
    stakeAmount: input.stakeAmount,
    entryPrice: input.entryPrice,
    salt,
  });
  return {
    user: input.user,
    marketRef,
    commitHash,
    salt,
    revealAfterUnix: input.revealAfterUnix,
    eventSlug: input.eventSlug,
    marketSlug: input.marketSlug,
    outcomeIndex: input.outcomeIndex,
    stakeAmount: input.stakeAmount,
    entryPrice: input.entryPrice,
  };
}

// JSON payload kept until reveal time. POC: plaintext.
// Productionize with AES-GCM keyed by user's wallet password before persisting.
export function encryptRevealPayload(payload: {
  outcomeIndex: number;
  stakeAmount: number;
  entryPrice: number;
  salt: `0x${string}`;
  commitId: string | null;
}): string {
  return JSON.stringify(payload);
}

export function decryptRevealPayload(blob: string) {
  try {
    return JSON.parse(blob) as {
      outcomeIndex: number;
      stakeAmount: number;
      entryPrice: number;
      salt: `0x${string}`;
      commitId: string | null;
    };
  } catch {
    return null;
  }
}

export function explorerTxUrl(txHash: string): string {
  const cfg = getChainConfig();
  return `${cfg.explorerUrl}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string): string {
  const cfg = getChainConfig();
  return `${cfg.explorerUrl}/address/${address}`;
}
