import { describe, expect, it } from 'vitest';
import { computeMissingEnvVars, normalizeEnvValue } from './config';

describe('computeMissingEnvVars', () => {
  it('returns an empty list when every required key is set', () => {
    const env = { A: 'x', B: 'y' };
    expect(computeMissingEnvVars(env, ['A', 'B'])).toEqual([]);
  });

  it('reports keys that are undefined', () => {
    const env = { A: 'x' };
    expect(computeMissingEnvVars(env, ['A', 'B'])).toEqual(['B']);
  });

  it('reports keys that are present but empty', () => {
    const env = { A: 'x', B: '' };
    expect(computeMissingEnvVars(env, ['A', 'B'])).toEqual(['B']);
  });

  it('reports every missing key, preserving order, not just the first', () => {
    const env = { B: 'y' };
    expect(computeMissingEnvVars(env, ['A', 'B', 'C'])).toEqual(['A', 'C']);
  });
});

describe('normalizeEnvValue', () => {
  // Regression test: a Vercel-set VITE_NETWORK_PASSPHRASE with a stray
  // leading space caused a strict `!==` comparison in
  // freighter.ts#assertCorrectNetwork to fail even though the value
  // looked correct, producing "Wrong network selected in Freighter" with
  // Freighter genuinely on the right network.
  it('strips a leading space, matching the real value that broke the network check', () => {
    expect(normalizeEnvValue(' Test SDF Network ; September 2015')).toBe(
      'Test SDF Network ; September 2015',
    );
  });

  it('strips trailing whitespace too', () => {
    expect(normalizeEnvValue('https://soroban-testnet.stellar.org  ')).toBe(
      'https://soroban-testnet.stellar.org',
    );
  });

  it('leaves an already-clean value unchanged', () => {
    expect(normalizeEnvValue('CDPD3ZKG2CASLYS4GAZII6DLQG5R62QEE2JKJO7IWLKOWNDZA6J3WPVL')).toBe(
      'CDPD3ZKG2CASLYS4GAZII6DLQG5R62QEE2JKJO7IWLKOWNDZA6J3WPVL',
    );
  });

  it('treats undefined the same as an empty string', () => {
    expect(normalizeEnvValue(undefined)).toBe('');
  });
});
