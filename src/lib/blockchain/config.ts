// POC blockchain config. Defaults to Base Sepolia testnet.
// Override via NEXT_PUBLIC_* env vars.

export type ChainConfig = {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  registryAddress: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
};

const DEFAULT_RONIN_MAINNET: ChainConfig = {
  chainId: 2020,
  name: "Ronin",
  rpcUrl: "https://api.roninchain.com/rpc",
  explorerUrl: "https://app.roninchain.com",
  registryAddress: "0x0000000000000000000000000000000000000000",
  nativeCurrency: { name: "Ronin", symbol: "RON", decimals: 18 },
};

const DEFAULT_RONIN_SAIGON: ChainConfig = {
  chainId: 2021,
  name: "Ronin Saigon",
  rpcUrl: "https://saigon-testnet.roninchain.com/rpc",
  explorerUrl: "https://saigon-app.roninchain.com",
  registryAddress: "0x0000000000000000000000000000000000000000",
  nativeCurrency: { name: "Ronin", symbol: "RON", decimals: 18 },
};

const KNOWN_CHAINS: Record<number, ChainConfig> = {
  2020: DEFAULT_RONIN_MAINNET,
  2021: DEFAULT_RONIN_SAIGON,
};

function readEnv(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env[name];
}

export function getChainConfig(): ChainConfig {
  const chainIdRaw = readEnv("NEXT_PUBLIC_PREDIX_CHAIN_ID");
  const chainId = chainIdRaw ? Number(chainIdRaw) : 2020;
  const base = KNOWN_CHAINS[chainId] ?? DEFAULT_RONIN_MAINNET;
  const rpcUrl = readEnv("NEXT_PUBLIC_PREDIX_RPC_URL") ?? base.rpcUrl;
  const registryAddress =
    readEnv("NEXT_PUBLIC_PREDIX_REGISTRY_ADDRESS") ?? base.registryAddress;
  return { ...base, chainId, rpcUrl, registryAddress };
}

export function isRegistryConfigured(): boolean {
  const cfg = getChainConfig();
  return (
    !!cfg.registryAddress &&
    cfg.registryAddress !== "0x0000000000000000000000000000000000000000"
  );
}

export const STAKE_SCALE = 1_000_000n; // USDC convention (1e6)
export const PRICE_SCALE = 1_000_000_000_000_000_000n; // 1e18
