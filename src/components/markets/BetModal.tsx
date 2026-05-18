"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clamp, formatCurrency, formatPercent } from "@/lib/format";
import type { MarketSnapshot } from "@/types/polymarket";
import { useWallet } from "@/components/providers/WalletProvider";
import { commitPrediction, encryptRevealPayload } from "@/lib/blockchain/registry";

type BetModalProps = {
  open: boolean;
  onClose: () => void;
  market: MarketSnapshot;
  eventSlug: string;
  eventTitle: string;
  initialOutcomeIndex?: number;
  paperTradingConfigured: boolean;
  onSuccess?: () => void;
};

const STAKE_PRESETS = [10, 25, 100, 500];

// Default reveal-after if market.endDate is missing or invalid: 7 days out.
function resolveRevealAfterUnix(endDate: string | null): number {
  if (endDate) {
    const ts = Math.floor(new Date(endDate).getTime() / 1000);
    if (Number.isFinite(ts) && ts > Math.floor(Date.now() / 1000)) {
      return ts;
    }
  }
  return Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
}

function getOutcomeAvailability(market: MarketSnapshot, outcomeIndex: number) {
  const rawPrice = market.outcomePrices[outcomeIndex];
  const tokenId = market.clobTokenIds[outcomeIndex] ?? "";
  const outcomeLabel = market.outcomes[outcomeIndex] ?? "";
  const validPrice = Number.isFinite(rawPrice) && rawPrice > 0 && rawPrice <= 1;

  return {
    outcomeLabel,
    tokenId,
    price: validPrice ? rawPrice : 0,
    available:
      market.active &&
      !market.closed &&
      Boolean(outcomeLabel) &&
      Boolean(tokenId) &&
      validPrice,
    reason: !market.active || market.closed
      ? "marketClosed"
      : !outcomeLabel
        ? "outcomeUnavailable"
        : !tokenId
          ? "tokenUnavailable"
          : !validPrice
            ? "priceUnavailable"
            : null,
  };
}

