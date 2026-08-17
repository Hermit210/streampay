import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWallet } from './useWallet';
import * as freighter from '../../services/stellar/freighter';

const ADDRESS = 'GBDPNEIJUPJW2VJ2AFMUQGZZBG7VKLR5R4ZKKA4HSYVBEAWGUQVF7TEM';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useWallet', () => {
  it('starts disconnected when no prior Freighter session exists', async () => {
    vi.spyOn(freighter, 'getConnectedAddress').mockResolvedValue(null);

    const { result } = renderHook(() => useWallet());

    await waitFor(() => expect(result.current.connecting).toBe(false));
    expect(result.current.address).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('auto-fills the address if Freighter already granted access', async () => {
    vi.spyOn(freighter, 'getConnectedAddress').mockResolvedValue(ADDRESS);

    const { result } = renderHook(() => useWallet());

    await waitFor(() => expect(result.current.address).toBe(ADDRESS));
  });

  it('surfaces a readable error when Freighter is not installed', async () => {
    vi.spyOn(freighter, 'getConnectedAddress').mockResolvedValue(null);
    vi.spyOn(freighter, 'connectWallet').mockRejectedValue(
      new freighter.WalletError('Freighter wallet not found. Install the Freighter browser extension to continue.'),
    );

    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.connecting).toBe(false));

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.address).toBeNull();
    expect(result.current.error).toMatch(/Freighter wallet not found/);
  });

  it('surfaces a readable error when the wallet is on the wrong network', async () => {
    vi.spyOn(freighter, 'getConnectedAddress').mockResolvedValue(null);
    vi.spyOn(freighter, 'connectWallet').mockResolvedValue(ADDRESS);
    vi.spyOn(freighter, 'assertCorrectNetwork').mockRejectedValue(
      new freighter.WalletError('Wrong network selected in Freighter.'),
    );

    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.connecting).toBe(false));

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.address).toBeNull();
    expect(result.current.error).toMatch(/Wrong network/);
  });

  it('clears state on disconnect', async () => {
    vi.spyOn(freighter, 'getConnectedAddress').mockResolvedValue(ADDRESS);

    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.address).toBe(ADDRESS));

    act(() => result.current.disconnect());

    expect(result.current.address).toBeNull();
  });
});
