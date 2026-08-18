import { describe, expect, it } from 'vitest';
import { computeMissingEnvVars } from './config';

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
