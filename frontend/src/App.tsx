import { Routes, Route } from 'react-router-dom';
import { useWallet } from './features/wallet/useWallet';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './pages/HomePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AppPage } from './pages/AppPage';
import './App.css';

function App() {
  const wallet = useWallet();

  return (
    <div className="app-shell">
      <Navbar wallet={wallet} />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/app" element={<AppPage wallet={wallet} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
