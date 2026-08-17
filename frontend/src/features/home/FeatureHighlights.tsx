import { RevealGroup, RevealItem } from '../../components/ui/Reveal';
import { ClockIcon, LinkIcon, ShieldIcon } from '../../components/ui/icons';
import './home.css';

const FEATURES = [
  {
    icon: ClockIcon,
    title: 'Live-ticking balance',
    body: 'The withdrawable amount recomputes client-side every second from the known rate, and reconciles against the real on-chain balance_of every 10 seconds — no polling delay on the number you actually watch move.',
  },
  {
    icon: LinkIcon,
    title: 'Real on-chain settlement',
    body: 'Every deposit, withdrawal, and cancellation is an inter-contract call into the XLM Stellar Asset Contract — verifiable on Stellar Expert, not a database row that only looks like a balance.',
  },
  {
    icon: ShieldIcon,
    title: 'Cancel-anytime fairness',
    body: 'Cancel early and the split is exact: the recipient gets precisely what accrued up to that second, the sender gets the rest back — no forfeiture, no negotiation.',
  },
];

export function FeatureHighlights() {
  return (
    <section className="feature-highlights">
      <RevealGroup className="feature-grid">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <RevealItem className="feature-card" key={title} interactive>
            <Icon className="feature-icon" />
            <h3>{title}</h3>
            <p>{body}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
