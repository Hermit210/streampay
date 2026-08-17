import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber';
import { Spinner } from '../../components/ui/Spinner';
import { useLiveStream } from '../streams/useLiveStream';
import { stroopsToXlmNumber } from '../../services/stellar/amount';
import { DEMO_STREAM_ID, explorerTxUrl } from '../../services/stellar/config';
import './home.css';

export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const demo = useLiveStream(DEMO_STREAM_ID);

  return (
    <section className="hero">
      <motion.div
        className="hero-copy"
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: 'easeOut' }}
      >
        <span className="hero-eyebrow">Stellar Soroban · Testnet</span>
        <h1>
          Money that flows,
          <br />
          not one lump sum.
        </h1>
        <p className="hero-pitch">
          Real-time streaming payments on Stellar. A sender locks funds into a
          stream; the recipient's balance grows every second, withdrawable
          anytime; either side can cancel for an instantly fair split.
        </p>
        <div className="hero-actions">
          <Link className="hero-cta" to="/app">
            Launch app
          </Link>
          <Link className="hero-cta-secondary" to="/how-it-works">
            See how it works
          </Link>
        </div>
      </motion.div>

      <motion.a
        className="hero-proof"
        href={explorerTxUrl('b00781879368ac0439ce9f7523245c49b8beb78288bb2da7b76c7a4807b9eba6')}
        target="_blank"
        rel="noreferrer"
        initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.15, ease: 'easeOut' }}
      >
        <span className="hero-proof-label">Live on testnet right now — stream #2</span>
        {demo.stream ? (
          <span className="hero-proof-value">
            <AnimatedNumber value={stroopsToXlmNumber(demo.accruedStroops)} decimals={4} />
            <span className="hero-proof-unit"> / 100 XLM streamed</span>
          </span>
        ) : (
          <span className="hero-proof-loading">
            <Spinner size={16} /> Loading real stream data…
          </span>
        )}
        <span className="hero-proof-hint">real contract call, updates every second ↗</span>
      </motion.a>
    </section>
  );
}
