export type GradeKey = "candidate" | "forecaster" | "proven" | "seer";

export interface Grade {
  key: GradeKey;
  label: string;
  sub: string;
  sym: string;
  color: string;
  bg: string;
  bd: string;
  scoreMin: number;
  predMin: number;
  canPublish: boolean;
  desc: string;
}

export interface Category {
  c: string;
  bg: string;
  e: string;
}

export interface ScoreInput {
  accuracy: number;
  confidence: number;
  difficulty: number;
  recency: number;
}

export interface Cert {
  q: string;
  gk: GradeKey;
}

export interface QScore {
  q: string;
  v: number;
}

export interface Expert {
  rank: number;
  name: string;
  gk: GradeKey;
  score: number;
  acc: string;
  preds: number;
  subs: number;
  cat: string;
  bio: string;
  badges: string[];
  certs: Cert[];
  qScores: QScore[];
}

export interface Pred {
  id: number;
  cat: string;
  stage: "active" | "verify" | "done";
  status?: "revealed";
  q: string;
  A: string;
  B: string;
  eA: string;
  eB: string;
  p: number;
  dl: string;
  hot: boolean;
  agk?: GradeKey;
  aName?: string;
  aScore?: number;
  aAcc?: string;
  blind?: boolean;
  price?: number;
  myPred: "A" | "B" | null;
  result?: "A" | "B";
  aR?: number;
  bR?: number;
  totalP?: number;
  successP?: number;
  failP?: number;
}

export type TitlePart = string | true;

export interface FeedItem {
  id: number;
  author: string;
  agk: GradeKey;
  cat: string;
  dl: string;
  score: number;
  acc: string;
  preds: number;
  price: number;
  subscribeOnly: boolean;
  titleParts: TitlePart[];
}

export interface EventExpert {
  name: string;
  gk: GradeKey;
  score: number;
  correct: number;
  total: number;
  streak: number;
}

export interface EventHistory {
  day: number;
  actual: string | null;
  date: string;
}

export interface EventItem {
  id: number;
  brand: string;
  sym: string;
  icon: string;
  brandColor: string;
  logo: string;
  duration: number;
  status: "live" | "upcoming";
  deadline: string;
  startDate: string;
  endDate: string;
  prizePool: number;
  desc: string;
  experts: EventExpert[];
  history: EventHistory[];
}

export interface UnlockOption {
  icon: string;
  title: string;
  desc: string;
  badge: string;
  color: string;
  bg: string;
}

export interface Conversation {
  name: string;
  gk: GradeKey;
  online: boolean;
}
