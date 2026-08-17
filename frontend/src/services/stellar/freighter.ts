import freighter from '@stellar/freighter-api';
import { NETWORK_PASSPHRASE } from './config';

export class WalletError extends Error {}

/** Wraps every Freighter call so callers only ever deal with WalletError. */
async function unwrap<T>(
  promise: Promise<{ error?: string } & T>,
  fallbackMessage: string,
): Promise<T> {
  const result = await promise;
  if (result.error) {
    throw new WalletError(result.error || fallbackMessage);
  }
  return result;
}

export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const result = await freighter.isConnected();
    return !result.error;
  } catch {
    return false;
  }
}

/** Prompts the user to grant access and returns their public key. */
export async function connectWallet(): Promise<string> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new WalletError(
      'Freighter wallet not found. Install the Freighter browser extension to continue.',
    );
  }
  const access = await unwrap(freighter.requestAccess(), 'Wallet access was denied');
  return access.address;
}

export async function getConnectedAddress(): Promise<string | null> {
  const installed = await isFreighterInstalled();
  if (!installed) return null;
  const allowed = await unwrap(freighter.isAllowed(), 'Could not check wallet permission');
  if (!allowed.isAllowed) return null;
  const result = await unwrap(freighter.getAddress(), 'Could not read wallet address');
  return result.address || null;
}

export async function assertCorrectNetwork(): Promise<void> {
  const network = await unwrap(freighter.getNetworkDetails(), 'Could not read wallet network');
  if (network.networkPassphrase !== NETWORK_PASSPHRASE) {
    throw new WalletError(
      `Wrong network selected in Freighter. Switch to the network matching "${NETWORK_PASSPHRASE}".`,
    );
  }
}

export async function signTransactionXdr(xdr: string, address: string): Promise<string> {
  const result = await unwrap(
    freighter.signTransaction(xdr, { address, networkPassphrase: NETWORK_PASSPHRASE }),
    'Transaction signing was rejected',
  );
  return result.signedTxXdr;
}
