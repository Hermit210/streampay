import { describe, expect, it } from 'vitest';
import { xlmToStroops, stroopsToXlm } from './amount';

describe('xlmToStroops', () => {
  it('converts whole and fractional XLM amounts', () => {
    expect(xlmToStroops('10')).toBe(100_000_000n);
    expect(xlmToStroops('10.5')).toBe(105_000_000n);
    expect(xlmToStroops('0.0000001')).toBe(1n);
  });

  it('rejects invalid input instead of silently truncating', () => {
    expect(() => xlmToStroops('abc')).toThrow();
    expect(() => xlmToStroops('-5')).toThrow();
    expect(() => xlmToStroops('1.00000001')).toThrow(); // 8 decimals, too precise
  });
});

describe('stroopsToXlm', () => {
  it('formats stroops back to a trimmed XLM string', () => {
    expect(stroopsToXlm(100_000_000n)).toBe('10');
    expect(stroopsToXlm(105_000_000n)).toBe('10.5');
    expect(stroopsToXlm(0n)).toBe('0');
  });

  it('round-trips through xlmToStroops', () => {
    expect(stroopsToXlm(xlmToStroops('42.1234567'))).toBe('42.1234567');
  });
});
