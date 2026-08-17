import { useState, type FormEvent } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { createStream } from '../../services/stellar/streams';
import { xlmToStroops } from '../../services/stellar/amount';
import { describeError } from '../../services/stellar/errors';
import { explorerTxUrl, TOKEN_ID } from '../../services/stellar/config';
import { validateRecipient, validateDeposit, validateDuration } from './validation';
import './streams.css';

const DURATION_UNITS = [
  { label: 'seconds', seconds: 1 },
  { label: 'minutes', seconds: 60 },
  { label: 'hours', seconds: 3600 },
  { label: 'days', seconds: 86400 },
];

interface CreatedStream {
  id: bigint;
  hash?: string;
}

export function CreateStreamForm({
  address,
  onCreated,
}: {
  address: string | null;
  onCreated?: (streamId: bigint) => void;
}) {
  const [recipient, setRecipient] = useState('');
  const [deposit, setDeposit] = useState('');
  const [durationValue, setDurationValue] = useState('60');
  const [durationUnitIndex, setDurationUnitIndex] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedStream | null>(null);

  const durationSeconds = String(
    Number(durationValue || 0) * DURATION_UNITS[durationUnitIndex].seconds,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setCreated(null);

    if (!address) {
      setSubmitError('Connect your wallet before creating a stream.');
      return;
    }

    const errors = {
      recipient: validateRecipient(recipient, address),
      deposit: validateDeposit(deposit),
      duration: validateDuration(durationSeconds),
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setSubmitting(true);
    try {
      const outcome = await createStream({
        address,
        sender: address,
        recipient: recipient.trim(),
        token: TOKEN_ID,
        depositStroops: xlmToStroops(deposit),
        durationSeconds: BigInt(durationSeconds),
      });
      setCreated({ id: outcome.value, hash: outcome.hash });
      setRecipient('');
      setDeposit('');
      onCreated?.(outcome.value);
    } catch (err) {
      setSubmitError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Create a stream">
      <form className="stream-form" onSubmit={handleSubmit}>
        <label>
          Recipient address
          <input
            type="text"
            placeholder="GABC…"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={submitting}
          />
          {fieldErrors.recipient && <span className="field-error">{fieldErrors.recipient}</span>}
        </label>

        <label>
          Deposit (XLM)
          <input
            type="text"
            inputMode="decimal"
            placeholder="10"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            disabled={submitting}
          />
          {fieldErrors.deposit && <span className="field-error">{fieldErrors.deposit}</span>}
        </label>

        <div className="duration-row">
          <label>
            Duration
            <input
              type="text"
              inputMode="numeric"
              value={durationValue}
              onChange={(e) => setDurationValue(e.target.value)}
              disabled={submitting}
            />
          </label>
          <label>
            Unit
            <select
              value={durationUnitIndex}
              onChange={(e) => setDurationUnitIndex(Number(e.target.value))}
              disabled={submitting}
            >
              {DURATION_UNITS.map((unit, i) => (
                <option key={unit.label} value={i}>
                  {unit.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {fieldErrors.duration && <span className="field-error">{fieldErrors.duration}</span>}

        <Button type="submit" loading={submitting} disabled={!address}>
          {address ? 'Create stream' : 'Connect wallet to create a stream'}
        </Button>

        <ErrorBanner message={submitError} />

        {created && (
          <div className="create-success" role="status">
            <p>
              Stream <strong>#{created.id.toString()}</strong> created.
            </p>
            {created.hash && (
              <a href={explorerTxUrl(created.hash)} target="_blank" rel="noreferrer">
                View transaction ↗
              </a>
            )}
          </div>
        )}
      </form>
    </Card>
  );
}
