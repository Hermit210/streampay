import { useEffect, useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { getRecentStreams } from '../../services/stellar/streams';
import { describeError } from '../../services/stellar/errors';
import './streams.css';

export function StreamLookup({ onSelect }: { onSelect: (streamId: bigint) => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<bigint[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentListRef] = useAutoAnimate<HTMLDivElement>();

  useEffect(() => {
    let cancelled = false;
    getRecentStreams()
      .then((ids) => {
        if (!cancelled) setRecent(ids);
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingRecent(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit() {
    setError(null);
    const trimmed = input.trim();
    if (!/^\d+$/.test(trimmed)) {
      setError('Enter a valid stream ID (a whole number).');
      return;
    }
    onSelect(BigInt(trimmed));
    setInput('');
  }

  return (
    <Card title="View a stream">
      <div className="stream-lookup-row">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Stream ID, e.g. 0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button onClick={handleSubmit}>Load</Button>
      </div>
      <ErrorBanner message={error} />

      {loadingRecent ? (
        <p className="stream-note">Loading recent streams…</p>
      ) : recent.length > 0 ? (
        <div className="recent-streams" ref={recentListRef}>
          {recent.map((id) => (
            <button key={id.toString()} type="button" onClick={() => onSelect(id)}>
              #{id.toString()}
            </button>
          ))}
        </div>
      ) : (
        <p className="stream-note">No streams created yet.</p>
      )}
    </Card>
  );
}
