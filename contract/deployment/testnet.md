# StreamPay — Testnet Deployment Record

## Network
Stellar Testnet (Soroban RPC: https://soroban-testnet.stellar.org)

## Contract
- **Contract address**: `CDPD3ZKG2CASLYS4GAZII6DLQG5R62QEE2JKJO7IWLKOWNDZA6J3WPVL`
- **Wasm hash**: `bcbad19a003e5d10adebbd38657f3956f02cec6b0f2bbada1961eee83b1d9bf4`
- **Deploy tx**: https://stellar.expert/explorer/testnet/tx/f82e2d123f16a5d12a9eeb844828714533aea5cfa7f3381be157a4598f26a9dc
- **Deployer**: `GBDPNEIJUPJW2VJ2AFMUQGZZBG7VKLR5R4ZKKA4HSYVBEAWGUQVF7TEM` (identity: deployer, reused from Yellow Belt)

## Testnet XLM SAC (native asset token contract)
`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
(derived via `stellar contract id asset --asset native --network testnet`, not guessed)

## End-to-end test identities
- **sender**: `GA7EDDSXVFXL7KO6RDARLEKVAN3PB4JEPLJAUFVATHOFZHGBAN4GZPO2`
- **recipient**: `GDF3WHUZM4O3C4TNK7MILLWAGP7GABHXBKUYFZK4SFNCDTRUETFTFGNB`
- Both funded 10,000 XLM via Friendbot.

## End-to-end test transcript

1. **create_stream** — sender streams 10 XLM (100,000,000 stroops) to recipient over 60 seconds.
   - Tx: https://stellar.expert/explorer/testnet/tx/6eb7f2668b4c7c7e7013ac7924db72d3ba92f093d377ca650ab22a4649f0fbb3
   - Horizon verify: https://horizon-testnet.stellar.org/transactions/6eb7f2668b4c7c7e7013ac7924db72d3ba92f093d377ca650ab22a4649f0fbb3
   - Emitted a real `transfer` event on the XLM SAC (100000000 stroops, sender -> contract), plus a `stream created` event (stream id 0) on StreamPay — confirms the inter-contract call.
   - Returned stream id: `0`

2. **balance_of(0)** — checked ~41s into the 60s stream.
   - Result: `68333333` stroops (~6.83 XLM), matching `deposit * elapsed / duration` (100000000 * 41 / 60 ≈ 68333333) — confirms linear accrual math is live on-chain.

3. **withdraw(0, recipient, 50000000)** — recipient withdraws 5 XLM of their accrued balance.
   - **Tx hash**: `c1401089933bd652a65d6b8915f8db4c88928a99f0a6cfa9e2866e2b0b998a15`
   - Stellar Expert: https://stellar.expert/explorer/testnet/tx/c1401089933bd652a65d6b8915f8db4c88928a99f0a6cfa9e2866e2b0b998a15
   - Horizon verify (independent of Stellar Expert): https://horizon-testnet.stellar.org/transactions/c1401089933bd652a65d6b8915f8db4c88928a99f0a6cfa9e2866e2b0b998a15
   - Confirmed `successful: true` at ledger 4191059.
   - Recipient's real XLM balance: `10000.0000000` -> `10004.9983064` (+~5 XLM, minus the small network fee since recipient was also the fee-paying source of this invocation).
   - Emitted a real `transfer` event on the XLM SAC (50000000 stroops, contract -> recipient), plus a `stream withdrawn` event (stream id 0, amount 50000000) on StreamPay.

4. **get_stream(0)** — final state check.
   - `deposit: 100000000, withdrawn: 50000000, canceled: false` — matches expectations exactly.

## Reproduce

```bash
cd contract
stellar contract invoke --id CDPD3ZKG2CASLYS4GAZII6DLQG5R62QEE2JKJO7IWLKOWNDZA6J3WPVL \
  --source <your-identity> --network testnet -- get_stream --stream_id 0
```
