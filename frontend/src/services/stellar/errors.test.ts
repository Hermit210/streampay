import { describe, expect, it } from 'vitest';
import { describeError } from './errors';

describe('describeError', () => {
  it('maps known contract error codes to human-readable messages', () => {
    expect(describeError(new Error('Error(Contract, #5)'))).toMatch(/only the recipient/i);
    expect(describeError(new Error('Error(Contract, #3)'))).toMatch(/stream not found/i);
    expect(describeError(new Error('Error(Contract, #7)'))).toMatch(/exceeds what has accrued/i);
  });

  it('falls back to a generic message for an unrecognized contract error code', () => {
    expect(describeError(new Error('Error(Contract, #99)'))).toMatch(/code 99/);
  });

  it('recognizes a wallet rejection distinct from a contract error', () => {
    expect(describeError(new Error('User declined access in wallet'))).toMatch(/rejected in the wallet/i);
  });

  it('passes through any other Error message verbatim', () => {
    expect(describeError(new Error('Network request failed'))).toBe('Network request failed');
  });

  it('falls back to a generic message for non-Error throws', () => {
    expect(describeError('a plain string')).toMatch(/something went wrong/i);
    expect(describeError(undefined)).toMatch(/something went wrong/i);
  });
});
