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
