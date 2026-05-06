export const qk = {
  experts: ["experts"] as const,
  expert: (id: number | string) => ["experts", id] as const,
  preds: (cat?: string) => ["predictions", { cat: cat ?? "all" }] as const,
  pred: (id: number) => ["predictions", id] as const,
  feed: ["feed_items"] as const,
  events: ["events"] as const,
  event: (id: number) => ["events", id] as const,
  myPredictions: (userId: string | null) => ["me", "user_predictions", userId] as const,
  dmList: (userId: string | null) => ["me", "dms", userId] as const,
  dmMessages: (conversationId: number) => ["dm", "messages", conversationId] as const,
  profile: (userId: string | null) => ["profile", userId] as const,
};
