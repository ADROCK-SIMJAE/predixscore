// PredixScoreRegistry ABI (subset — only what the dapp + sponsor backend call).
// Source: contracts/src/PredixScoreRegistry.sol (sponsored commit/reveal variant).

export const PREDIX_SCORE_REGISTRY_ABI = [
  {
    type: "function",
    name: "commit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "user", type: "address" },
      { name: "hash", type: "bytes32" },
      { name: "marketRef", type: "bytes32" },
      { name: "revealAfter", type: "uint64" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "reveal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "outcomeIndex", type: "uint8" },
      { name: "stakeAmount", type: "uint128" },
      { name: "entryPrice", type: "uint128" },
      { name: "salt", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "commits",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "user", type: "address" },
      { name: "hash", type: "bytes32" },
      { name: "marketRef", type: "bytes32" },
      { name: "committedAt", type: "uint64" },
      { name: "revealAfter", type: "uint64" },
      { name: "revealed", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "userCommitIds",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "nextId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "Committed",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "marketRef", type: "bytes32", indexed: true },
      { name: "hash", type: "bytes32", indexed: false },
      { name: "committedAt", type: "uint64", indexed: false },
      { name: "revealAfter", type: "uint64", indexed: false },
      { name: "sponsor", type: "address", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Revealed",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "outcomeIndex", type: "uint8", indexed: false },
      { name: "stakeAmount", type: "uint128", indexed: false },
      { name: "entryPrice", type: "uint128", indexed: false },
      { name: "sponsor", type: "address", indexed: false },
    ],
    anonymous: false,
  },
] as const;
