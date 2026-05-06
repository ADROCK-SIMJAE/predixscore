/* ── TOKENS ─────────────────────────────────────── */
export const C = {
  /* ── 배경 — 따뜻한 검정 4단계 ── */
  bg:     "#0A0908",
  bg1:    "#13110F",
  bg2:    "#1C1A17",
  bg3:    "#272421",

  /* ── 골드 그라디언트 시스템 ── */
  gold:   "#C9A030",
  goldL:  "#E2BD52",
  goldD:  "#8E6E20",
  goldBg: "rgba(201,160,48,0.07)",
  goldBd: "rgba(201,160,48,0.22)",

  /* ── Seer / Premium ── */
  seer:   "#7C3AED",
  seerL:  "#C29FE8",
  seerBg: "#0D0720",
  seerBd: "#2D1A6E",

  /* ── 상태 컬러 ── */
  green:  "#6EE7B7",   /* 성공/적중/mint */
  greenB: "#052010",
  red:    "#F87171",   /* rose — 오류/정치 */
  redB:   "#1A0505",

  /* ── 보조 액센트 (카테고리 / 상태 배지용) ── */
  blue:   "#6BA8FF",   /* 정보/링크/Forecaster */
  blueB:  "#050D20",
  plum:   "#C29FE8",   /* Seer 보조 (seerL 별칭) */
  cyan:   "#5EEAD4",   /* 주식 */
  cyanB:  "#041614",
  peach:  "#FBA774",   /* 스포츠 */
  peachB: "#1A0C02",
  rose:   "#F87171",   /* 정치/이슈 (red 별칭) */
  mint:   "#6EE7B7",   /* 적중 (green 별칭) */

  /* ── 텍스트 — 콘트라스트 강화 ── */
  t1: "#F5F2EC",   /* 주요 본문 — 더 밝게 */
  t2: "#BFB8AC",   /* 보조 본문 — 기존보다 +15% 밝게 */
  t3: "#807870",   /* 캡션/보조정보 — 기존보다 약간 밝게 */

  /* ── 보더 ── */
  bd:  "#2A2622",
  bd2: "#1A1208",
  bdL: "#3A3530",
} as const;
