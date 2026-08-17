import { useEffect, useState } from 'react';
import { fetchRecentStreamEvents, type StreamEvent } from '../../services/events/streamEvents';
import { stroopsToXlm } from '../../services/stellar/amount';
import { explorerTxUrl } from '../../services/stellar/config';
import { Spinner } from '../../components/ui/Spinner';
import './streams.css';

const LABELS: Record<StreamEvent['kind'], string> = {
  created: 'Stream created',
  withdrawn: 'Withdrawal',
  canceled: 'Stream canceled',
};

function shortenHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

/** Live activity feed for one stream, built from real on-chain Soroban
 * events (see services/events/streamEvents.ts) rather than local state --
 * this is what actually proves the contract is emitting events, not just
 * returning values. */
export function ActivityLog({ streamId, refreshToken }: { streamId: bigint; refreshToken: number }) {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRecentStreamEvents(streamId)
      .then((result) => {
        if (!cancelled) setEvents(result);
      })
      .catch(() => {
        // Event history is supplementary to the live balance, which already
        // has its own error handling -- fail quietly here and just show
        // nothing rather than a second error banner for the same stream.
        if (!cancelled) setError('Could not load recent activity.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [streamId, refreshToken]);

  if (loading) {
    return (
      <div className="stream-loading">
        <Spinner size={14} /> Loading activity…
      </div>
    );
  }

  if (error) return <p className="stream-note">{error}</p>;
  if (events.length === 0) return <p className="stream-note">No recent on-chain activity found.</p>;

  return (
    <ul className="activity-log">
      {events.map((event) => (
        <li key={event.id}>
          <span className="activity-kind">{LABELS[event.kind]}</span>
          {event.amount !== undefined && (
            <span className="activity-amount">{stroopsToXlm(event.amount)} XLM</span>
          )}
          <a
            className="activity-link"
            href={explorerTxUrl(event.txHash)}
            target="_blank"
            rel="noreferrer"
          >
            {shortenHash(event.txHash)} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}
