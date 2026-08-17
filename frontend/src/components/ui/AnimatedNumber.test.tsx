import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnimatedNumber } from './AnimatedNumber';

describe('AnimatedNumber', () => {
  it('renders the initial value formatted to the given decimals and suffix', () => {
    render(<AnimatedNumber value={5} decimals={2} suffix=" XLM" />);
    expect(screen.getByText('5.00 XLM')).toBeInTheDocument();
  });

  it('defaults to 7 decimals when none is given, matching XLM precision', () => {
    render(<AnimatedNumber value={1.5} />);
    expect(screen.getByText('1.5000000')).toBeInTheDocument();
  });

  it('converges to the new formatted value after the value prop changes', async () => {
    const { rerender } = render(<AnimatedNumber value={0} decimals={2} suffix=" XLM" />);
    expect(screen.getByText('0.00 XLM')).toBeInTheDocument();

    rerender(<AnimatedNumber value={10} decimals={2} suffix=" XLM" />);

    await waitFor(() => expect(screen.getByText('10.00 XLM')).toBeInTheDocument(), {
      timeout: 2000,
    });
  });

  it('settles on the latest value even when the target changes again mid-animation', async () => {
    const { rerender } = render(<AnimatedNumber value={0} decimals={2} />);

    rerender(<AnimatedNumber value={5} decimals={2} />);
    rerender(<AnimatedNumber value={8.5} decimals={2} />);

    await waitFor(() => expect(screen.getByText('8.50')).toBeInTheDocument(), { timeout: 2000 });
  });
});
