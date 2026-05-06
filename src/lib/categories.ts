import { C } from "./tokens";
import type { Category } from "@/types";

/* ── 카테고리 — 보조 액센트 시스템 반영 ────────────────
   각 카테고리에 고유 컬러 스트라이프 색상 포함
─────────────────────────────────────────────────── */
export const CATS: Record<string, Category> = {
  "코인":   { c: C.gold,  bg: C.goldBg, e: "₿",  stripe: C.gold  },
  "주식":   { c: C.cyan,  bg: C.cyanB,  e: "📈", stripe: C.cyan  },
  "스포츠": { c: C.peach, bg: C.peachB, e: "⚽", stripe: C.peach },
  "이슈":   { c: C.rose,  bg: C.redB,   e: "📰", stripe: C.rose  },
  "정치":   { c: C.plum,  bg: C.seerBg, e: "🏛", stripe: C.plum  },
  "기술":   { c: C.blue,  bg: C.blueB,  e: "💻", stripe: C.blue  },
};

export const Cm = (cat: string): Category =>
  CATS[cat] || { c: C.gold, bg: C.goldBg, e: "◎", stripe: C.gold };
