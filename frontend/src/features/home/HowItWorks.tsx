import { AnimatedNumber } from '../../components/ui/AnimatedNumber';
import { RevealGroup, RevealItem } from '../../components/ui/Reveal';
import { LockIcon, PulseIcon, WalletIcon, ScaleIcon } from '../../components/ui/icons';
import { useLiveStream } from '../streams/useLiveStream';
import { stroopsToXlmNumber, stroopsToXlm } from '../../services/stellar/amount';
import { DEMO_STREAM_ID, explorerTxUrl } from '../../services/stellar/config';
import './home.css';

const WITHDRAW_TX_HASH = 'c1401089933bd652a65d6b8915f8db4c88928a99f0a6cfa9e2866e2b0b998a15';
const CANCEL_TX_HASH = '3df09befea0d46744be77384a3c3a898af87ffec8f291340b3125407d3af0180';

export function HowItWorks() {
  const demo = useLiveStream(DEMO_STREAM_ID);
  const depositXlm = demo.stream ? stroopsToXlm(demo.stream.deposit) : null;

  return (
    <section className="how-it-works" id="how-it-works">
      <h2>How it works</h2>
      <RevealGroup className="steps">
        <RevealItem className="step">
          <LockIcon className="step-icon" />
          <h3>1. Lock funds</h3>
          <p>
            The sender calls <code>create_stream</code>, which pulls the
            deposit into the contract via a real inter-contract transfer to
            the XLM SAC.
            {depositXlm && (
              <>
                {' '}
                <strong>e.g. {depositXlm} XLM</strong>, in the live stream
                below.
              </>
            )}
          </p>
        </RevealItem>

        <RevealItem className="step">
          <PulseIcon className="step-icon" />
          <h3>2. Balance streams in real-time</h3>
          <p>
            The recipient's withdrawable balance grows every second —
            <code>deposit × elapsed / duration</code>, computed identically
            on-chain and in this UI. Right now, live:{' '}
            {demo.stream ? (
              <strong>
                <AnimatedNumber value={stroopsToXlmNumber(demo.accruedStroops)} decimals={4} /> XLM
              </strong>
            ) : (
              'loading…'
            )}
          </p>
        </RevealItem>

        <RevealItem className="step">
          <WalletIcon className="step-icon" />
          <h3>3. Withdraw anytime</h3>
          <p>
            The recipient withdraws up to their accrued balance whenever
            they like — no need to wait for the stream to finish.{' '}
            <a href={explorerTxUrl(WITHDRAW_TX_HASH)} target="_blank" rel="noreferrer">
              A real 5 XLM withdrawal ↗
            </a>{' '}
            from this contract, confirmed on testnet.
          </p>
        </RevealItem>

        <RevealItem className="step">
          <ScaleIcon className="step-icon" />
          <h3>4. Cancel anytime for a fair split</h3>
          <p>
            Either party can cancel early. The contract pays the recipient
            exactly what accrued and refunds the rest to the sender, in the
            same transaction.{' '}
            <a href={explorerTxUrl(CANCEL_TX_HASH)} target="_blank" rel="noreferrer">
              A real cancel ↗
            </a>{' '}
            shows the exact split, verified on-chain.
          </p>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
