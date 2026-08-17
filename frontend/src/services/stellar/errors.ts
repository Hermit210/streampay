// Maps the contract's #[contracterror] StreamError codes (see
// contract/stream_pay/src/lib.rs) to human-readable messages. Soroban
// surfaces contract errors as strings like "Error(Contract, #5)", so we
// match on the numeric code rather than relying on any particular message
// format.
const STREAM_ERROR_MESSAGES: Record<number, string> = {
  1: 'Duration must be greater than zero.',
  2: 'Deposit must be greater than zero.',
  3: 'Stream not found.',
  4: 'This stream has already been canceled.',
  5: 'Only the recipient of this stream can withdraw from it.',
  6: 'Only the sender or recipient of this stream can cancel it.',
  7: 'Amount requested exceeds what has accrued so far.',
  8: 'Nothing is available to withdraw yet.',
};

/** Normalizes any error thrown by wallet or contract calls into a message safe to show a user. */
export function describeError(error: unknown): string {
  if (error instanceof Error) {
    const contractMatch = error.message.match(/Error\(Contract, #(\d+)\)/);
    if (contractMatch) {
      const code = Number(contractMatch[1]);
      return STREAM_ERROR_MESSAGES[code] ?? `Contract rejected the call (code ${code}).`;
    }
    if (/reject|declin|cancel/i.test(error.message) && /user|wallet/i.test(error.message)) {
      return 'Request was rejected in the wallet.';
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
