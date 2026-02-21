use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};
use session_keys::{session_auth_or, Session, SessionError, SessionToken};

declare_id!("72WYk7b352n3SFb3k1qGmPnKDY2dUvr5rgK55RNa14Yt");

// ============================================================
//  Constants
// ============================================================
const MAX_REALM_LEN: usize = 16;

#[ephemeral]
#[program]
pub mod meinkraft {
    use super::*;

    /// Initialize a new Meinkraft player account
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let account = &mut ctx.accounts.meinkraft_account;
        account.authority = ctx.accounts.authority.key();
        account.blocks_placed = 0;
        account.attacks = 0;
        account.kills = 0;
        account.score = 0;
        account.games_played = 0;
        account.active = false;
        msg!("Meinkraft account initialized for {}", account.authority);
        Ok(())
    }

    /// Enter the game session
    pub fn enter_game(ctx: Context<GameAction>, realm: String) -> Result<()> {
        require!(realm.len() <= MAX_REALM_LEN, GameError::InvalidRealm);
        let account = &mut ctx.accounts.meinkraft_account;
        account.realm = realm.clone();
        account.active = true;
        msg!("Game entered. Realm: {}", realm);
        Ok(())
    }

    /// Record a block placement event
    #[session_auth_or(
        ctx.accounts.meinkraft_account.authority == ctx.accounts.signer.key(),
        GameError::InvalidAuth
    )]
    pub fn place_block(ctx: Context<GameAction>, block_type: String) -> Result<()> {
        let account = &mut ctx.accounts.meinkraft_account;
        require!(account.active, GameError::NoActiveSession);
        account.blocks_placed = account.blocks_placed.saturating_add(1);
        account.score = account.score.saturating_add(1);
        msg!("Block placed: {}. Total: {}", block_type, account.blocks_placed);
        Ok(())
    }

    /// Record an attack event
    #[session_auth_or(
        ctx.accounts.meinkraft_account.authority == ctx.accounts.signer.key(),
        GameError::InvalidAuth
    )]
    pub fn attack(ctx: Context<GameAction>, target_type: String, damage: u8) -> Result<()> {
        let account = &mut ctx.accounts.meinkraft_account;
        require!(account.active, GameError::NoActiveSession);
        account.attacks = account.attacks.saturating_add(1);
        account.score = account.score.saturating_add(damage as u64 / 2);
        msg!("Attack on {}. Damage: {}. Total: {}", target_type, damage, account.attacks);
        Ok(())
    }

    /// Record an entity kill
    #[session_auth_or(
        ctx.accounts.meinkraft_account.authority == ctx.accounts.signer.key(),
        GameError::InvalidAuth
    )]
    pub fn kill_entity(ctx: Context<GameAction>, entity_type: String, score_reward: u64) -> Result<()> {
        let account = &mut ctx.accounts.meinkraft_account;
        require!(account.active, GameError::NoActiveSession);
        account.kills = account.kills.saturating_add(1);
        account.score = account.score.saturating_add(score_reward);
        msg!("Killed {}. Reward: {}. Total kills: {}", entity_type, score_reward, account.kills);
        Ok(())
    }

    /// End the active game session
    #[session_auth_or(
        ctx.accounts.meinkraft_account.authority == ctx.accounts.signer.key(),
        GameError::InvalidAuth
    )]
    pub fn end_game(ctx: Context<GameAction>) -> Result<()> {
        let account = &mut ctx.accounts.meinkraft_account;
        require!(account.active, GameError::NoActiveSession);
        account.active = false;
        account.games_played = account.games_played.saturating_add(1);
        msg!("Game ended. Score: {}", account.score);
        Ok(())
    }

    // ========================================
    // MagicBlock Ephemeral Rollups Functions
    // ========================================

    /// Delegate the account to the ER
    pub fn delegate(ctx: Context<DelegateInput>) -> Result<()> {
        ctx.accounts.delegate_pda(
            &ctx.accounts.payer,
            &[ctx.accounts.payer.key().as_ref()],
            DelegateConfig {
                validator: ctx.remaining_accounts.first().map(|acc| acc.key()),
                ..Default::default()
            },
        )?;
        Ok(())
    }

    /// Manual commit state to base layer
    pub fn commit(ctx: Context<CommitInput>) -> Result<()> {
        commit_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.meinkraft_account.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        Ok(())
    }

    /// Undelegate the account from the ER
    pub fn undelegate(ctx: Context<CommitInput>) -> Result<()> {
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.meinkraft_account.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        Ok(())
    }
}

// ========================================
// Account Contexts
// ========================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + MeinkraftAccount::INIT_SPACE,
        seeds = [authority.key().as_ref()],
        bump
    )]
    pub meinkraft_account: Account<'info, MeinkraftAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts, Session)]
pub struct GameAction<'info> {
    #[account(
        mut,
        seeds = [meinkraft_account.authority.key().as_ref()],
        bump
    )]
    pub meinkraft_account: Account<'info, MeinkraftAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[session(signer = signer, authority = meinkraft_account.authority.key())]
    pub session_token: Option<Account<'info, SessionToken>>,
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateInput<'info> {
    pub payer: Signer<'info>,
    /// CHECK: The PDA to delegate.
    #[account(mut, del, seeds = [payer.key().as_ref()], bump)]
    pub pda: AccountInfo<'info>,
}

#[commit]
#[derive(Accounts)]
pub struct CommitInput<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [payer.key().as_ref()], bump)]
    pub meinkraft_account: Account<'info, MeinkraftAccount>,
}

// ========================================
// Account Data
// ========================================

#[account]
#[derive(InitSpace)]
pub struct MeinkraftAccount {
    pub authority: Pubkey,
    #[max_len(16)]
    pub realm: String,
    pub blocks_placed: u64,
    pub attacks: u64,
    pub kills: u64,
    pub score: u64,
    pub games_played: u64,
    pub active: bool,
}

// ========================================
// Errors
// ========================================

#[error_code]
pub enum GameError {
    #[msg("No active session")]
    NoActiveSession,
    #[msg("Invalid realm name")]
    InvalidRealm,
    #[msg("Invalid authentication")]
    InvalidAuth,
}
