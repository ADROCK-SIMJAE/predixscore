"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { clamp, formatCurrency, formatPercent } from "@/lib/format";
import type { MarketSnapshot } from "@/types/polymarket";

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

type FeedbackTone = "idle" | "success" | "error" | "warning";

const STAKE_PRESETS = [10, 25, 100, 500];

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
  const tCommon = useTranslations("common");

  const [outcomeIndex, setOutcomeIndex] = useState(initialOutcomeIndex);
  const [stake, setStake] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState<number>(10000);
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; message: string }>({
    tone: "idle",
    message: "",
  });

  useEffect(() => {
    if (open) {
      setOutcomeIndex(initialOutcomeIndex);
      setStake("");
      setFeedback({ tone: "idle", message: "" });
      // Refresh available balance whenever modal opens
      fetch("/api/paper/stats")
        .then((r) => r.json())
        .then((d) => setAvailableBalance(d.stats?.availableBalance ?? 10000))
        .catch(() => {});
    }
  }, [open, initialOutcomeIndex, market.id]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const livePrice = clamp(market.outcomePrices[outcomeIndex] ?? 0, 0, 1);
  const outcomeLabel = market.outcomes[outcomeIndex] ?? "Yes";
  const tokenId = market.clobTokenIds[outcomeIndex] ?? "";
  const numericStake = Number(stake);
  const validStake = Number.isFinite(numericStake) && numericStake > 0;
  const sufficientBalance = numericStake <= availableBalance + 0.0001;
  const shares = livePrice > 0 && validStake ? numericStake / livePrice : 0;
  const profit = shares - numericStake;
  const canSubmit =
    validStake &&
    sufficientBalance &&
    livePrice > 0 &&
    Boolean(tokenId) &&
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
    setSubmitting(true);
    setFeedback({ tone: "idle", message: "" });

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
        setFeedback({
          tone: response.status === 501 ? "warning" : "error",
          message: data.error ?? t("saveFail"),
        });
        return;
      }

      setFeedback({
        tone: "success",
        message: t("saveSuccess", {
          outcome: outcomeLabel,
          price: Math.round(livePrice * 100),
          amount: formatCurrency(numericStake),
        }),
      });
      onSuccess?.();
      window.setTimeout(() => onClose(), 700);
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : t("saveFail"),
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const submitLabel = submitting
    ? t("saving")
    : !validStake
      ? t("enterStake")
      : !sufficientBalance
        ? t("insufficientBalance")
        : t("predictCta", { outcome: outcomeLabel, amount: formatCurrency(numericStake) });

  return (
    <div className="bet-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bet-modal" onClick={(event) => event.stopPropagation()}>
        <header className="bet-modal-head">
          <div>
            <span className="eyebrow">{t("eyebrow")}</span>
            <h2>{market.question}</h2>
          </div>
          <button
            type="button"
            className="bet-modal-close"
            aria-label={tCommon("close")}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <div className="bet-modal-toggle">
          <button
            type="button"
            className={`bet-toggle yes ${outcomeIndex === 0 ? "active" : ""}`}
            onClick={() => setOutcomeIndex(0)}
          >
            <span>Yes</span>
            <strong>{yesPercent}%</strong>
            <em>{t("yesChance", { percent: formatPercent(market.outcomePrices[0] ?? 0) })}</em>
          </button>
          {market.outcomes[1] ? (
            <button
              type="button"
              className={`bet-toggle no ${outcomeIndex === 1 ? "active" : ""}`}
              onClick={() => setOutcomeIndex(1)}
            >
              <span>No</span>
              <strong>{noPercent}%</strong>
              <em>{t("noChance", { percent: formatPercent(market.outcomePrices[1] ?? 0) })}</em>
            </button>
          ) : null}
        </div>

        <div className="bet-modal-section">
          <div className="bet-modal-label-row">
            <label className="bet-modal-label">{t("stakeLabel")}</label>
            <span className="bet-modal-balance">
              <Wallet size={12} />
              {formatCurrency(availableBalance)} {t("available")}
            </span>
          </div>
          <div className={`bet-modal-stake-row ${!sufficientBalance && validStake ? "error" : ""}`}>
            <span className="bet-modal-currency-prefix">$</span>
            <input
              className="bet-modal-stake-input"
              value={stake}
              onChange={(event) => setStake(event.target.value.replace(/[^\d.]/g, ""))}
              placeholder={t("stakePlaceholder")}
              inputMode="decimal"
              autoFocus
            />
            <span className="bet-modal-currency">{t("currency")}</span>
          </div>
          <div className="bet-modal-presets">
            {presetCards.map((preset) => (
              <button
                key={preset.amount}
                type="button"
                className={`bet-preset ${numericStake === preset.amount ? "active" : ""}`}
                onClick={() => setStake(String(preset.amount))}
                disabled={preset.amount > availableBalance}
              >
                ${preset.amount}
              </button>
            ))}
          </div>
        </div>

        <div className="bet-modal-summary">
          <div>
            <span>{t("summaryAvgPrice")}</span>
            <strong>{Math.round(livePrice * 100)}%</strong>
          </div>
          <div>
            <span>{t("summaryShares")}</span>
            <strong>{shares > 0 ? shares.toFixed(2) : "—"}</strong>
          </div>
          <div>
            <span>{t("summaryPayoutIf", { outcome: outcomeLabel })}</span>
            <strong>{shares > 0 ? formatCurrency(shares) : "—"}</strong>
          </div>
          <div>
            <span>{t("summaryProfitIf", { outcome: outcomeLabel })}</span>
            <strong className={profit > 0 ? "profit-positive" : ""}>
              {profit > 0 ? `+${formatCurrency(profit)}` : "—"}
            </strong>
          </div>
        </div>

        {!paperTradingConfigured ? (
          <div className="feedback-box warning">{t("storageWarning")}</div>
        ) : null}

        {feedback.tone !== "idle" ? (
          <div className={`feedback-box ${feedback.tone}`}>{feedback.message}</div>
        ) : null}

        <button
          type="button"
          className={`bet-submit ${outcomeIndex === 0 ? "yes" : "no"}`}
          disabled={!canSubmit}
          onClick={submit}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
