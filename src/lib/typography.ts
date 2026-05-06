/* ── TYPOGRAPHY TOKENS ──────────────────────────────
   프로덕션 톤 — 사이즈/굵기/자간 시스템화
   원칙: 11px 미만 금지, letterSpacing 1px 이하, Sora는 주요 헤딩에만
─────────────────────────────────────────────────── */
export const T = {
  /* size — 11/12/13/14/16/18/22 */
  xs: 11,    // 메타데이터 / 캡션 / 타임스탬프
  sm: 12,    // 본문 작은 / 라벨
  base: 13,  // 본문 기본
  md: 14,    // 본문 강조 / 부제목
  lg: 16,    // 섹션 헤딩
  xl: 18,    // 페이지 헤딩
  xxl: 22,   // 큰 숫자 / 히어로

  /* weight */
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,

  /* line-height */
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.7,

  /* letter-spacing — 모두 px 또는 0 */
  ls_tight: -0.2,
  ls_normal: 0,
  ls_label: 0.3,
  ls_caps: 1,    // uppercase 라벨에만

  /* font-family */
  sans: "'Plus Jakarta Sans',sans-serif",
  display: "'Sora',sans-serif",       // 페이지 타이틀, 큰 수치만
  mono: "'JetBrains Mono',monospace",  // 숫자/카운트다운/주소

  /* radius — 6/8/12/16/999 */
  r_sm: 6,
  r_md: 8,
  r_lg: 12,
  r_xl: 16,
  r_pill: 999,

  /* shadow — 3단계 */
  shadow_sm: "0 1px 2px rgba(0,0,0,0.4)",
  shadow_md: "0 2px 8px rgba(0,0,0,0.5)",
  shadow_none: "none",
} as const;
