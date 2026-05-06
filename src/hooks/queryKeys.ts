export const qk = {
  experts: ["experts"] as const,
  expert: (id: number | string) => ["experts", id] as const,
  preds: (cat?: string) => ["predictions", { cat: cat ?? "all" }] as const,
  pred: (id: number) => ["predictions", id] as const,
  feed: ["feed_items"] as const,
  events: ["events"] as const,
  event: (id: number) => ["events", id] as const,
  myPredictions: (userId: string | null) => ["me", "user_predictions", userId] as const,
  myPredictionFor: (userId: string | null, predId: number) => ["me", "user_prediction", userId, predId] as const,
  dmList: (userId: string | null) => ["me", "dms", userId] as const,
  dmMessages: (conversationId: number) => ["dm", "messages", conversationId] as const,
  profile: (userId: string | null) => ["profile", userId] as const,

  // 확장
  subscriptions: (userId: string | null) => ["me", "subscriptions", userId] as const,
  isSubscribed: (userId: string | null, expertId: number) => ["me", "is_subscribed", userId, expertId] as const,
  comments: (predId: number) => ["comments", predId] as const,
  myCommentLikes: (userId: string | null, predId: number) => ["me", "comment_likes", userId, predId] as const,
  reactions: (predId: number) => ["reactions", predId] as const,
  myReactions: (userId: string | null, predId: number) => ["me", "reactions", userId, predId] as const,
  chatroom: (expertId: number) => ["chatroom", expertId] as const,
  notifications: (userId: string | null) => ["me", "notifications", userId] as const,
  unlocks: (userId: string | null) => ["me", "unlocks", userId] as const,
  isUnlocked: (userId: string | null, type: string, id: number) =>
    ["me", "is_unlocked", userId, type, id] as const,
  challengeApps: (userId: string | null) => ["me", "challenge_apps", userId] as const,
  pointTx: (userId: string | null) => ["me", "point_tx", userId] as const,
};
