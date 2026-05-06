"use client";

import { BlindBox } from "./BlindBox";
import type { TitlePart } from "@/types";

interface BlindTitleProps {
  parts: TitlePart[];
}

/* ── BlindTitle ─────────────── */
export const BlindTitle = ({ parts }: BlindTitleProps) => (
  <span>
    {(parts || []).map((p, i) =>
      p === true
        ? <BlindBox key={i} />
        : <span key={i}>{p}</span>
    )}
  </span>
);
