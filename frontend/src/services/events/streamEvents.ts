import { scValToNative } from '@stellar/stellar-sdk';
import { getRpcServer } from '../stellar/contractClient';
import { CONTRACT_ID } from '../stellar/config';

export type StreamEventKind = 'created' | 'withdrawn' | 'canceled';

export interface StreamEvent {
  id: string;
  kind: StreamEventKind;
  streamId: bigint;
  amount?: bigint;
  ledger: number;
  txHash: string;
}

// RPC providers only retain events for a bounded ledger window (commonly a
// few hours to a few days). ~4000 ledgers is comfortably inside that on
// testnet's ~5s ledger close time, and is plenty for a "recent activity"
// feed on a single stream rather than a full archival history.
const RECENT_LEDGER_WINDOW = 4000;

const KNOWN_KINDS: readonly StreamEventKind[] = ['created', 'withdrawn', 'canceled'];

function isStreamEventKind(value: unknown): value is StreamEventKind {
  return typeof value === 'string' && (KNOWN_KINDS as readonly string[]).includes(value);
}

/** Fetches real Soroban events emitted by the StreamPay contract for one
 * stream, filtered from the "stream" topic family it publishes on every
 * create/withdraw/cancel. Returns newest-first. */
export async function fetchRecentStreamEvents(streamId: bigint): Promise<StreamEvent[]> {
  const server = getRpcServer();
  const latest = await server.getLatestLedger();
  const startLedger = Math.max(1, latest.sequence - RECENT_LEDGER_WINDOW);

  const response = await server.getEvents({
    startLedger,
    filters: [{ type: 'contract', contractIds: [CONTRACT_ID] }],
    limit: 100,
  });

  const events: StreamEvent[] = [];
  for (const e of response.events) {
    const topics = e.topic.map((t) => scValToNative(t));
    if (topics[0] !== 'stream' || !isStreamEventKind(topics[1])) continue;
    const kind = topics[1];

    const value = scValToNative(e.value);
    const [eventStreamId, amount] =
      kind === 'withdrawn' ? (value as [bigint, bigint]) : [value as bigint, undefined];

    if (eventStreamId !== streamId) continue;

    events.push({
      id: e.id,
      kind,
      streamId: eventStreamId,
      amount,
      ledger: e.ledger,
      txHash: e.txHash,
    });
  }

  return events.reverse();
}
