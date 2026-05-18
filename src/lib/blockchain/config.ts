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

const DEFAULT_BASE_SEPOLIA: ChainConfig = {
  chainId: 84_532,
  name: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
  explorerUrl: "https://sepolia.basescan.org",
  registryAddress: "0x0000000000000000000000000000000000000000",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
};

const DEFAULT_BASE_MAINNET: ChainConfig = {
  chainId: 8453,
  name: "Base",
  rpcUrl: "https://mainnet.base.org",
  explorerUrl: "https://basescan.org",
  registryAddress: "0x0000000000000000000000000000000000000000",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
};

function readEnv(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env[name];
}

export function getChainConfig(): ChainConfig {
  const chainIdRaw = readEnv("NEXT_PUBLIC_PREDIX_CHAIN_ID");
  const chainId = chainIdRaw ? Number(chainIdRaw) : 84_532;
  const base = chainId === 8453 ? DEFAULT_BASE_MAINNET : DEFAULT_BASE_SEPOLIA;
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
