#![no_std]

//! StreamPay — real-time token streaming payments on Stellar.
//!
//! A sender locks XLM into a stream addressed to a recipient over a fixed
//! duration. The recipient's withdrawable balance grows continuously
//! (per-second accrual) rather than unlocking all at once. The sender can
//! cancel early, in which case whatever has accrued so far is paid to the
//! recipient and the remainder is refunded to the sender.
//!
//! This is the Orange Belt evolution of SplitStellar: White Belt sent one
//! payment, Yellow Belt tracked group splits, Orange Belt moves *real* XLM
//! continuously over time via an inter-contract call into Stellar's XLM
//! Stellar Asset Contract (SAC).

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, Env, Vec};

#[derive(Clone)]
#[contracttype]
pub struct Stream {
    pub id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub token: Address,
    pub deposit: i128,
    pub start_time: u64,
    pub stop_time: u64,
    pub withdrawn: i128,
    pub canceled: bool,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Stream(u64),
    NextId,
    RecentStreams,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum StreamError {
    InvalidDuration = 1,
    InvalidDeposit = 2,
    StreamNotFound = 3,
    StreamCanceled = 4,
    NotRecipient = 5,
    NotSenderOrRecipient = 6,
    InsufficientBalance = 7,
    NothingToWithdraw = 8,
}

const RECENT_LIMIT: u32 = 20;

#[contract]
pub struct StreamPayContract;

#[contractimpl]
impl StreamPayContract {
    /// Locks `deposit` of `token` from `sender`, streaming it to `recipient`
    /// linearly over `duration_seconds` starting now. Pulls the deposit into
    /// the contract via an inter-contract call to the token's SAC `transfer`.
    pub fn create_stream(
        env: Env,
        sender: Address,
        recipient: Address,
        token: Address,
        deposit: i128,
        duration_seconds: u64,
    ) -> Result<u64, StreamError> {
        sender.require_auth();

        if duration_seconds == 0 {
            return Err(StreamError::InvalidDuration);
        }
        if deposit <= 0 {
            return Err(StreamError::InvalidDeposit);
        }

        // Inter-contract call: pull funds from sender into this contract.
        // Requires `sender` to have authorized this transfer as part of the
        // same signed invocation tree (standard Soroban escrow pattern).
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &deposit);

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(0u64);

        let start_time = env.ledger().timestamp();
        let stop_time = start_time + duration_seconds;

        let stream = Stream {
            id,
            sender: sender.clone(),
            recipient: recipient.clone(),
            token,
            deposit,
            start_time,
            stop_time,
            withdrawn: 0,
            canceled: false,
        };

        env.storage().instance().set(&DataKey::Stream(id), &stream);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));

        Self::push_recent(&env, id);

        env.events()
            .publish((soroban_sdk::symbol_short!("stream"), soroban_sdk::symbol_short!("created")), id);

        Ok(id)
    }

    /// How much the recipient can withdraw right now (accrued minus already
    /// withdrawn, capped at the deposit). Pure read, no auth required.
    pub fn balance_of(env: Env, stream_id: u64) -> Result<i128, StreamError> {
        let stream: Stream = env
            .storage()
            .instance()
            .get(&DataKey::Stream(stream_id))
            .ok_or(StreamError::StreamNotFound)?;

        Ok(Self::accrued(&env, &stream) - stream.withdrawn)
    }

    /// Recipient withdraws up to their currently accrued balance. Performs
    /// an inter-contract call to pay out from the contract's own held
    /// balance (the contract authorizes its own outgoing transfer).
    pub fn withdraw(
        env: Env,
        stream_id: u64,
        recipient: Address,
        amount: i128,
    ) -> Result<(), StreamError> {
        recipient.require_auth();

        let mut stream: Stream = env
            .storage()
            .instance()
            .get(&DataKey::Stream(stream_id))
            .ok_or(StreamError::StreamNotFound)?;

        if stream.recipient != recipient {
            return Err(StreamError::NotRecipient);
        }

        let available = Self::accrued(&env, &stream) - stream.withdrawn;
        if amount <= 0 || amount > available {
            return Err(StreamError::InsufficientBalance);
        }

        let token_client = token::Client::new(&env, &stream.token);
        token_client.transfer(&env.current_contract_address(), &recipient, &amount);

        stream.withdrawn += amount;
        env.storage()
            .instance()
            .set(&DataKey::Stream(stream_id), &stream);

        env.events().publish(
            (soroban_sdk::symbol_short!("stream"), soroban_sdk::symbol_short!("withdrawn")),
            (stream_id, amount),
        );

        Ok(())
    }

    /// Sender or recipient can cancel early. Pays the recipient whatever has
    /// accrued so far and refunds the untouched remainder to the sender —
    /// both via inter-contract SAC transfers.
    pub fn cancel(env: Env, stream_id: u64, caller: Address) -> Result<(), StreamError> {
        caller.require_auth();

        let mut stream: Stream = env
            .storage()
            .instance()
            .get(&DataKey::Stream(stream_id))
            .ok_or(StreamError::StreamNotFound)?;

        if stream.canceled {
            return Err(StreamError::StreamCanceled);
        }
        if caller != stream.sender && caller != stream.recipient {
            return Err(StreamError::NotSenderOrRecipient);
        }

        let accrued = Self::accrued(&env, &stream);
        let owed_to_recipient = accrued - stream.withdrawn;
        let refund_to_sender = stream.deposit - accrued;

        let token_client = token::Client::new(&env, &stream.token);

        if owed_to_recipient > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &stream.recipient,
                &owed_to_recipient,
            );
        }
        if refund_to_sender > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &stream.sender,
                &refund_to_sender,
            );
        }

        stream.withdrawn = accrued;
        stream.canceled = true;
        env.storage()
            .instance()
            .set(&DataKey::Stream(stream_id), &stream);

        env.events().publish(
            (soroban_sdk::symbol_short!("stream"), soroban_sdk::symbol_short!("canceled")),
            stream_id,
        );

        Ok(())
    }

    pub fn get_stream(env: Env, stream_id: u64) -> Result<Stream, StreamError> {
        env.storage()
            .instance()
            .get(&DataKey::Stream(stream_id))
            .ok_or(StreamError::StreamNotFound)
    }

    pub fn get_recent_streams(env: Env) -> Vec<u64> {
        env.storage()
            .instance()
            .get(&DataKey::RecentStreams)
            .unwrap_or(Vec::new(&env))
    }

    /// Linear accrual: how much of the deposit has "unlocked" by now,
    /// capped at the full deposit once stop_time has passed.
    fn accrued(env: &Env, stream: &Stream) -> i128 {
        let now = env.ledger().timestamp();
        if now <= stream.start_time {
            return 0;
        }
        if now >= stream.stop_time || stream.canceled {
            return stream.deposit.min(stream.deposit); // deposit, but explicit for clarity
        }
        let elapsed = (now - stream.start_time) as i128;
        let total_duration = (stream.stop_time - stream.start_time) as i128;
        // deposit * elapsed / total_duration, integer division (floor) —
        // acceptable for this scope; a production version would track
        // remainder dust explicitly.
        (stream.deposit * elapsed) / total_duration
    }

    fn push_recent(env: &Env, id: u64) {
        let mut recent: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::RecentStreams)
            .unwrap_or(Vec::new(env));

        recent.push_front(id);
        while recent.len() > RECENT_LIMIT {
            recent.pop_back();
        }

        env.storage()
            .instance()
            .set(&DataKey::RecentStreams, &recent);
    }
}

mod test;
