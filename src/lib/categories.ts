import { C } from "./tokens";
import type { Category } from "@/types";

/* ── DATA ──────────────────────────────────────────
   카테고리 색상 — 채도 낮춰서 카드 안에서 튀지 않게
   이모지는 유지 (카테고리 식별 목적, 작게 사용)
─────────────────────────────────────────────────── */
export const CATS: Record<string, Category> = {
  "코인":  { c: "#B8842E", bg: "#150E03", e: "₿" },
  "주식":  { c: "#3F8F5C", bg: "#0A1A10", e: "📈" },
  "스포츠":{ c: C.gold,    bg: C.goldBg,  e: "⚽" },
  "이슈":  { c: "#A85B7A", bg: "#1A0E14", e: "📰" },
  "정치":  { c: "#8676AC", bg: "#0F0C18", e: "🏛" },
  "기술":  { c: "#5B7FB0", bg: "#0A1018", e: "💻" },
};

export const Cm = (cat: string): Category =>
  CATS[cat] || { c: C.gold, bg: C.goldBg, e: "◎" };
