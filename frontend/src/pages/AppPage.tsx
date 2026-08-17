import { useState } from 'react';
import { CreateStreamForm } from '../features/streams/CreateStreamForm';
import { StreamLookup } from '../features/streams/StreamLookup';
import { StreamView } from '../features/streams/StreamView';
import type { useWallet } from '../features/wallet/useWallet';
import './app-page.css';

export function AppPage({ wallet }: { wallet: ReturnType<typeof useWallet> }) {
  const [selectedStreamId, setSelectedStreamId] = useState<bigint | null>(null);

  return (
    <section className="app-page">
      <h1>Try it live</h1>
      <p className="app-page-sub">
        Real testnet contract, real wallet, real transactions — connect
        Freighter and create an actual stream.
      </p>

      <div className="app-page-body">
        <CreateStreamForm address={wallet.address} onCreated={setSelectedStreamId} />
        <StreamLookup onSelect={setSelectedStreamId} />
        {selectedStreamId !== null && (
          <StreamView streamId={selectedStreamId} address={wallet.address} />
        )}
      </div>
    </section>
  );
}
