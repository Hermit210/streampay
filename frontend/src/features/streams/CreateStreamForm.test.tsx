import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateStreamForm } from './CreateStreamForm';
import * as streamsService from '../../services/stellar/streams';

const VALID_RECIPIENT = 'GDF3WHUZM4O3C4TNK7MILLWAGP7GABHXBKUYFZK4SFNCDTRUETFTFGNB';

describe('CreateStreamForm', () => {
  it('prompts to connect a wallet instead of allowing submission when disconnected', () => {
    render(<CreateStreamForm address={null} />);

    expect(screen.getByRole('button', { name: /connect wallet to create/i })).toBeDisabled();
  });

  it('shows field-level validation errors instead of submitting when the form is invalid', async () => {
    const user = userEvent.setup();
    const createStreamSpy = vi.spyOn(streamsService, 'createStream');

    render(<CreateStreamForm address="GBDPNEIJUPJW2VJ2AFMUQGZZBG7VKLR5R4ZKKA4HSYVBEAWGUQVF7TEM" />);

    await user.click(screen.getByRole('button', { name: /create stream/i }));

    expect(await screen.findByText(/recipient address is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/deposit amount is required/i)).toBeInTheDocument();
    expect(createStreamSpy).not.toHaveBeenCalled();
  });

  it('calls createStream with the entered values once the form is valid', async () => {
    const user = userEvent.setup();
    const address = 'GBDPNEIJUPJW2VJ2AFMUQGZZBG7VKLR5R4ZKKA4HSYVBEAWGUQVF7TEM';
    vi.spyOn(streamsService, 'createStream').mockResolvedValue({
      value: 7n,
      hash: 'deadbeef',
    });

    render(<CreateStreamForm address={address} />);

    await user.type(screen.getByPlaceholderText(/GABC/), VALID_RECIPIENT);
    await user.type(screen.getByPlaceholderText('10'), '10');
    await user.click(screen.getByRole('button', { name: /create stream/i }));

    const successBanner = await screen.findByRole('status');
    expect(successBanner).toHaveTextContent('Stream #7 created.');
    expect(streamsService.createStream).toHaveBeenCalledWith(
      expect.objectContaining({
        address,
        sender: address,
        recipient: VALID_RECIPIENT,
        depositStroops: 100_000_000n,
      }),
    );
  });
});
