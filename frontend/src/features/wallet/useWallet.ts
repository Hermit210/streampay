import { useCallback, useEffect, useState } from 'react';
import { connectWallet, getConnectedAddress, assertCorrectNetwork } from '../../services/stellar/freighter';
import { describeError } from '../../services/stellar/errors';

export interface WalletState {
  address: string | null;
  connecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    connecting: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    getConnectedAddress()
      .then((address) => {
        if (!cancelled && address) {
          setState((s) => ({ ...s, address }));
        }
      })
      .catch(() => {
        // Silently ignore: this is a background check for an already-granted
        // connection, not a user-initiated action worth surfacing an error for.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const address = await connectWallet();
      await assertCorrectNetwork();
      setState({ address, connecting: false, error: null });
    } catch (err) {
      setState({ address: null, connecting: false, error: describeError(err) });
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ address: null, connecting: false, error: null });
  }, []);

  return { ...state, connect, disconnect };
}
