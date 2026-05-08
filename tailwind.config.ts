import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "860px",
      xl: "960px",
      "2xl": "1200px",
      "3xl": "1280px",
    },
    extend: {
      colors: {
        ink: "#0d1a2b",
        muted: {
          DEFAULT: "#597089",
          strong: "#42566d",
        },
        line: {
          DEFAULT: "rgba(97, 119, 145, 0.16)",
          strong: "rgba(24, 40, 63, 0.16)",
        },
        surface: {
          DEFAULT: "rgba(255, 255, 255, 0.72)",
          strong: "rgba(255, 255, 255, 0.9)",
          dark: "rgba(18, 29, 46, 0.88)",
        },
        accent: {
          DEFAULT: "#0f6dff",
          soft: "rgba(15, 109, 255, 0.12)",
          mid: "#0d63eb",
          light: "#42a0ff",
          deep: "#0a3d8f",
        },
        positive: {
          DEFAULT: "#0fa968",
          light: "#1cc97e",
          text: "#0e6d44",
        },
        negative: {
          DEFAULT: "#ef5b61",
          light: "#ff7a83",
          text: "#b13036",
        },
        amber: {
          brand: "#f4ad42",
          text: "#91590b",
        },
        gold: {
          DEFAULT: "#f5a524",
          light: "#ffd700",
        },
        silver: {
          DEFAULT: "#94a3b8",
          light: "#cbd5e1",
        },
        bronze: {
          DEFAULT: "#cd7f32",
          light: "#e0a370",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "10px",
        md: "12px",
        lg: "14px",
        xl: "16px",
        "2xl": "18px",
        "3xl": "20px",
        "4xl": "24px",
        "5xl": "28px",
        "6xl": "32px",
        full: "999px",
      },
      boxShadow: {
        sm: "0 4px 12px rgba(15, 109, 255, 0.18)",
        md: "0 18px 48px rgba(80, 109, 145, 0.12)",
        lg: "0 28px 80px rgba(80, 109, 145, 0.18)",
        xl: "0 30px 80px rgba(13, 28, 65, 0.28)",
        "accent-md": "0 8px 24px rgba(15, 109, 255, 0.24)",
        "accent-lg": "0 10px 30px rgba(15, 109, 255, 0.32)",
        "accent-pill": "0 4px 12px rgba(15, 109, 255, 0.28)",
        "accent-cat": "0 6px 16px rgba(15, 109, 255, 0.28)",
        "positive-md": "0 8px 24px rgba(15, 169, 104, 0.3)",
        "positive-lg": "0 10px 24px rgba(15, 169, 104, 0.32)",
        "positive-chip": "0 6px 18px rgba(15, 169, 104, 0.18)",
        "positive-icon": "0 10px 24px rgba(15, 169, 104, 0.32)",
        "negative-md": "0 8px 24px rgba(239, 91, 97, 0.3)",
        "card-hover": "0 18px 40px rgba(13, 28, 65, 0.14)",
        "row-hover": "0 8px 22px rgba(13, 28, 65, 0.08)",
        "brand-mark": "0 8px 22px rgba(15, 109, 255, 0.32)",
        "profile-avatar": "0 12px 28px rgba(15, 109, 255, 0.32)",
        "rank-gold": "0 4px 12px rgba(245, 165, 36, 0.32)",
        "rank-silver": "0 4px 12px rgba(148, 163, 184, 0.32)",
        "rank-bronze": "0 4px 12px rgba(205, 127, 50, 0.32)",
      },
      backdropBlur: {
        glass: "18px",
        panel: "28px",
      },
      maxWidth: {
        shell: "1480px",
      },
      keyframes: {
        pulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(15, 169, 104, 0.35)" },
          "70%": { boxShadow: "0 0 0 12px rgba(15, 169, 104, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(15, 169, 104, 0)" },
        },
        "bet-modal-fade": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "bet-modal-pop": {
          from: { transform: "translateY(8px) scale(0.98)", opacity: "0" },
          to: { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "bet-modal-sheet": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "skeleton-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        pulse: "pulse 1.8s infinite",
        "bet-modal-fade": "bet-modal-fade 160ms ease",
        "bet-modal-pop": "bet-modal-pop 200ms cubic-bezier(0.18, 0.95, 0.34, 1.1)",
        "bet-modal-sheet": "bet-modal-sheet 220ms cubic-bezier(0.18, 0.95, 0.34, 1.1)",
        "skeleton-pulse": "skeleton-pulse 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [typography, animate],
};

export default config;
