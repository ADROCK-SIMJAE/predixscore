// Server-only. Sponsor wallet pays gas, calls PredixScoreRegistry on behalf of users.
// Ronin uses legacy gas (no EIP-1559) — ethers v6 falls back automatically when
// the RPC reports no baseFeePerGas, but we set it explicitly to be safe.

import "server-only";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  type ContractTransactionReceipt,
  type Log,
} from "ethers";
import { getChainConfig, isRegistryConfigured } from "./config";
import { toScaledPrice, toScaledStake } from "./hash";
import { PREDIX_SCORE_REGISTRY_ABI } from "./registry-abi";

export type SponsorCommitInput = {
  user: `0x${string}`;
  commitHash: `0x${string}`;
  marketRef: `0x${string}`;
  revealAfterUnix: number;
};

export type SponsorCommitResult = {
  commitId: string | null;
  txHash: `0x${string}`;
  blockNumber: number | null;
  sponsorAddress: `0x${string}`;
};

export type SponsorRevealInput = {
  commitId: bigint;
  outcomeIndex: number;
  stakeAmount: number;
  entryPrice: number;
  salt: `0x${string}`;
};

export type SponsorRevealResult = {
  txHash: `0x${string}`;
  blockNumber: number | null;
};

let cachedSponsor: { signer: Wallet; contract: Contract } | null = null;

export function isSponsorConfigured(): boolean {
  return isRegistryConfigured() && !!process.env.PREDIX_SPONSOR_PRIVATE_KEY;
}

function getSponsor() {
  if (cachedSponsor) return cachedSponsor;
  const key = process.env.PREDIX_SPONSOR_PRIVATE_KEY;
  if (!key) throw new Error("PREDIX_SPONSOR_PRIVATE_KEY is not set.");
  const cfg = getChainConfig();
  if (!isRegistryConfigured()) {
    throw new Error("NEXT_PUBLIC_PREDIX_REGISTRY_ADDRESS is not set.");
  }
  const provider = new JsonRpcProvider(cfg.rpcUrl, cfg.chainId);
  const signer = new Wallet(key, provider);
  const contract = new Contract(cfg.registryAddress, PREDIX_SCORE_REGISTRY_ABI, signer);
  cachedSponsor = { signer, contract };
  return cachedSponsor;
}

function parseCommitId(receipt: ContractTransactionReceipt | null, contract: Contract): string | null {
  if (!receipt) return null;
  for (const log of receipt.logs as Log[]) {
    try {
      const parsed = contract.interface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed?.name === "Committed") {
        return parsed.args[0].toString();
      }
    } catch {
      // not our log
    }
  }
  return null;
}

export async function sponsorCommit(input: SponsorCommitInput): Promise<SponsorCommitResult> {
  const { signer, contract } = getSponsor();
  const sponsorAddress = (await signer.getAddress()) as `0x${string}`;
  // Legacy gas — Ronin defaults to ~20 gwei; ethers will read from RPC.
  const tx = await contract.commit(
    input.user,
    input.commitHash,
    input.marketRef,
    BigInt(input.revealAfterUnix),
  );
  const receipt = await tx.wait();
  return {
    commitId: parseCommitId(receipt, contract),
    txHash: tx.hash as `0x${string}`,
    blockNumber: receipt?.blockNumber ?? null,
    sponsorAddress,
  };
}

export async function sponsorReveal(input: SponsorRevealInput): Promise<SponsorRevealResult> {
  const { contract } = getSponsor();
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
