export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value || 0);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value || 0);
}

export function formatPercent(value: number) {
  return `${Math.round((value || 0) * 100)}%`;
}

export function formatDateLabel(value: string | null) {
  if (!value) return "No closing date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatRelativeWindow(value: string | null) {
  if (!value) return "Open schedule";

  const now = Date.now();
  const target = new Date(value).getTime();
  const diffHours = Math.round((target - now) / (1000 * 60 * 60));

  if (diffHours < 0) return "Closed";
  if (diffHours < 24) return `${diffHours}h left`;

  const diffDays = Math.round(diffHours / 24);

  return `${diffDays}d left`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
