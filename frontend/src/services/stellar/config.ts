// Central place for network/contract configuration, sourced from Vite env
// vars so testnet vs. future-mainnet values never get hardcoded in feature
// code.
//
// Deliberately does NOT throw at module-load time. A synchronous throw here
// would happen before React ever mounts (this module gets imported
// transitively before main.tsx renders anything), so the app's own
// ErrorBoundary can never catch it -- the result is a silent blank page
// with nothing but a console error, which is exactly wrong for a missing
// env var in production (e.g. a fresh Vercel deploy with unset variables).
// Instead, missing keys are collected so main.tsx can render a clear,
// visible startup error screen before attempting to mount the app.

const REQUIRED_ENV_KEYS = [
  'VITE_CONTRACT_ID',
  'VITE_TOKEN_ID',
  'VITE_NETWORK_PASSPHRASE',
  'VITE_RPC_URL',
  'VITE_HORIZON_URL',
  'VITE_EXPLORER_BASE_URL',
] as const;

/** Pure and independently testable. Vercel's (and other hosts') env var
 * UIs will happily store a stray leading/trailing space if one gets
 * pasted in -- this has bitten this project once already
 * (VITE_NETWORK_PASSPHRASE had a leading space, which broke a strict
 * `!==` comparison against Freighter's reported network in a way that
 * was hard to see just by looking at the value). Trimming at the single
 * point every env var is read fixes it for every consumer at once. */
export function normalizeEnvValue(raw: string | undefined): string {
  return (raw ?? '').trim();
}

function readEnv(key: (typeof REQUIRED_ENV_KEYS)[number]): string {
  const raw = import.meta.env[key];
  const trimmed = normalizeEnvValue(raw);
  // Warning here means a future stray-whitespace env var surfaces
  // immediately in the console instead of as a confusing downstream
  // mismatch (e.g. a wallet "wrong network" error that looks correct at
  // a glance).
  if ((raw ?? '') !== trimmed) {
    console.warn(
      `[config] ${key} had leading/trailing whitespace in its environment value; trimmed automatically.`,
    );
  }
  return trimmed;
}

/** Pure and independently testable, unlike reading import.meta.env directly. */
export function computeMissingEnvVars(
  env: Record<string, string | undefined>,
  keys: readonly string[],
): string[] {
  return keys.filter((key) => !env[key]);
}

export const MISSING_ENV_VARS: string[] = computeMissingEnvVars(
  import.meta.env,
  REQUIRED_ENV_KEYS,
);

export const CONTRACT_ID = readEnv('VITE_CONTRACT_ID');
export const TOKEN_ID = readEnv('VITE_TOKEN_ID');
export const NETWORK_PASSPHRASE = readEnv('VITE_NETWORK_PASSPHRASE');
export const RPC_URL = readEnv('VITE_RPC_URL');
export const HORIZON_URL = readEnv('VITE_HORIZON_URL');
export const EXPLORER_BASE_URL = readEnv('VITE_EXPLORER_BASE_URL');

export function explorerTxUrl(hash: string): string {
  return `${EXPLORER_BASE_URL}/tx/${hash}`;
}

// A real, long-running stream on testnet (100 XLM over 30 days, created
// 2026-08-18: tx b00781879368ac0439ce9f7523245c49b8beb78288bb2da7b76c7a4807b9eba6)
// used to illustrate the homepage with genuine live numbers instead of
// invented placeholder ones.
export const DEMO_STREAM_ID = 2n;
