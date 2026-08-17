import { useCallback, useEffect, useRef, useState } from 'react';
import { getStream, balanceOf, type Stream } from '../../services/stellar/streams';
import { describeError } from '../../services/stellar/errors';
import { computeAccrued, computeAvailable, computeProgress, streamStatus } from './accrual';

const TICK_MS = 1000;
const RECONCILE_MS = 10_000;

export interface LiveStream {
  stream: Stream | null;
  loading: boolean;
  error: string | null;
  now: number;
  accruedStroops: bigint;
  availableStroops: bigint;
  progress: number;
  status: 'active' | 'completed' | 'canceled' | null;
  refetch: () => void;
}

/** Polls a stream once, then re-renders every second computing accrual
 * client-side from the known start/stop/deposit (no network call), and
 * periodically reconciles against the real on-chain balance_of so drift
 * from other parties withdrawing/canceling never lingers for long. */
export function useLiveStream(streamId: bigint | null): LiveStream {
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now() / 1000);
  const [reloadToken, setReloadToken] = useState(0);
  const streamRef = useRef<Stream | null>(null);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    if (streamId === null) {
      setStream(null);
      streamRef.current = null;
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getStream(streamId)
      .then((s) => {
        if (cancelled) return;
        setStream(s);
        streamRef.current = s;
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [streamId, reloadToken]);

  // Smooth per-second tick, purely client-side.
  useEffect(() => {
    if (streamId === null) return;
    const id = setInterval(() => setNow(Date.now() / 1000), TICK_MS);
    return () => clearInterval(id);
  }, [streamId]);

  // Periodic reconciliation against the real on-chain balance.
  useEffect(() => {
    if (streamId === null) return;
    const id = setInterval(() => {
      const current = streamRef.current;
      if (!current || current.canceled) return;
      Promise.all([balanceOf(streamId), getStream(streamId)])
        .then(([, freshStream]) => {
          setStream(freshStream);
          streamRef.current = freshStream;
        })
        .catch(() => {
          // A transient RPC hiccup here shouldn't interrupt the live ticking
          // display -- it will simply retry on the next interval.
        });
    }, RECONCILE_MS);
    return () => clearInterval(id);
  }, [streamId]);

  if (!stream) {
    return {
      stream: null,
      loading,
      error,
      now,
      accruedStroops: 0n,
      availableStroops: 0n,
      progress: 0,
      status: null,
      refetch,
    };
  }

  const accrualInput = {
    deposit: stream.deposit,
    startTime: stream.start_time,
    stopTime: stream.stop_time,
    withdrawn: stream.withdrawn,
    canceled: stream.canceled,
  };

  return {
    stream,
    loading,
    error,
    now,
    accruedStroops: computeAccrued(accrualInput, now),
    availableStroops: computeAvailable(accrualInput, now),
    progress: computeProgress(accrualInput, now),
    status: streamStatus(accrualInput, now),
    refetch,
  };
}
