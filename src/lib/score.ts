import type { ScoreInput } from "@/types";

/* ── PREDIX SCORE 계산 ───────────────────────────── */
export const calcScore = ({ accuracy, confidence, difficulty, recency }: ScoreInput): number =>
  Math.round(accuracy * 0.4 + confidence * 0.2 + difficulty * 0.2 + recency * 0.2);
