import { MarketsHome } from "@/components/markets/MarketsHome";
import { getHomeSnapshot } from "@/lib/polymarket";
import type { HomeSnapshot } from "@/types/polymarket";

export const revalidate = 120;

const EMPTY_SNAPSHOT: HomeSnapshot = {
  featured: [],
  markets: [],
  watchSeed: [],
  tags: [],
  stats: {
    totalMarkets: 0,
    totalVolume: 0,
    totalLiquidity: 0,
    avgProbability: 0,
  },
};

export default async function HomePage() {
  const authConfigured = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  const paperTradingConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  let snapshot = EMPTY_SNAPSHOT;
  let loadError: string | null = null;

  try {
    snapshot = await getHomeSnapshot();
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Live market data could not be loaded.";
  }

  return (
    <MarketsHome
      snapshot={snapshot}
      authConfigured={authConfigured}
      paperTradingConfigured={paperTradingConfigured}
      loadError={loadError}
    />
  );
}