export function BetModal({
  open,
  onClose,
  market,
  eventSlug,
  eventTitle,
  initialOutcomeIndex = 0,
  paperTradingConfigured,
  onSuccess,
}: BetModalProps) {
  const t = useTranslations("betModal");
  const wallet = useWallet();

  const [outcomeIndex, setOutcomeIndex] = useState(initialOutcomeIndex);
  const [stake, setStake] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState<number>(10000);
  const [walletPassword, setWalletPassword] = useState("");
  const [chainStep, setChainStep] = useState<"idle" | "saving" | "signing" | "confirming" | "done">("idle");

  useEffect(() => {
    if (open) {
      setOutcomeIndex(initialOutcomeIndex);
      setStake("");
      setWalletPassword("");
      setChainStep("idle");
      fetch("/api/paper/stats")
        .then((r) => r.json())
        .then((d) => setAvailableBalance(d.stats?.availableBalance ?? 10000))
        .catch(() => {});
    }
  }, [open, initialOutcomeIndex, market.id]);

  const outcomeAvailability = getOutcomeAvailability(market, outcomeIndex);
  const livePrice = clamp(outcomeAvailability.price, 0, 1);
  const outcomeLabel = outcomeAvailability.outcomeLabel || "Yes";
  const tokenId = outcomeAvailability.tokenId;
  const numericStake = Number(stake);
  const validStake = Number.isFinite(numericStake) && numericStake > 0;
  const sufficientBalance = numericStake <= availableBalance + 0.0001;
  const shares = livePrice > 0 && validStake ? numericStake / livePrice : 0;
  const profit = shares - numericStake;
  const canSubmit =
    validStake &&
    sufficientBalance &&
    outcomeAvailability.available &&
    paperTradingConfigured &&
    !submitting;

  const yesPercent = Math.round((market.outcomePrices[0] ?? 0) * 100);
  const noPercent = Math.round((market.outcomePrices[1] ?? 0) * 100);

  const presetCards = useMemo(
    () =>
      STAKE_PRESETS.map((preset) => ({
        amount: preset,
        profit: livePrice > 0 ? preset / livePrice - preset : 0,
      })),
    [livePrice],
  );

  async function submit() {
    if (!canSubmit) return;
    if (wallet.configured && !walletPassword) {
      toast.error(t("walletPasswordRequired"));
      return;
    }
    setSubmitting(true);
    setChainStep("saving");

    try {
      const response = await fetch("/api/paper/positions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventSlug,
          eventTitle,
          marketSlug: market.marketSlug,
          marketQuestion: market.question,
          tokenId,
          outcomeIndex,
          outcomeLabel,
          entryPrice: livePrice,
          stakeAmount: numericStake,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const tone = response.status === 501 ? "warning" : "error";
        const message = data.error ?? t("saveFail");
        if (tone === "warning") {
          toast.warning(message);
        } else {
          toast.error(message);
        }
        return;
      }

      const savedPrice =
        typeof data.position?.entryPrice === "number" ? data.position.entryPrice : livePrice;
      const paperPositionId = data.position?.id as string | undefined;

      // Chain commit — sync, after paper position created.
      if (wallet.configured && paperPositionId) {
        try {
          setChainStep("signing");
          const info = await wallet.ensureWallet(walletPassword);
          const signer = wallet.getSigner();
          if (!signer) throw new Error("Wallet signer unavailable.");

          setChainStep("confirming");
          const revealAfterUnix = resolveRevealAfterUnix(market.endDate);
          const commitResult = await commitPrediction(signer, {
            eventSlug,
            marketSlug: market.marketSlug,
            outcomeIndex,
            stakeAmount: numericStake,
            entryPrice: savedPrice,
            revealAfterUnix,
          });

          const encryptedPayload = encryptRevealPayload({
            outcomeIndex,
            stakeAmount: numericStake,
            entryPrice: savedPrice,
            salt: commitResult.salt,
            commitId: commitResult.commitId !== null ? commitResult.commitId.toString() : null,
          });

          await fetch("/api/blockchain/commits", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              paperPositionId,
              walletAddress: info.address,
              chainId: commitResult.chainId,
              contractAddress: commitResult.contractAddress,
              commitId: commitResult.commitId !== null ? commitResult.commitId.toString() : null,
              commitHash: commitResult.commitHash,
              marketRef: commitResult.marketRef,
              txHash: commitResult.txHash,
              blockNumber: commitResult.blockNumber,
              revealAfterUnix: commitResult.revealAfterUnix,
              encryptedPayload,
            }),
          });

          setChainStep("done");
          toast.success(
            t("chainCommitSuccess", {
              outcome: outcomeLabel,
              tx: commitResult.txHash.slice(0, 10) + "…",
            }),
          );
        } catch (chainError) {
          toast.warning(
            chainError instanceof Error
              ? t("chainCommitFail", { message: chainError.message })
              : t("chainCommitFail", { message: "unknown" }),
          );
        }
      } else if (!wallet.configured) {
        toast.success(
          t("saveSuccess", {
            outcome: outcomeLabel,
            price: Math.round(savedPrice * 100),
            amount: formatCurrency(numericStake),
          }),
        );
      } else {
        toast.success(
          t("saveSuccess", {
            outcome: outcomeLabel,
            price: Math.round(savedPrice * 100),
            amount: formatCurrency(numericStake),
          }),
        );
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveFail"));
    } finally {
      setSubmitting(false);
    }
  }

  const chainProgressLabel =
    chainStep === "saving"
      ? t("savingPaper")
      : chainStep === "signing"
        ? t("walletSigning")
        : chainStep === "confirming"
          ? t("chainConfirming")
          : null;

  const submitLabel = submitting
    ? chainProgressLabel ?? t("saving")
    : outcomeAvailability.reason
      ? t(outcomeAvailability.reason)
    : !validStake
      ? t("enterStake")
      : !sufficientBalance
        ? t("insufficientBalance")
        : t("predictCta", { outcome: outcomeLabel, amount: formatCurrency(numericStake) });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="grid gap-4 p-6">
        <DialogHeader>
          <span className="text-muted text-[12px] tracking-[0.14em] uppercase">{t("eyebrow")}</span>
          <DialogTitle>{market.question}</DialogTitle>
        </DialogHeader>

        {/* Yes/No toggle */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            className={`px-4 py-3.5 rounded-[12px] border-2 cursor-pointer grid gap-1 text-left bg-white/70 transition-all duration-160 active:scale-[0.98] will-change-transform ${
              outcomeIndex === 0
                ? "bg-gradient-to-b from-[rgba(15,169,104,0.18)] to-[rgba(15,169,104,0.04)] border-[rgba(15,169,104,0.5)] text-[#0e6d44]"
                : "border-transparent"
            }`}
            onClick={() => setOutcomeIndex(0)}
          >
            <span className={`text-[13px] uppercase tracking-[0.06em] font-semibold ${outcomeIndex === 0 ? "text-[#0e6d44]" : "text-muted"}`}>Yes</span>
            <strong className={`text-[30px] tracking-[-0.03em] tabular-nums ${outcomeIndex === 0 ? "text-[#0e6d44]" : ""}`}>{yesPercent}%</strong>
            <em className={`not-italic text-[12px] ${outcomeIndex === 0 ? "text-[#0e6d44]" : "text-muted"}`}>
              {t("yesChance", { percent: formatPercent(market.outcomePrices[0] ?? 0) })}
            </em>
          </button>
          {market.outcomes[1] ? (
            <button
              type="button"
              className={`px-4 py-3.5 rounded-[12px] border-2 cursor-pointer grid gap-1 text-left bg-white/70 transition-all duration-160 active:scale-[0.98] will-change-transform ${
                outcomeIndex === 1
                  ? "bg-gradient-to-b from-[rgba(239,91,97,0.18)] to-[rgba(239,91,97,0.04)] border-[rgba(239,91,97,0.5)] text-[#b13036]"
                  : "border-transparent"
              }`}
              onClick={() => setOutcomeIndex(1)}
            >
              <span className={`text-[13px] uppercase tracking-[0.06em] font-semibold ${outcomeIndex === 1 ? "text-[#b13036]" : "text-muted"}`}>No</span>
              <strong className={`text-[30px] tracking-[-0.03em] tabular-nums ${outcomeIndex === 1 ? "text-[#b13036]" : ""}`}>{noPercent}%</strong>
              <em className={`not-italic text-[12px] ${outcomeIndex === 1 ? "text-[#b13036]" : "text-muted"}`}>
                {t("noChance", { percent: formatPercent(market.outcomePrices[1] ?? 0) })}
              </em>
            </button>
          ) : null}
        </div>

        {/* Stake input section */}
        <div className="grid gap-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[12px] uppercase tracking-[0.08em] text-muted font-semibold">{t("stakeLabel")}</label>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(15,169,104,0.10)] text-[#0e6d44] text-[12px] font-semibold tabular-nums">
              <Wallet size={12} />
              {formatCurrency(availableBalance)} {t("available")}
            </span>
          </div>
          <div className={`flex items-center gap-2 px-[18px] py-3.5 rounded-[16px] bg-white/[0.85] border transition-colors duration-160 ${!sufficientBalance && validStake ? "border-[rgba(239,91,97,0.4)] bg-[rgba(239,91,97,0.04)]" : "border-ink/[0.08]"}`}>
            <span className="text-muted text-[22px] font-semibold mr-1">$</span>
            <input
              className="flex-1 border-none bg-transparent outline-none text-[28px] font-semibold tracking-[-0.02em] text-ink tabular-nums"
              value={stake}
              onChange={(event) => setStake(event.target.value.replace(/[^\d.]/g, ""))}
              placeholder={t("stakePlaceholder")}
              inputMode="decimal"
              autoFocus
            />
            <span className="text-[13px] text-muted font-semibold tracking-[0.06em]">{t("currency")}</span>
          </div>
          {/* Presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {presetCards.map((preset) => (
              <button
                key={preset.amount}
                type="button"
                className={`py-2.5 rounded-[12px] border font-semibold text-[14px] cursor-pointer transition-all duration-160 tabular-nums will-change-transform active:scale-[0.98] disabled:opacity-40 ${
                  numericStake === preset.amount
                    ? "bg-gradient-to-b from-[rgba(15,109,255,0.16)] to-[rgba(15,109,255,0.04)] border-[rgba(15,109,255,0.5)] text-[#0a3d8f]"
                    : "bg-white/60 border-ink/[0.08] text-ink hover:bg-[rgba(15,109,255,0.06)] hover:border-[rgba(15,109,255,0.32)]"
                }`}
                onClick={() => setStake(String(preset.amount))}
                disabled={preset.amount > availableBalance}
              >
                ${preset.amount}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-2 p-[14px_16px] rounded-[14px] bg-accent/[0.04] border border-accent/[0.10]">
          <div className="grid gap-0.5">
            <span className="text-[11px] text-muted uppercase tracking-[0.06em]">{t("summaryAvgPrice")}</span>
            <strong className="text-[16px] tabular-nums tracking-[-0.01em]">{Math.round(livePrice * 100)}%</strong>
          </div>
          <div className="grid gap-0.5">
            <span className="text-[11px] text-muted uppercase tracking-[0.06em]">{t("summaryShares")}</span>
            <strong className="text-[16px] tabular-nums tracking-[-0.01em]">{shares > 0 ? shares.toFixed(2) : "—"}</strong>
          </div>
          <div className="grid gap-0.5">
            <span className="text-[11px] text-muted uppercase tracking-[0.06em]">{t("summaryPayoutIf", { outcome: outcomeLabel })}</span>
            <strong className="text-[16px] tabular-nums tracking-[-0.01em]">{shares > 0 ? formatCurrency(shares) : "—"}</strong>
          </div>
          <div className="grid gap-0.5">
            <span className="text-[11px] text-muted uppercase tracking-[0.06em]">{t("summaryProfitIf", { outcome: outcomeLabel })}</span>
            <strong className={`text-[16px] tabular-nums tracking-[-0.01em] ${profit > 0 ? "text-positive-text" : ""}`}>
              {profit > 0 ? `+${formatCurrency(profit)}` : "—"}
            </strong>
          </div>
        </div>

        {!paperTradingConfigured ? (
          <div className="px-4 py-3.5 rounded-[14px] text-[14px] leading-[1.5] bg-[rgba(244,173,66,0.16)] text-[#91590b]">{t("storageWarning")}</div>
        ) : null}

        {outcomeAvailability.reason ? (
          <div className="px-4 py-3.5 rounded-[14px] text-[14px] leading-[1.5] bg-[rgba(244,173,66,0.16)] text-[#91590b]">
            {t("unsupportedWarning", { reason: t(outcomeAvailability.reason) })}
          </div>
        ) : null}

        {wallet.configured ? (
          <div className="grid gap-2 px-4 py-3.5 rounded-[14px] bg-[rgba(15,109,255,0.06)] border border-[rgba(15,109,255,0.18)]">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#0a3d8f]">
              <ShieldCheck size={14} />
              <span>
                {wallet.hasLocalWallet
                  ? t("walletLockedHint", { chain: wallet.chainName })
                  : t("walletCreateHint", { chain: wallet.chainName })}
              </span>
            </div>
            {wallet.address ? (
              <span className="text-[11px] text-muted tabular-nums">
                {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
              </span>
            ) : null}
            <input
              type="password"
              className="px-3 py-2 rounded-[10px] border border-ink/[0.12] bg-white/80 text-[14px] outline-none focus:border-[rgba(15,109,255,0.4)]"
              placeholder={t("walletPasswordPlaceholder")}
              value={walletPassword}
              onChange={(event) => setWalletPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
        ) : null}

        <button
          type="button"
          className={`w-full py-3.5 rounded-[8px] border-none cursor-pointer font-bold text-[15px] tracking-[-0.01em] text-white transition-colors duration-160 tabular-nums disabled:bg-ink/10 disabled:text-ink/40 disabled:cursor-not-allowed ${
            outcomeIndex === 0
              ? "bg-[#0fa968] hover:enabled:bg-[#0d8e58]"
              : "bg-[#ef5b61] hover:enabled:bg-[#d44850]"
          }`}
          disabled={!canSubmit}
          onClick={submit}
        >
          {submitLabel}
        </button>
      </DialogContent>
    </Dialog>
  );
}
