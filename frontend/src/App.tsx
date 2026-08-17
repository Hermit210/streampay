import { useWallet } from './features/wallet/useWallet';
import { WalletConnect } from './features/wallet/WalletConnect';
import { CreateStreamForm } from './features/streams/CreateStreamForm';
import './App.css';

function App() {
  const wallet = useWallet();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>StreamPay</h1>
          <p className="tagline">Real-time streaming payments on Stellar</p>
        </div>
        <WalletConnect {...wallet} />
      </header>

      <CreateStreamForm address={wallet.address} />
    </div>
  );
}

export default App;
