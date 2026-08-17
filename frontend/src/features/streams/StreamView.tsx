import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { withdraw, cancelStream } from '../../services/stellar/streams';
import { stroopsToXlm, xlmToStroops } from '../../services/stellar/amount';
import { describeError } from '../../services/stellar/errors';
import { explorerTxUrl } from '../../services/stellar/config';
import { useLiveStream } from './useLiveStream';
import { ActivityLog } from './ActivityLog';
import './streams.css';

function shorten(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function StreamView({ streamId, address }: { streamId: bigint; address: string | null }) {
  const live = useLiveStream(streamId);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionHash, setActionHash] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [activityRefreshToken, setActivityRefreshToken] = useState(0);

  if (live.loading && !live.stream) {
    return (
      <Card title={`Stream #${streamId.toString()}`}>
        <div className="stream-loading">
          <Spinner /> Loading stream…
        </div>
      </Card>
    );
  }

  if (live.error && !live.stream) {
    return (
      <Card title={`Stream #${streamId.toString()}`}>
        <ErrorBanner message={live.error} />
      </Card>
    );
  }

  if (!live.stream) return null;
  const { stream } = live;

  const isRecipient = address === stream.recipient;
  const isSender = address === stream.sender;
  const canWithdraw = isRecipient && live.status !== 'canceled' && live.availableStroops > 0n;
  const canCancel = (isSender || isRecipient) && live.status === 'active';

  async function handleWithdraw() {
    if (!address) return;
    setActionError(null);
    setActionHash(null);
    let amountStroops: bigint;
    try {
      amountStroops = withdrawAmount.trim()
        ? xlmToStroops(withdrawAmount)
        : live.availableStroops;
    } catch (err) {
      setActionError(describeError(err));
      return;
    }
    if (amountStroops <= 0n) {
      setActionError('Nothing available to withdraw yet.');
      return;
    }
    setWithdrawing(true);
    try {
      const outcome = await withdraw({
        address,
        streamId,
        recipient: address,
        amountStroops,
      });
      setActionHash(outcome.hash ?? null);
      setWithdrawAmount('');
      live.refetch();
      setActivityRefreshToken((t) => t + 1);
    } catch (err) {
      setActionError(describeError(err));
    } finally {
      setWithdrawing(false);
    }
  }

  async function handleCancel() {
    if (!address) return;
    setActionError(null);
    setActionHash(null);
    setCanceling(true);
    try {
      const outcome = await cancelStream({ address, streamId, caller: address });
      setActionHash(outcome.hash ?? null);
      live.refetch();
      setActivityRefreshToken((t) => t + 1);
    } catch (err) {
      setActionError(describeError(err));
    } finally {
      setCanceling(false);
    }
  }

  return (
    <Card
      title={`Stream #${streamId.toString()}`}
      actions={live.status && <StatusBadge status={live.status} />}
    >
      <div className="stream-parties">
        <div>
          <span className="party-label">Sender</span>
          <span className="party-value" title={stream.sender}>
            {shorten(stream.sender)}
          </span>
        </div>
        <div>
          <span className="party-label">Recipient</span>
          <span className="party-value" title={stream.recipient}>
            {shorten(stream.recipient)}
          </span>
        </div>
      </div>

      <div className="stream-progress-track">
        <div
          className="stream-progress-fill"
          style={{ width: `${Math.min(100, live.progress * 100)}%` }}
        />
      </div>

      <div className="live-balance">
        <span className="live-balance-label">
          {isRecipient ? 'Your withdrawable balance' : 'Accrued to recipient'}
        </span>
        <span className="live-balance-value">{stroopsToXlm(live.availableStroops)} XLM</span>
        <span className="live-balance-sub">of {stroopsToXlm(stream.deposit)} XLM total</span>
      </div>

      {canWithdraw && (
        <div className="stream-action">
          <label>
            Withdraw amount (XLM) — leave blank for max
            <input
              type="text"
              inputMode="decimal"
              placeholder={stroopsToXlm(live.availableStroops)}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={withdrawing}
            />
          </label>
          <Button onClick={handleWithdraw} loading={withdrawing}>
            Withdraw
          </Button>
        </div>
      )}

      {canCancel && (
        <div className="stream-action">
          <Button variant="danger" onClick={handleCancel} loading={canceling}>
            Cancel stream
          </Button>
        </div>
      )}

      {live.status === 'canceled' && <p className="stream-note">This stream was canceled.</p>}
      {live.status === 'completed' && !isRecipient && !isSender && (
        <p className="stream-note">This stream has fully vested.</p>
      )}

      <ErrorBanner message={actionError} />
      {actionHash && (
        <div className="create-success" role="status">
          <p>Transaction confirmed.</p>
          <a href={explorerTxUrl(actionHash)} target="_blank" rel="noreferrer">
            View transaction ↗
          </a>
        </div>
      )}

      <div className="activity-section">
        <span className="party-label">Recent activity</span>
        <ActivityLog streamId={streamId} refreshToken={activityRefreshToken} />
      </div>
    </Card>
  );
}
