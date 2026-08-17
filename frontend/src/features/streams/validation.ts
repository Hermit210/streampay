import { StrKey } from '@stellar/stellar-sdk';

export function validateRecipient(address: string, selfAddress: string | null): string | null {
  const trimmed = address.trim();
  if (!trimmed) return 'Recipient address is required.';
  if (!StrKey.isValidEd25519PublicKey(trimmed)) {
    return 'Enter a valid Stellar public key (starts with G).';
  }
  if (selfAddress && trimmed === selfAddress) {
    return 'Recipient cannot be the same as the sender.';
  }
  return null;
}

export function validateDeposit(xlm: string): string | null {
  const trimmed = xlm.trim();
  if (!trimmed) return 'Deposit amount is required.';
  if (!/^\d+(\.\d{1,7})?$/.test(trimmed)) {
    return 'Enter a valid amount (up to 7 decimal places).';
  }
  if (Number(trimmed) <= 0) return 'Deposit must be greater than zero.';
  return null;
}

export function validateDuration(seconds: string): string | null {
  const trimmed = seconds.trim();
  if (!trimmed) return 'Duration is required.';
  if (!/^\d+$/.test(trimmed)) return 'Duration must be a whole number of seconds.';
  if (Number(trimmed) <= 0) return 'Duration must be greater than zero.';
  return null;
}
