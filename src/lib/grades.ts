import { C } from "./tokens";
import type { Grade, GradeKey } from "@/types";

/* ── 등급 시스템 ──────────────────────────────────── */
export const GRADES: Record<GradeKey, Grade> = {
  candidate: {
    key: "candidate", label: "Candidate", sub: "후보자",
    sym: "○", color: C.t3, bg: "#0A0908", bd: C.bd,
    scoreMin: 0,  predMin: 0,
    canPublish: false, desc: "예측에 참여하고 실력을 쌓으세요",
  },
  forecaster: {
    key: "forecaster", label: "Forecaster", sub: "예측자",
    sym: "◈", color: C.blue, bg: C.blueB, bd: "#1E3A8A",
    scoreMin: 55, predMin: 30,
    canPublish: false, desc: "패턴을 읽는 자",
  },
  proven: {
    key: "proven", label: "Proven", sub: "검증자",
    sym: "✦", color: C.gold, bg: C.goldBg, bd: C.goldBd,
    scoreMin: 70, predMin: 100,
    canPublish: true, desc: "결과로 증명된 자",
  },
  seer: {
    key: "seer", label: "Seer", sub: "예언자",
    sym: "👑", color: C.seerL, bg: C.seerBg, bd: C.seerBd,
    scoreMin: 85, predMin: 300,
    canPublish: true, desc: "보는 자 — 극소수",
  },
};

export const Gd = (k: string): Grade => GRADES[k as GradeKey] || GRADES.candidate;
