import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { WalletConnect } from '../../features/wallet/WalletConnect';
import type { useWallet } from '../../features/wallet/useWallet';
import './navbar.css';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/how-it-works', label: 'How it works', end: false },
  { to: '/app', label: 'App', end: false },
];

export function Navbar({ wallet }: { wallet: ReturnType<typeof useWallet> }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-row">
        <NavLink to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          StreamPay
        </NavLink>

        <nav className="navbar-links navbar-links-desktop">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-wallet navbar-wallet-desktop">
          <WalletConnect {...wallet} />
        </div>

        <button
          type="button"
          className="navbar-menu-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && (
        <div className="navbar-mobile-panel">
          <nav className="navbar-links">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <WalletConnect {...wallet} />
        </div>
      )}
    </header>
  );
}
