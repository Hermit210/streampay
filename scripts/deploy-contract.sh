#!/usr/bin/env bash
# Builds and deploys the StreamPay contract to a Stellar network in one
# command. Prints the resulting contract ID (and, on testnet/futurenet,
# funds the deployer identity if it doesn't exist yet or has no balance).
#
# Usage:
#   ./scripts/deploy-contract.sh [network] [source-identity]
#
#   network          stellar CLI network name (default: testnet)
#   source-identity  stellar CLI identity alias to deploy from (default: deployer)
set -euo pipefail

NETWORK="${1:-testnet}"
SOURCE="${2:-deployer}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACT_DIR="$REPO_ROOT/contract"
WASM_PATH="$CONTRACT_DIR/target/wasm32v1-none/release/stream_pay.wasm"

echo "==> Running contract tests"
(cd "$CONTRACT_DIR" && cargo test)

echo "==> Building optimized wasm"
(cd "$CONTRACT_DIR" && stellar contract build --optimize)

if ! stellar keys address "$SOURCE" >/dev/null 2>&1; then
  echo "==> Identity '$SOURCE' not found, generating it"
  stellar keys generate "$SOURCE" --network "$NETWORK"
fi

if [ "$NETWORK" = "testnet" ] || [ "$NETWORK" = "futurenet" ]; then
  ADDRESS="$(stellar keys address "$SOURCE")"
  echo "==> Ensuring '$SOURCE' ($ADDRESS) is funded on $NETWORK"
  curl -sf "https://friendbot.stellar.org/?addr=$ADDRESS" >/dev/null || true
fi

echo "==> Deploying to $NETWORK"
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  | tail -n1)

echo ""
echo "Deployed StreamPay contract:"
echo "  Network:  $NETWORK"
echo "  Contract: $CONTRACT_ID"
echo ""
echo "Set VITE_CONTRACT_ID=$CONTRACT_ID in frontend/.env to point the app at this deployment."
