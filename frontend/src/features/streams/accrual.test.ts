import { describe, expect, it } from 'vitest';
import { computeAccrued, computeAvailable, computeProgress, streamStatus, type AccrualInput } from './accrual';

const baseStream: AccrualInput = {
  deposit: 1_000n,
  startTime: 1_000n,
  stopTime: 2_000n, // 1000-second stream
  withdrawn: 0n,
  canceled: false,
};

describe('computeAccrued', () => {
  it('accrues nothing before the stream starts', () => {
    expect(computeAccrued(baseStream, 999)).toBe(0n);
    expect(computeAccrued(baseStream, 1_000)).toBe(0n);
  });

  it('accrues linearly, matching the contracts floor-division formula', () => {
    expect(computeAccrued(baseStream, 1_500)).toBe(500n);
    expect(computeAccrued(baseStream, 1_300)).toBe(300n);
  });

  it('floors fractional stroops the same way the contract does', () => {
    const oddStream: AccrualInput = { ...baseStream, deposit: 1_000n, stopTime: 1_003n };
    // elapsed=1 of 3 -> 1000*1/3 = 333.33 -> floors to 333
    expect(computeAccrued(oddStream, 1_001)).toBe(333n);
  });

  it('caps at the full deposit once stopTime has passed', () => {
    expect(computeAccrued(baseStream, 2_000)).toBe(1_000n);
    expect(computeAccrued(baseStream, 5_000)).toBe(1_000n);
  });

  it('treats a canceled stream as fully accrued regardless of time', () => {
    const canceled: AccrualInput = { ...baseStream, canceled: true };
    expect(computeAccrued(canceled, 1_100)).toBe(1_000n);
  });
});

describe('computeAvailable', () => {
  it('subtracts what has already been withdrawn', () => {
    const partiallyWithdrawn: AccrualInput = { ...baseStream, withdrawn: 200n };
    expect(computeAvailable(partiallyWithdrawn, 1_500)).toBe(300n);
  });

  it('never goes negative even if withdrawn exceeds accrued (stale data)', () => {
    const overWithdrawn: AccrualInput = { ...baseStream, withdrawn: 900n };
    expect(computeAvailable(overWithdrawn, 1_100)).toBe(0n);
  });
});

describe('computeProgress', () => {
  it('reports 0 before start and 1 at/after stop', () => {
    expect(computeProgress(baseStream, 500)).toBe(0);
    expect(computeProgress(baseStream, 2_000)).toBe(1);
    expect(computeProgress(baseStream, 9_999)).toBe(1);
  });

  it('reports fractional progress mid-stream', () => {
    expect(computeProgress(baseStream, 1_250)).toBeCloseTo(0.25);
  });

  it('reports 1 for a canceled stream even if time has not elapsed', () => {
    expect(computeProgress({ ...baseStream, canceled: true }, 1_100)).toBe(1);
  });
});

describe('streamStatus', () => {
  it('classifies active, completed, and canceled correctly', () => {
    expect(streamStatus(baseStream, 1_500)).toBe('active');
    expect(streamStatus(baseStream, 2_000)).toBe('completed');
    expect(streamStatus({ ...baseStream, canceled: true }, 1_100)).toBe('canceled');
  });
});
