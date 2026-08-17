import './home.css';

const FAQS = [
  {
    q: 'Why stream instead of just sending one payment?',
    a: "A one-time payment is all-or-nothing: pay upfront and hope the work gets done, or pay after and hope the other side trusts you. Streaming removes that standoff — the recipient is always paid exactly for time elapsed, and either side can end it early without a dispute over how much is owed.",
  },
  {
    q: 'What actually happens when someone cancels?',
    a: "The contract computes exactly what has accrued up to that second, pays it to the recipient, and refunds the untouched remainder to the sender — in the same transaction. No negotiation, no partial trust required.",
  },
  {
    q: 'Is my money safe while it is streaming?',
    a: "The deposit is held by the StreamPay contract itself, not by the recipient, until it is withdrawn. Withdrawals are pull-based — the recipient calls withdraw and receives up to what has accrued, capped by the contract's own accounting. Nothing moves automatically or unrequested.",
  },
  {
    q: 'Which token can I stream?',
    a: 'The deployed contract streams the XLM Stellar Asset Contract (SAC) on testnet. The contract itself is written generically against any SAC-compatible token address, so a future deployment could stream any Soroban asset.',
  },
  {
    q: 'Does the recipient need to do anything to receive funds?',
    a: "Yes — withdrawing is an explicit call the recipient makes, not something pushed to them automatically. That's a deliberate security pattern: contracts that push funds unprompted are a common source of exploits; pull-based withdrawal keeps the recipient in control of when the transfer happens.",
  },
];

export function Faq() {
  return (
    <section className="faq">
      <h2>Why streaming, not one-time payments</h2>
      <div className="faq-list">
        {FAQS.map(({ q, a }) => (
          <details className="faq-item" key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
