import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StreamView } from './StreamView';
import * as streamsService from '../../services/stellar/streams';
import * as streamEvents from '../../services/events/streamEvents';

const SENDER = 'GA7EDDSXVFXL7KO6RDARLEKVAN3PB4JEPLJAUFVATHOFZHGBAN4GZPO2';
const RECIPIENT = 'GDF3WHUZM4O3C4TNK7MILLWAGP7GABHXBKUYFZK4SFNCDTRUETFTFGNB';
const STRANGER = 'GBDPNEIJUPJW2VJ2AFMUQGZZBG7VKLR5R4ZKKA4HSYVBEAWGUQVF7TEM';

function makeStream(overrides: Partial<streamsService.Stream> = {}): streamsService.Stream {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return {
    id: 0n,
    sender: SENDER,
    recipient: RECIPIENT,
    token: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    deposit: 100_000_000n,
    start_time: now - 500n,
    stop_time: now + 500n,
    withdrawn: 0n,
    canceled: false,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

function stubActivityFeed() {
  vi.spyOn(streamEvents, 'fetchRecentStreamEvents').mockResolvedValue([]);
}

describe('StreamView withdraw guard logic', () => {
  it('does not show withdraw controls to anyone other than the recipient', async () => {
    stubActivityFeed();
    vi.spyOn(streamsService, 'getStream').mockResolvedValue(makeStream());
    vi.spyOn(streamsService, 'balanceOf').mockResolvedValue(50_000_000n);
    const withdrawSpy = vi.spyOn(streamsService, 'withdraw');

    render(<StreamView streamId={0n} address={STRANGER} />);

    await waitFor(() => expect(screen.getByText(/Stream #0/)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Withdraw' })).not.toBeInTheDocument();
    expect(withdrawSpy).not.toHaveBeenCalled();
  });

  it('does not show withdraw controls to the recipient when nothing has accrued yet', async () => {
    stubActivityFeed();
    const now = BigInt(Math.floor(Date.now() / 1000));
    vi.spyOn(streamsService, 'getStream').mockResolvedValue(
      makeStream({ start_time: now, stop_time: now + 1000n }),
    );
    vi.spyOn(streamsService, 'balanceOf').mockResolvedValue(0n);

    render(<StreamView streamId={0n} address={RECIPIENT} />);

    await waitFor(() => expect(screen.getByText(/Stream #0/)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Withdraw' })).not.toBeInTheDocument();
  });

  it('surfaces the contracts rejection, not a false success, when withdrawing more than accrued', async () => {
    stubActivityFeed();
    vi.spyOn(streamsService, 'getStream').mockResolvedValue(makeStream({ withdrawn: 0n }));
    vi.spyOn(streamsService, 'balanceOf').mockResolvedValue(50_000_000n);
    vi.spyOn(streamsService, 'withdraw').mockRejectedValue(new Error('Error(Contract, #7)'));

    const user = userEvent.setup();
    render(<StreamView streamId={0n} address={RECIPIENT} />);

    const withdrawButton = await screen.findByRole('button', { name: 'Withdraw' });
    const amountInput = screen.getByPlaceholderText(/\d/);
    await user.type(amountInput, '99999');
    await user.click(withdrawButton);

    expect(
      await screen.findByText(/exceeds what has accrued so far/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Transaction confirmed.')).not.toBeInTheDocument();
  });
});
