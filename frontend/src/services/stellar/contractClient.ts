import { contract as sdkContract, rpc } from '@stellar/stellar-sdk';
import { CONTRACT_ID, NETWORK_PASSPHRASE, RPC_URL } from './config';
import { signTransactionXdr } from './freighter';

export interface Stream {
  id: bigint;
  sender: string;
  recipient: string;
  token: string;
  deposit: bigint;
  start_time: bigint;
  stop_time: bigint;
  withdrawn: bigint;
  canceled: boolean;
}

type Result<T> = sdkContract.Result<T>;
type Tx<T> = Promise<sdkContract.AssembledTransaction<T>>;

/** Method signatures for the deployed StreamPay contract, hand-written to
 * match `contract/stream_pay/src/lib.rs` since we call the on-chain spec
 * directly instead of generating TS bindings. */
export interface StreamPayContract {
  create_stream: (args: {
    sender: string;
    recipient: string;
    token: string;
    deposit: bigint;
    duration_seconds: bigint;
  }) => Tx<Result<bigint>>;
  balance_of: (args: { stream_id: bigint }) => Tx<Result<bigint>>;
  withdraw: (args: { stream_id: bigint; recipient: string; amount: bigint }) => Tx<Result<undefined>>;
  cancel: (args: { stream_id: bigint; caller: string }) => Tx<Result<undefined>>;
  get_stream: (args: { stream_id: bigint }) => Tx<Result<Stream>>;
  get_recent_streams: () => Tx<bigint[]>;
}

let cachedClient: (sdkContract.Client & StreamPayContract) | null = null;

/** Lazily builds (and caches) the typed contract client, wired to sign
 * outgoing transactions through Freighter for the given connected address. */
export async function getStreamPayClient(
  address?: string,
): Promise<sdkContract.Client & StreamPayContract> {
  if (cachedClient && (!address || cachedClient.options.publicKey === address)) {
    return cachedClient;
  }
  const client = await sdkContract.Client.from<StreamPayContract>({
    contractId: CONTRACT_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    publicKey: address,
    signTransaction: address
      ? (xdr) => signTransactionXdr(xdr, address).then((signedTxXdr) => ({ signedTxXdr }))
      : undefined,
  });
  cachedClient = client;
  return client;
}

export function getRpcServer(): rpc.Server {
  return new rpc.Server(RPC_URL);
}
