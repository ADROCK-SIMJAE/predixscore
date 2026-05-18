// Client wrapper around PredixScoreRegistry. Synchronous (await tx receipt).
// POC — user pays own gas with their burner wallet. No paymaster.

import { Contract, type ContractTransactionReceipt, type Log, type Wallet } from "ethers";
import { getChainConfig } from "./config";
import { computeCommitHash, computeMarketRef, generateSalt, toScaledPrice, toScaledStake } from "./hash";
import { PREDIX_SCORE_REGISTRY_ABI } from "./registry-abi";

export type CommitInput = {
  eventSlug: string;
  marketSlug: string;
  outcomeIndex: number;
  stakeAmount: number;
  entryPrice: number;
  revealAfterUnix: number; // seconds since epoch — Polymarket endDate
};

export type CommitResult = {
  commitId: bigint | null;
  commitHash: `0x${string}`;
  marketRef: `0x${string}`;
  salt: `0x${string}`;
  txHash: `0x${string}`;
  blockNumber: number | null;
  contractAddress: `0x${string}`;
  chainId: number;
  walletAddress: `0x${string}`;
  revealAfterUnix: number;
};

export type RevealInput = {
  commitId: bigint;
  outcomeIndex: number;
  stakeAmount: number;
  entryPrice: number;
  salt: `0x${string}`;
};

export type RevealResult = {
  txHash: `0x${string}`;
  blockNumber: number | null;
};

function getRegistry(signer: Wallet) {
  const cfg = getChainConfig();
  return {
    cfg,
    contract: new Contract(cfg.registryAddress, PREDIX_SCORE_REGISTRY_ABI, signer),
  };
}

function parseCommitIdFromReceipt(
  receipt: ContractTransactionReceipt | null,
  contract: Contract,
): bigint | null {
  if (!receipt) return null;
  for (const log of receipt.logs as Log[]) {
    try {
      const parsed = contract.interface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed?.name === "Committed") {
        return BigInt(parsed.args[0]);
      }
    } catch {
      // not our log
    }
  }
  return null;
}

export async function commitPrediction(
  signer: Wallet,
  input: CommitInput,
): Promise<CommitResult> {
  const { cfg, contract } = getRegistry(signer);
  const marketRef = computeMarketRef(input.eventSlug, input.marketSlug);
  const salt = generateSalt();
  const walletAddress = (await signer.getAddress()) as `0x${string}`;
  const commitHash = computeCommitHash({
    user: walletAddress,
    marketRef,
    outcomeIndex: input.outcomeIndex,
    stakeAmount: input.stakeAmount,
    entryPrice: input.entryPrice,
    salt,
  });

  const tx = await contract.commit(commitHash, marketRef, BigInt(input.revealAfterUnix));
  const receipt = await tx.wait();
  const commitId = parseCommitIdFromReceipt(receipt, contract);

  return {
    commitId,
    commitHash,
    marketRef,
    salt,
    txHash: tx.hash as `0x${string}`,
    blockNumber: receipt?.blockNumber ?? null,
    contractAddress: cfg.registryAddress as `0x${string}`,
    chainId: cfg.chainId,
    walletAddress,
    revealAfterUnix: input.revealAfterUnix,
  };
}

export async function revealPrediction(
  signer: Wallet,
  input: RevealInput,
): Promise<RevealResult> {
  const { contract } = getRegistry(signer);
  const tx = await contract.reveal(
    input.commitId,
    input.outcomeIndex,
    toScaledStake(input.stakeAmount),
    toScaledPrice(input.entryPrice),
    input.salt,
  );
  const receipt = await tx.wait();
  return {
    txHash: tx.hash as `0x${string}`,
    blockNumber: receipt?.blockNumber ?? null,
  };
}

// Encrypt the reveal-time payload (salt + plaintext) so the server can never
// learn the prediction before reveal. Keyed by wallet password (the same
// password used to unlock the burner).
export function encryptRevealPayload(payload: {
  outcomeIndex: number;
  stakeAmount: number;
  entryPrice: number;
  salt: `0x${string}`;
  commitId: string | null;
}): string {
  // POC: JSON in plaintext for now. Wallet password gating happens in wallet.ts.
  // When productionizing, wrap with AES-GCM using a key derived from the password.
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
