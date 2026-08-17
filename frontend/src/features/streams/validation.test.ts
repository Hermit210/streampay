import { describe, expect, it } from 'vitest';
import { validateRecipient, validateDeposit, validateDuration } from './validation';

const VALID_ADDRESS = 'GBDPNEIJUPJW2VJ2AFMUQGZZBG7VKLR5R4ZKKA4HSYVBEAWGUQVF7TEM';
const OTHER_VALID_ADDRESS = 'GDF3WHUZM4O3C4TNK7MILLWAGP7GABHXBKUYFZK4SFNCDTRUETFTFGNB';

describe('validateRecipient', () => {
  it('accepts a well-formed Stellar public key distinct from the sender', () => {
    expect(validateRecipient(OTHER_VALID_ADDRESS, VALID_ADDRESS)).toBeNull();
  });

  it('rejects an empty address', () => {
    expect(validateRecipient('', VALID_ADDRESS)).toMatch(/required/i);
  });

  it('rejects a malformed address', () => {
    expect(validateRecipient('not-a-real-address', VALID_ADDRESS)).toMatch(/valid Stellar public key/i);
  });

  it('rejects streaming to yourself', () => {
    expect(validateRecipient(VALID_ADDRESS, VALID_ADDRESS)).toMatch(/cannot be the same/i);
  });
});

describe('validateDeposit', () => {
  it('accepts a positive amount with up to 7 decimals', () => {
    expect(validateDeposit('10.5')).toBeNull();
  });

  it('rejects zero, negative, and non-numeric input', () => {
    expect(validateDeposit('0')).toMatch(/greater than zero/i);
    expect(validateDeposit('-1')).not.toBeNull();
    expect(validateDeposit('abc')).not.toBeNull();
  });
});

describe('validateDuration', () => {
  it('accepts a positive whole number of seconds', () => {
    expect(validateDuration('60')).toBeNull();
  });

  it('rejects zero, fractional, and non-numeric durations', () => {
    expect(validateDuration('0')).toMatch(/greater than zero/i);
    expect(validateDuration('1.5')).toMatch(/whole number/i);
    expect(validateDuration('abc')).not.toBeNull();
  });
});
