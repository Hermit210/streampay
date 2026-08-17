import { useState } from 'react';
import { useWallet } from './features/wallet/useWallet';
import { WalletConnect } from './features/wallet/WalletConnect';
import { CreateStreamForm } from './features/streams/CreateStreamForm';
import { StreamLookup } from './features/streams/StreamLookup';
import { StreamView } from './features/streams/StreamView';
import './App.css';

function App() {
  const wallet = useWallet();
  const [selectedStreamId, setSelectedStreamId] = useState<bigint | null>(null);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>StreamPay</h1>
          <p className="tagline">Real-time streaming payments on Stellar</p>
        </div>
        <WalletConnect {...wallet} />
      </header>

      <CreateStreamForm address={wallet.address} onCreated={setSelectedStreamId} />
      <StreamLookup onSelect={setSelectedStreamId} />
      {selectedStreamId !== null && (
        <StreamView streamId={selectedStreamId} address={wallet.address} />
      )}
    </div>
  );
}

export default App;
