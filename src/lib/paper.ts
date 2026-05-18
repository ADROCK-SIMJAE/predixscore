import type { EventDetail } from "@/types/polymarket";

export const PAPER_SESSION_COOKIE = "predixscore-paper-session";

export type PaperPositionStatus = "pending" | "won" | "lost" | "voided";

export type PaperPositionRow = {
  id: string;
  guest_session_id: string;
  user_id: string | null;
  event_slug: string;
  event_title: string;
  market_slug: string;
  market_question: string;
  token_id: string;
  outcome_index: number;
  outcome_label: string;
  entry_price: number;
  stake_amount: number;
  shares: number;
  status: string;
  status_resolved: PaperPositionStatus;
  resolved_outcome_index: number | null;
  realized_pnl: number | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ChainCommitStatus = "none" | "committed" | "revealed" | "failed";

export type ChainCommitSummary = {
  id: string;
  status: ChainCommitStatus;
  txHash: string;
  revealTxHash: string | null;
  commitHash: string;
  walletAddress: string;
  chainId: number;
  contractAddress: string;
  blockNumber: number | null;
  revealAfter: string;
  commitId: string | null;
};

export type PaperPositionSummary = {
  id: string;
  eventSlug: string;
  eventTitle: string;
  marketSlug: string;
  marketQuestion: string;
  outcomeLabel: string;
  outcomeIndex: number;
  entryPrice: number;
  currentPrice: number | null;
  stakeAmount: number;
  shares: number;
  currentValue: number | null;
  pnlAmount: number | null;
  pnlPercent: number | null;
  status: PaperPositionStatus;
  resolvedOutcomeIndex: number | null;
  realizedPnl: number | null;
  settledAt: string | null;
  createdAt: string;
  chainCommit: ChainCommitSummary | null;
};

export function resolveCurrentPrice(event: EventDetail | null, tokenId: string, outcomeIndex: number) {
  if (!event) return null;
  for (const market of event.markets) {
    if (market.clobTokenIds[outcomeIndex] === tokenId) {
      return market.outcomePrices[outcomeIndex] ?? null;
    }
    const fallbackIndex = market.clobTokenIds.findIndex((entry) => entry === tokenId);
    if (fallbackIndex >= 0) {
      return market.outcomePrices[fallbackIndex] ?? null;
    }
  }
  return null;
}

export type BlockchainCommitRow = {
  id: string;
  paper_position_id: string;
  user_id: string;
  wallet_address: string;
  chain_id: number;
  contract_address: string;
  commit_id: string | number | null;
  commit_hash: string;
  market_ref: string;
  tx_hash: string;
  block_number: number | null;
  reveal_after: string;
  status: ChainCommitStatus;
  reveal_tx_hash: string | null;
  revealed_at: string | null;
  created_at: string;
  updated_at: string;
};

export function toChainCommitSummary(row: BlockchainCommitRow): ChainCommitSummary {
  return {
    id: row.id,
    status: row.status,
    txHash: row.tx_hash,
    revealTxHash: row.reveal_tx_hash,
    commitHash: row.commit_hash,
    walletAddress: row.wallet_address,
    chainId: row.chain_id,
    contractAddress: row.contract_address,
    blockNumber: row.block_number,
    revealAfter: row.reveal_after,
    commitId: row.commit_id !== null && row.commit_id !== undefined ? String(row.commit_id) : null,
  };
}

export function summarizePaperPosition(
  row: PaperPositionRow,
  event: EventDetail | null,
  chainCommit: BlockchainCommitRow | null = null,
): PaperPositionSummary {
  const isResolved = row.status_resolved === "won" || row.status_resolved === "lost";
  const currentPrice = isResolved
    ? row.status_resolved === "won"
      ? 1
      : 0
    : resolveCurrentPrice(event, row.token_id, row.outcome_index);
  const currentValue = currentPrice === null ? null : currentPrice * row.shares;
  const pnlAmount = isResolved
    ? row.realized_pnl
    : currentValue === null
      ? null
      : currentValue - row.stake_amount;
  const pnlPercent =
    pnlAmount === null || row.stake_amount <= 0 ? null : pnlAmount / row.stake_amount;

  return {
    id: row.id,
    eventSlug: row.event_slug,
    eventTitle: row.event_title,
    marketSlug: row.market_slug,
    marketQuestion: row.market_question,
    outcomeLabel: row.outcome_label,
    outcomeIndex: row.outcome_index,
    entryPrice: row.entry_price,
    currentPrice,
    stakeAmount: row.stake_amount,
    shares: row.shares,
    currentValue,
    pnlAmount,
    pnlPercent,
    status: row.status_resolved,
    resolvedOutcomeIndex: row.resolved_outcome_index,
    realizedPnl: row.realized_pnl,
    settledAt: row.settled_at,
    createdAt: row.created_at,
    chainCommit: chainCommit ? toChainCommitSummary(chainCommit) : null,
  };
}
