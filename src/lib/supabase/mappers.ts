import type { Tables } from "@/types/database";
import type { Expert, Pred, FeedItem, EventItem, GradeKey, Cert, QScore, EventExpert, EventHistory } from "@/types";

export function mapExpert(row: Tables<"experts">): Expert {
  return {
    rank: row.rank ?? 0,
    name: row.name,
    gk: row.gk,
    score: Number(row.score),
    acc: String(row.acc),
    preds: row.preds,
    subs: row.subs,
    cat: row.cat ?? "",
    bio: row.bio ?? "",
    badges: (row.badges as unknown as string[]) ?? [],
    certs: (row.certs as unknown as Cert[]) ?? [],
    qScores: (row.q_scores as unknown as QScore[]) ?? [],
  };
}

export function mapPred(row: Tables<"predictions">): Pred & { dbId: number } {
  return {
    dbId: row.id,
    id: row.id,
    cat: row.cat,
    stage: row.stage,
    status: (row.status as "revealed" | undefined) ?? undefined,
    q: row.q,
    A: row.a_label,
    B: row.b_label,
    eA: row.ea ?? "",
    eB: row.eb ?? "",
    p: row.participants,
    dl: row.deadline_text ?? "",
    hot: row.hot,
    agk: (row.author_gk as GradeKey | null) ?? undefined,
    aName: row.author_name ?? undefined,
    aScore: row.author_score != null ? Number(row.author_score) : undefined,
    aAcc: row.author_acc != null ? String(row.author_acc) : undefined,
    blind: row.blind,
    price: row.price,
    myPred: null,
    result: (row.result as "A" | "B" | undefined) ?? undefined,
    aR: row.a_ratio ?? undefined,
    bR: row.b_ratio ?? undefined,
    totalP: row.total_p ?? undefined,
    successP: row.success_p ?? undefined,
    failP: row.fail_p ?? undefined,
  };
}

export function mapFeedItem(row: Tables<"feed_items">): FeedItem {
  return {
    id: row.id,
    author: row.author,
    agk: (row.agk as GradeKey) ?? "candidate",
    cat: row.cat ?? "",
    dl: row.deadline_text ?? "",
    score: row.score != null ? Number(row.score) : 0,
    acc: row.acc != null ? String(row.acc) : "0",
    preds: row.preds,
    price: row.price,
    subscribeOnly: row.subscribe_only,
    titleParts: (row.title_parts as unknown as (string | true)[]) ?? [],
  };
}

export function mapEvent(row: Tables<"events">): EventItem {
  return {
    id: row.id,
    brand: row.brand,
    sym: row.sym ?? "",
    icon: row.icon ?? "",
    brandColor: row.brand_color ?? "#888",
    logo: row.logo ?? "",
    duration: row.duration,
    status: row.status === "ended" ? "live" : row.status,
    deadline: row.deadline ?? "",
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    prizePool: row.prize_pool,
    desc: row.description ?? "",
    experts: (row.experts as unknown as EventExpert[]) ?? [],
    history: (row.history as unknown as EventHistory[]) ?? [],
  };
}
