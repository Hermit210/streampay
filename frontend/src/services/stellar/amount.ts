// XLM has 7 decimal places on-chain (the base unit is the "stroop").
const STROOPS_PER_XLM = 10_000_000n;

/** Parses a user-typed XLM amount (e.g. "10.5") into stroops as a bigint. */
export function xlmToStroops(xlm: string): bigint {
  const trimmed = xlm.trim();
  if (!/^\d+(\.\d{1,7})?$/.test(trimmed)) {
    throw new Error('Enter a valid amount with up to 7 decimal places');
  }
  const [whole, frac = ''] = trimmed.split('.');
  const paddedFrac = frac.padEnd(7, '0');
  return BigInt(whole) * STROOPS_PER_XLM + BigInt(paddedFrac || '0');
}

/** Formats stroops as a human-readable XLM string, trimming trailing zeros. */
export function stroopsToXlm(stroops: bigint | number | string): string {
  const value = BigInt(stroops);
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const whole = abs / STROOPS_PER_XLM;
  const frac = abs % STROOPS_PER_XLM;
  const fracStr = frac.toString().padStart(7, '0').replace(/0+$/, '');
  const sign = negative ? '-' : '';
  return fracStr ? `${sign}${whole}.${fracStr}` : `${sign}${whole}`;
}
