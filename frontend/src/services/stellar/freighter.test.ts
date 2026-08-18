import { afterEach, describe, expect, it, vi } from 'vitest';
import freighter from '@stellar/freighter-api';
import { assertCorrectNetwork, WalletError } from './freighter';
import { NETWORK_PASSPHRASE } from './config';

vi.mock('@stellar/freighter-api', () => ({
  default: { getNetworkDetails: vi.fn() },
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('assertCorrectNetwork', () => {
  // Regression test for the real bug: Freighter genuinely on the right
  // network, but a stray leading space in the deployed
  // VITE_NETWORK_PASSPHRASE made a strict `!==` comparison fail.
  it('does not throw when the reported passphrase only differs by whitespace', async () => {
    vi.mocked(freighter.getNetworkDetails).mockResolvedValue({
      networkPassphrase: `  ${NETWORK_PASSPHRASE}  `,
    } as never);

    await expect(assertCorrectNetwork()).resolves.toBeUndefined();
  });

  it('does not throw when the configured passphrase itself has stray whitespace', async () => {
    vi.mocked(freighter.getNetworkDetails).mockResolvedValue({
      networkPassphrase: NETWORK_PASSPHRASE,
    } as never);

    await expect(assertCorrectNetwork()).resolves.toBeUndefined();
  });

  it('still throws a clear WalletError for a genuinely different network', async () => {
    vi.mocked(freighter.getNetworkDetails).mockResolvedValue({
      networkPassphrase: 'Public Global Stellar Network ; September 2015',
    } as never);

    await expect(assertCorrectNetwork()).rejects.toThrow(WalletError);
    await expect(assertCorrectNetwork()).rejects.toThrow(/Wrong network selected/);
  });
});
