// Central place for network/contract configuration, sourced from Vite env
// vars so testnet vs. future-mainnet values never get hardcoded in feature
// code.

function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const CONTRACT_ID = requireEnv('VITE_CONTRACT_ID');
export const TOKEN_ID = requireEnv('VITE_TOKEN_ID');
export const NETWORK_PASSPHRASE = requireEnv('VITE_NETWORK_PASSPHRASE');
export const RPC_URL = requireEnv('VITE_RPC_URL');
export const HORIZON_URL = requireEnv('VITE_HORIZON_URL');
export const EXPLORER_BASE_URL = requireEnv('VITE_EXPLORER_BASE_URL');

export function explorerTxUrl(hash: string): string {
  return `${EXPLORER_BASE_URL}/tx/${hash}`;
}

// A real, long-running stream on testnet (100 XLM over 30 days, created
// 2026-08-18: tx b00781879368ac0439ce9f7523245c49b8beb78288bb2da7b76c7a4807b9eba6)
// used to illustrate the homepage with genuine live numbers instead of
// invented placeholder ones.
export const DEMO_STREAM_ID = 2n;
