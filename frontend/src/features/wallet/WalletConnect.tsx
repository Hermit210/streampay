import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import type { useWallet } from './useWallet';
import './wallet.css';

function shorten(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function WalletConnect(wallet: ReturnType<typeof useWallet>) {
  const { address, connecting, error, connect, disconnect } = wallet;

  return (
    <div className="wallet-connect">
      {address ? (
        <div className="wallet-connected">
          <span className="wallet-address" title={address}>
            {shorten(address)}
          </span>
          <Button variant="secondary" onClick={disconnect}>
            Disconnect
          </Button>
        </div>
      ) : (
        <Button onClick={connect} loading={connecting}>
          {connecting ? 'Connecting…' : 'Connect Freighter'}
        </Button>
      )}
      {error && <ErrorBanner message={error} />}
    </div>
  );
}
