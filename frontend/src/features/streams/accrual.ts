// Client-side mirror of the contract's `accrued()` function
// (contract/stream_pay/src/lib.rs). Kept as pure functions, independent of
// any UI, so the live-ticking balance display and the on-chain contract
// agree bit-for-bit (same floor-division integer math, no floating point).

export interface AccrualInput {
  deposit: bigint;
  startTime: bigint;
  stopTime: bigint;
  withdrawn: bigint;
  canceled: boolean;
}

export type StreamStatus = 'active' | 'completed' | 'canceled';

function toSeconds(now: number | bigint): bigint {
  return typeof now === 'bigint' ? now : BigInt(Math.floor(now));
}

/** Total amount unlocked so far (before subtracting withdrawals), matching the contract's floor-division formula. */
export function computeAccrued(stream: AccrualInput, now: number | bigint): bigint {
  const nowSeconds = toSeconds(now);
  if (nowSeconds <= stream.startTime) return 0n;
  if (nowSeconds >= stream.stopTime || stream.canceled) return stream.deposit;
  const elapsed = nowSeconds - stream.startTime;
  const totalDuration = stream.stopTime - stream.startTime;
  return (stream.deposit * elapsed) / totalDuration;
}

/** What the recipient could withdraw right now: accrued minus already-withdrawn, floored at zero. */
export function computeAvailable(stream: AccrualInput, now: number | bigint): bigint {
  const available = computeAccrued(stream, now) - stream.withdrawn;
  return available > 0n ? available : 0n;
}

/** Fraction of the stream's duration elapsed, in [0, 1], for progress bars. */
export function computeProgress(stream: AccrualInput, now: number | bigint): number {
  if (stream.canceled) return 1;
  const nowSeconds = toSeconds(now);
  if (nowSeconds <= stream.startTime) return 0;
  if (nowSeconds >= stream.stopTime) return 1;
  const elapsed = Number(nowSeconds - stream.startTime);
  const totalDuration = Number(stream.stopTime - stream.startTime);
  return elapsed / totalDuration;
}

export function streamStatus(stream: AccrualInput, now: number | bigint): StreamStatus {
  if (stream.canceled) return 'canceled';
  return toSeconds(now) >= stream.stopTime ? 'completed' : 'active';
}
