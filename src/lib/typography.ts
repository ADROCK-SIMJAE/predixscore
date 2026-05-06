/* ── TYPOGRAPHY TOKENS ──────────────────────────────
   프로덕션 톤 — 사이즈/굵기/자간 시스템화
   원칙: 12px 미만 금지, letterSpacing 1px 이하, Sora는 주요 헤딩에만
─────────────────────────────────────────────────── */
export const T = {
  /* size — 한 단계 업 (12/13/14/15/17/20/24/32) */
  xs:   12,   // 캡션 / 타임스탬프 (최소값)
  sm:   13,   // 본문 작은 / 라벨
  base: 14,   // 본문 기본
  md:   15,   // 본문 강조 / 부제목
  lg:   17,   // 섹션 헤딩
  xl:   20,   // 페이지 헤딩
  xxl:  24,   // 큰 수치 / 히어로
  hero: 32,   // 최상위 히어로 숫자

  /* weight — 5단계 명확히 */
  regular:   400,
  medium:    500,
  semibold:  600,
  bold:      700,
  extrabold: 800,

  /* line-height */
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.7,

  /* letter-spacing */
  ls_tight:  -0.01,   /* em — 헤딩용 */
  ls_normal:  0,
  ls_label:   0.3,    /* px */
  ls_caps:    1,      /* px — uppercase 라벨에만 */

  /* font-family */
  sans:    "'Plus Jakarta Sans',sans-serif",
  display: "'Sora',sans-serif",            /* 페이지 타이틀, 큰 수치만 */
  mono:    "'JetBrains Mono',monospace",   /* 숫자/카운트다운/주소 */

  /* radius — 6/8/12/16/999 */
  r_sm:  6,
  r_md:  8,
  r_lg:  12,
  r_xl:  16,
  r_pill: 999,

  /* shadow — 3단계 + lift */
  shadow_sm:   "0 1px 3px rgba(0,0,0,0.5)",
  shadow_md:   "0 4px 12px rgba(0,0,0,0.6)",
  shadow_lift: "0 8px 24px rgba(0,0,0,0.7)",
  shadow_gold: "0 4px 16px rgba(201,160,48,0.18)",
  shadow_none: "none",
} as const;
