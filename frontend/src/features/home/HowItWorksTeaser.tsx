import { Link } from 'react-router-dom';
import { RevealGroup, RevealItem } from '../../components/ui/Reveal';
import { LockIcon, PulseIcon, WalletIcon, ScaleIcon } from '../../components/ui/icons';
import './home.css';

const STEPS = [
  { icon: LockIcon, label: 'Lock funds' },
  { icon: PulseIcon, label: 'Stream in real-time' },
  { icon: WalletIcon, label: 'Withdraw anytime' },
  { icon: ScaleIcon, label: 'Cancel for a fair split' },
];

/** Condensed, one-line-per-step preview for the homepage -- the full
 * walkthrough with real testnet numbers and transaction links lives on
 * /how-it-works. */
export function HowItWorksTeaser() {
  return (
    <section className="teaser">
      <h2>How it works</h2>
      <RevealGroup className="teaser-steps">
        {STEPS.map(({ icon: Icon, label }, i) => (
          <RevealItem className="teaser-step" key={label}>
            <Icon className="teaser-step-icon" />
            <span className="teaser-step-label">{label}</span>
            {i < STEPS.length - 1 && <span className="teaser-step-arrow">→</span>}
          </RevealItem>
        ))}
      </RevealGroup>
      <Link className="teaser-link" to="/how-it-works">
        See full walkthrough with real transactions ↗
      </Link>
    </section>
  );
}
