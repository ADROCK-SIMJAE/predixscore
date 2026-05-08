import { notFound } from "next/navigation";
import { MarketDetailClient } from "@/components/markets/MarketDetailClient";
import { fetchEventBySlug } from "@/lib/polymarket";

type EventPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ market?: string; side?: string }>;
};

export const revalidate = 120;

export default async function EventPage({ params, searchParams }: EventPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const event = await fetchEventBySlug(slug);
  const authConfigured = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  const paperTradingConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!event) {
    notFound();
  }

  return (
    <MarketDetailClient
      event={event}
      authConfigured={authConfigured}
      paperTradingConfigured={paperTradingConfigured}
      initialMarketSlug={resolvedSearchParams?.market}
      initialOutcomeIndex={resolvedSearchParams?.side === "no" ? 1 : 0}
    />
  );
}
