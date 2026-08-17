#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Env,
};

/// Deploys a mock/test token contract using soroban-sdk's token testutils,
/// mints `amount` to `to`, and returns (token_contract_address, admin).
/// NOTE: verify this matches the exact soroban-sdk 22.x testutils token API
/// before relying on it — token testutils setup has changed across SDK
/// versions, don't assume this compiles unmodified.
fn create_token_and_mint(env: &Env, admin: &Address, to: &Address, amount: i128) -> Address {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_admin_client = token::StellarAssetClient::new(env, &sac.address());
    token_admin_client.mint(to, &amount);
    sac.address()
}

#[test]
fn create_stream_pulls_deposit_into_contract() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_id = create_token_and_mint(&env, &admin, &sender, 1_000);
    let token_client = token::Client::new(&env, &token_id);

    let contract_id = env.register(StreamPayContract, ());
    let client = StreamPayContractClient::new(&env, &contract_id);

    let stream_id = client.create_stream(&sender, &recipient, &token_id, &1_000i128, &1_000u64);

    assert_eq!(stream_id, 0);
    assert_eq!(token_client.balance(&sender), 0);
    assert_eq!(token_client.balance(&contract_id), 1_000);
}

#[test]
fn withdraw_pays_only_accrued_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_id = create_token_and_mint(&env, &admin, &sender, 1_000);
    let token_client = token::Client::new(&env, &token_id);

    let contract_id = env.register(StreamPayContract, ());
    let client = StreamPayContractClient::new(&env, &contract_id);

    let stream_id = client.create_stream(&sender, &recipient, &token_id, &1_000i128, &1_000u64);

    // Halfway through the stream, ~500 should be accrued.
    env.ledger().with_mut(|l| l.timestamp += 500);

    let available = client.balance_of(&stream_id);
    assert_eq!(available, 500);

    // Trying to withdraw more than accrued should fail.
    let over_result = client.try_withdraw(&stream_id, &recipient, &501i128);
    assert!(over_result.is_err());

    client.withdraw(&stream_id, &recipient, &500i128);
    assert_eq!(token_client.balance(&recipient), 500);
    assert_eq!(client.balance_of(&stream_id), 0);
}

#[test]
fn cancel_splits_accrued_and_refund_correctly() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_id = create_token_and_mint(&env, &admin, &sender, 1_000);
    let token_client = token::Client::new(&env, &token_id);

    let contract_id = env.register(StreamPayContract, ());
    let client = StreamPayContractClient::new(&env, &contract_id);

    let stream_id = client.create_stream(&sender, &recipient, &token_id, &1_000i128, &1_000u64);

    env.ledger().with_mut(|l| l.timestamp += 300);

    client.cancel(&stream_id, &sender);

    // ~300 accrued to recipient, ~700 refunded to sender.
    assert_eq!(token_client.balance(&recipient), 300);
    assert_eq!(token_client.balance(&sender), 700);
    assert_eq!(token_client.balance(&contract_id), 0);

    // Canceling again should fail.
    let result = client.try_cancel(&stream_id, &sender);
    assert!(result.is_err());
}

#[test]
fn non_recipient_cannot_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let stranger = Address::generate(&env);

    let token_id = create_token_and_mint(&env, &admin, &sender, 1_000);

    let contract_id = env.register(StreamPayContract, ());
    let client = StreamPayContractClient::new(&env, &contract_id);

    let stream_id = client.create_stream(&sender, &recipient, &token_id, &1_000i128, &1_000u64);
    env.ledger().with_mut(|l| l.timestamp += 500);

    let result = client.try_withdraw(&stream_id, &stranger, &100i128);
    assert!(result.is_err());
}

#[test]
fn zero_duration_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_id = create_token_and_mint(&env, &admin, &sender, 1_000);

    let contract_id = env.register(StreamPayContract, ());
    let client = StreamPayContractClient::new(&env, &contract_id);

    let result = client.try_create_stream(&sender, &recipient, &token_id, &1_000i128, &0u64);
    assert!(result.is_err());
}

#[test]
fn recipient_can_also_cancel() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_id = create_token_and_mint(&env, &admin, &sender, 1_000);
    let token_client = token::Client::new(&env, &token_id);

    let contract_id = env.register(StreamPayContract, ());
    let client = StreamPayContractClient::new(&env, &contract_id);

    let stream_id = client.create_stream(&sender, &recipient, &token_id, &1_000i128, &1_000u64);
    env.ledger().with_mut(|l| l.timestamp += 400);

    // Cancellation isn't only the sender's call to make -- the recipient
    // can end the stream early too (e.g. to settle up sooner).
    client.cancel(&stream_id, &recipient);

    assert_eq!(token_client.balance(&recipient), 400);
    assert_eq!(token_client.balance(&sender), 600);
    assert!(client.get_stream(&stream_id).canceled);
}

#[test]
fn stranger_cannot_cancel() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let stranger = Address::generate(&env);

    let token_id = create_token_and_mint(&env, &admin, &sender, 1_000);

    let contract_id = env.register(StreamPayContract, ());
    let client = StreamPayContractClient::new(&env, &contract_id);

    let stream_id = client.create_stream(&sender, &recipient, &token_id, &1_000i128, &1_000u64);

    let result = client.try_cancel(&stream_id, &stranger);
    assert!(result.is_err());
}
