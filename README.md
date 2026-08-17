# StreamPay

[![CI](https://github.com/Hermit210/streampay/actions/workflows/ci.yml/badge.svg)](https://github.com/Hermit210/streampay/actions/workflows/ci.yml)

Real-time streaming payments on Stellar Soroban — Orange Belt (Level 3) of
[Stellar Journey to Mastery](https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges).

## What this is

A sender locks XLM into a **stream** addressed to a recipient over a fixed
duration. Instead of unlocking all at once like a normal payment, the
recipient's withdrawable balance grows **continuously, per second**. The
recipient can withdraw their accrued balance at any time; either party can
cancel early, which pays the recipient whatever has accrued so far and
refunds the untouched remainder to the sender.

This is the same category of primitive as [Sablier](https://sablier.com/)
or [Superfluid](https://www.superfluid.finance/) on Ethereum — payroll,
subscriptions, vesting — implemented for the first time on Stellar in this
submission.

### How this differs from earlier belts

- **White Belt** (`splitstellar-white-belt`): a single one-shot payment.
  No time dimension at all.
- **Yellow Belt** (`stellar-yellow-belt` / SplitTracker): tracked group
  expense splits, but never moved real tokens — it was bookkeeping, not
  payments.
- **Orange Belt (this project)**: moves *real* XLM, continuously, over
  time, via an inter-contract call into Stellar's XLM Stellar Asset
  Contract (SAC). The withdrawable amount is a live function of elapsed
  time, not a static ledger entry.

## Architecture

```
contract/stream_pay/     Soroban smart contract (Rust)
frontend/                React + TypeScript + Vite dApp
scripts/                 One-command deployment script
.github/workflows/       CI (contract + frontend)
package.json             Root convenience scripts (npm run dev/test/build, etc.)
```

### Contract

- `create_stream(sender, recipient, token, deposit, duration_seconds)` —
  pulls `deposit` from `sender` into the contract via an **inter-contract
  call** to the token's SAC (`token::Client::transfer`), and records a
  `Stream` with a start/stop time.
- `balance_of(stream_id)` — read-only; returns `accrued() - withdrawn`.
- `withdraw(stream_id, recipient, amount)` — recipient-only; pays out up
  to their accrued balance via another inter-contract SAC transfer.
- `cancel(stream_id, caller)` — sender or recipient; pays the recipient
  whatever accrued so far and refunds the rest to the sender, both via
  inter-contract SAC transfers.
- `get_stream`, `get_recent_streams` — read-only lookups.
- Accrual is **linear and floor-divided** (`deposit * elapsed /
  duration`), matching standard fixed-point on-chain math — no floats.
- Every mutation emits a **Soroban event** (`stream created` / `withdrawn`
  / `canceled`) for real-time client updates.

This is the idiomatic Soroban pattern for moving tokens: a contract never
holds its own balance ledger for another asset — it calls the asset's SAC,
same as any ERC-20-style `transfer` call on other chains. Both this
project and a friend's Orange Belt submission (a paid-task escrow) use
this pattern for the same reason two unrelated Ethereum projects would
both call `IERC20.transfer` — it's the only correct way to move tokens on
Soroban, not something copied between the two.

### Frontend

```
frontend/src/
  services/stellar/    RPC + contract client, Freighter wallet integration,
                        XLM/stroop conversion, contract error mapping
  services/events/      real Soroban event fetching (rpc.Server.getEvents),
                         decodes the (stream, created|withdrawn|canceled)
                         topic pairs the contract publishes
  features/streams/     create-stream form, stream lookup, live-ticking
                         balance display + withdraw/cancel actions, an
                         on-chain activity feed, pure accrual math
  features/wallet/      wallet connect/disconnect hook + UI
  components/ui/        shared primitives (Button, Card, StatusBadge,
                         Spinner, ErrorBanner, ErrorBoundary)
  App.tsx                thin composition root
```

The **live-ticking balance** is the core visual proof that streaming
works: `features/streams/accrual.ts` is a pure, bigint-based mirror of the
contract's `accrued()` formula. `useLiveStream` fetches a stream once,
then re-renders every second computing accrual **client-side** (no network
call per tick), and reconciles against the real on-chain `balance_of`
every 10 seconds so drift from another party withdrawing or canceling
never lingers. Alongside it, `ActivityLog` renders the real on-chain
events for that stream (create/withdraw/cancel), each linking to its
transaction — the concrete "event streaming" piece, not just a value the
live balance was computed from.

## Setup

Every frontend command below also works from the repo root (`npm run dev`,
`npm test`, `npm run build`, `npm run lint`, `npm run typecheck`, plus
`npm run test:contract` and `npm run test:all`) via the root
[`package.json`](package.json).

### Contract

```bash
cd contract
cargo test                        # run unit tests
stellar contract build --optimize # build optimized wasm
```

### Frontend

```bash
cd frontend
cp .env.example .env   # or point at your own deployment
npm install
npm run dev             # http://localhost:5173
npm run lint             # oxlint
npm run typecheck        # tsc -b --noEmit
npm test                 # vitest run
npm run build             # tsc -b && vite build
```

### Deploy the contract (one command)

```bash
./scripts/deploy-contract.sh testnet deployer
```

Runs `cargo test`, builds the optimized wasm, funds the deployer identity
via Friendbot if needed, deploys, and prints the contract ID plus the
exact `.env` line to point the frontend at it.

## Testnet deployment

| | |
|---|---|
| **Contract address** | `CDPD3ZKG2CASLYS4GAZII6DLQG5R62QEE2JKJO7IWLKOWNDZA6J3WPVL` |
| **Testnet XLM SAC (token)** | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| **Deploy tx** | [`f82e2d12…`](https://stellar.expert/explorer/testnet/tx/f82e2d123f16a5d12a9eeb844828714533aea5cfa7f3381be157a4598f26a9dc) |
| **create_stream tx** (10 XLM / 60s) | [`6eb7f266…`](https://stellar.expert/explorer/testnet/tx/6eb7f2668b4c7c7e7013ac7924db72d3ba92f093d377ca650ab22a4649f0fbb3) |
| **withdraw tx** (5 XLM, partial) | [`c1401089…`](https://stellar.expert/explorer/testnet/tx/c1401089933bd652a65d6b8915f8db4c88928a99f0a6cfa9e2866e2b0b998a15) |
| **withdraw tx — Horizon (independent verification)** | https://horizon-testnet.stellar.org/transactions/c1401089933bd652a65d6b8915f8db4c88928a99f0a6cfa9e2866e2b0b998a15 |

Full end-to-end transcript (create → accrue → withdraw, with the exact
numbers): [`contract/deployment/testnet.md`](contract/deployment/testnet.md).

**Live demo:** _[Vercel link — pending deploy]_

**Demo video:** _[link — pending recording]_

## Screenshots

_[Mobile UI at ~390px — pending]_

_[CI pipeline green checks — pending]_

_[Test output, 36 passing frontend tests + 9 passing contract tests — pending]_

## Requirements checklist

- [x] Advanced smart contract: inter-contract calls to the XLM SAC
      (`create_stream`, `withdraw`, `cancel`), Soroban events on every
      mutation
- [x] CI/CD pipeline: contract test/build + frontend lint/typecheck/
      test/build on every push to `main`
- [x] Documented, scripted deployment: `scripts/deploy-contract.sh`, one
      command
- [ ] Mobile responsive frontend (implemented with mobile breakpoints
      throughout; visual verification at ~390px pending)
- [x] Error handling & loading states throughout (wallet, form
      validation, contract calls, plus a root ErrorBoundary for uncaught
      render errors)
- [x] Tests: 9 contract unit tests (Rust/soroban-sdk testutils) + 36
      frontend tests (Vitest/RTL) covering success and failure paths
- [x] Production-ready architecture: services/features/components
      separation, thin `App.tsx`
- [ ] Documentation + 1-2 minute demo video (README done; video pending
      recording)
- [ ] Live demo link (Vercel) — pending deploy
- [ ] Transaction hash for a contract interaction — done above; screenshot
      evidence pending
