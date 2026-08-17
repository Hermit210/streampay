import { useState } from 'react';
import { useWallet } from './features/wallet/useWallet';
import { WalletConnect } from './features/wallet/WalletConnect';
import { CreateStreamForm } from './features/streams/CreateStreamForm';
import { StreamLookup } from './features/streams/StreamLookup';
import { StreamView } from './features/streams/StreamView';
import { Hero } from './features/home/Hero';
import { HowItWorks } from './features/home/HowItWorks';
import { FeatureHighlights } from './features/home/FeatureHighlights';
import './App.css';

function App() {
  const wallet = useWallet();
  const [selectedStreamId, setSelectedStreamId] = useState<bigint | null>(null);

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-wordmark">StreamPay</span>
        <WalletConnect {...wallet} />
      </header>

      <Hero />
      <HowItWorks />
      <FeatureHighlights />

      <section className="live-demo" id="live-demo">
        <h2>Try it live</h2>
        <p className="live-demo-sub">
          Real testnet contract, real wallet, real transactions — connect
          Freighter and create an actual stream.
        </p>

        <div className="live-demo-app">
          <CreateStreamForm address={wallet.address} onCreated={setSelectedStreamId} />
          <StreamLookup onSelect={setSelectedStreamId} />
          {selectedStreamId !== null && (
            <StreamView streamId={selectedStreamId} address={wallet.address} />
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
