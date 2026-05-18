// Burner wallet (blockpick-style) — generated client-side, encrypted with a
// user-chosen password, persisted in IndexedDB. POC only: in production we'd
// hand this off to Privy/Coinbase Smart Wallet + paymaster.

import { Wallet, JsonRpcProvider, getBytes, hexlify, keccak256, toUtf8Bytes, toUtf8String } from "ethers";
import { getChainConfig } from "./config";

const DB_NAME = "PredixScoreWallets";
const STORE = "wallets";
const VERSION = 1;

type StoredWallet = {
  userKey: string;
  encryptedPrivateKey: string;
  address: string;
  createdAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "userKey" });
      }
    };
  });
}

async function putWallet(record: StoredWallet) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE], "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getWallet(userKey: string): Promise<StoredWallet | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE], "readonly");
    const req = tx.objectStore(STORE).get(userKey);
    req.onsuccess = () => resolve((req.result as StoredWallet) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteWallet(userKey: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE], "readwrite");
    tx.objectStore(STORE).delete(userKey);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// PBKDF2-style key derivation via repeated keccak256 (blockpick pattern).
function deriveKey(password: string, salt: string, iterations = 100_000): Uint8Array {
  let key = keccak256(toUtf8Bytes(password + salt));
  for (let i = 0; i < iterations; i++) {
    key = keccak256(toUtf8Bytes(key + password + salt + i.toString()));
  }
  return getBytes(key);
}

function xorEncryptUtf8(plaintext: string, keyBytes: Uint8Array, saltBytes: Uint8Array): string {
  const bytes = toUtf8Bytes(plaintext);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ keyBytes[i % keyBytes.length] ^ saltBytes[i % saltBytes.length];
  }
  return hexlify(out);
}

function xorDecryptUtf8(hex: string, keyBytes: Uint8Array, saltBytes: Uint8Array): string {
  const bytes = getBytes(hex);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ keyBytes[i % keyBytes.length] ^ saltBytes[i % saltBytes.length];
  }
  return toUtf8String(out);
}

function encryptPrivateKey(privateKey: string, password: string): string {
  const salt = keccak256(toUtf8Bytes(Date.now().toString() + Math.random()));
  const baseKey = hexlify(deriveKey(password, "PredixScoreSalt"));
  const enhanced = getBytes(keccak256(toUtf8Bytes(baseKey + salt)));
  const data = xorEncryptUtf8(privateKey, enhanced, getBytes(salt));
  return JSON.stringify({ version: "1.0", salt, data });
}

function decryptPrivateKey(blob: string, password: string): string | null {
  try {
    const parsed = JSON.parse(blob) as { salt: string; data: string; version: string };
    const baseKey = hexlify(deriveKey(password, "PredixScoreSalt"));
    const enhanced = getBytes(keccak256(toUtf8Bytes(baseKey + parsed.salt)));
    return xorDecryptUtf8(parsed.data, enhanced, getBytes(parsed.salt));
  } catch {
    return null;
  }
}

export type WalletInfo = {
  address: `0x${string}`;
  privateKey: `0x${string}`;
};

export async function hasWallet(userKey: string): Promise<boolean> {
  const row = await getWallet(userKey);
  return !!row;
}

export async function getStoredAddress(userKey: string): Promise<`0x${string}` | null> {
  const row = await getWallet(userKey);
  return row ? (row.address as `0x${string}`) : null;
}

export async function createWallet(userKey: string, password: string): Promise<WalletInfo> {
  const wallet = Wallet.createRandom();
  const encrypted = encryptPrivateKey(wallet.privateKey, password);
  await putWallet({
    userKey,
    encryptedPrivateKey: encrypted,
    address: wallet.address,
    createdAt: Date.now(),
  });
  return { address: wallet.address as `0x${string}`, privateKey: wallet.privateKey as `0x${string}` };
}

export async function unlockWallet(userKey: string, password: string): Promise<WalletInfo | null> {
  const row = await getWallet(userKey);
  if (!row) return null;
  const pk = decryptPrivateKey(row.encryptedPrivateKey, password);
  if (!pk) return null;
  return { address: row.address as `0x${string}`, privateKey: pk as `0x${string}` };
}

export async function clearWallet(userKey: string) {
  await deleteWallet(userKey);
}

export function buildSigner(privateKey: string): Wallet {
  const cfg = getChainConfig();
  const provider = new JsonRpcProvider(cfg.rpcUrl, cfg.chainId);
  return new Wallet(privateKey, provider);
}
