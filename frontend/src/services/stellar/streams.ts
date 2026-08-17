import type { contract as sdkContract } from '@stellar/stellar-sdk';
import { getStreamPayClient, type Stream } from './contractClient';

export type { Stream };

export interface TxOutcome<T> {
  value: T;
  hash?: string;
}

async function sendAndUnwrap<T>(
  txPromise: Promise<sdkContract.AssembledTransaction<sdkContract.Result<T>>>,
): Promise<TxOutcome<T>> {
  const assembled = await txPromise;
  const sent = await assembled.signAndSend();
  const value = sent.result.unwrap();
  return { value, hash: sent.sendTransactionResponse?.hash };
}

export async function createStream(params: {
  address: string;
  sender: string;
  recipient: string;
  token: string;
  depositStroops: bigint;
  durationSeconds: bigint;
}): Promise<TxOutcome<bigint>> {
  const client = await getStreamPayClient(params.address);
  const tx = client.create_stream({
    sender: params.sender,
    recipient: params.recipient,
    token: params.token,
    deposit: params.depositStroops,
    duration_seconds: params.durationSeconds,
  });
  return sendAndUnwrap<bigint>(tx);
}

export async function withdraw(params: {
  address: string;
  streamId: bigint;
  recipient: string;
  amountStroops: bigint;
}): Promise<TxOutcome<undefined>> {
  const client = await getStreamPayClient(params.address);
  const tx = client.withdraw({
    stream_id: params.streamId,
    recipient: params.recipient,
    amount: params.amountStroops,
  });
  return sendAndUnwrap<undefined>(tx);
}

export async function cancelStream(params: {
  address: string;
  streamId: bigint;
  caller: string;
}): Promise<TxOutcome<undefined>> {
  const client = await getStreamPayClient(params.address);
  const tx = client.cancel({
    stream_id: params.streamId,
    caller: params.caller,
  });
  return sendAndUnwrap<undefined>(tx);
}

export async function getStream(streamId: bigint): Promise<Stream> {
  const client = await getStreamPayClient();
  const assembled = await client.get_stream({ stream_id: streamId });
  return assembled.result.unwrap();
}

export async function balanceOf(streamId: bigint): Promise<bigint> {
  const client = await getStreamPayClient();
  const assembled = await client.balance_of({ stream_id: streamId });
  return assembled.result.unwrap();
}

export async function getRecentStreams(): Promise<bigint[]> {
  const client = await getStreamPayClient();
  const assembled = await client.get_recent_streams();
  return assembled.result;
}
