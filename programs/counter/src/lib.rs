use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};
use session_keys::{session_auth_or, Session, SessionError, SessionToken};

declare_id!("A8qoTZrfzgBCPADBwGQJxva9ymsUkYEnSXXtUik7HvoQ");

// ============================================================
//  Constants
// ============================================================
const MAX_REALM_LEN: usize = 16; // "Jungle" | "Desert" | "Snow"

#[ephemeral]
#[program]
pub mod meinkraft {
    use super::*;

    // ----------------------------------------------------------
    //  BASE LAYER — called once per player (Solana devnet/main)
    // ----------------------------------------------------------

    /// Create the player's persistent profile.
    /// Seeds: [b"profile", authority]
    pub fn initialize_profile(ctx: Context<InitializeProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.authority = ctx.accounts.authority.key();
        profile.total_blocks_placed = 0;
        profile.total_attacks = 0;
        profile.total_kills = 0;
        profile.total_score = 0;
        profile.games_played = 0;
        msg!("Profile initialised for {}", profile.authority);
        Ok(())
    }

    /// Delegate the GameSession PDA to the MagicBlock Ephemeral Rollup.
    /// Must be called on the BASE LAYER before starting a game session.
    /// The `#[delegate]` macro injects the delegation infrastructure accounts.
    pub fn delegate_session(ctx: Context<DelegateSession>) -> Result<()> {
        ctx.accounts.delegate_pda(
            &ctx.accounts.payer,
            &[
                b"session",
                ctx.accounts.payer.key().as_ref(),
            ],
            DelegateConfig {
                validator: ctx.remaining_accounts.first().map(|a| a.key()),
                ..Default::default()
            },
        )?;
        msg!("GameSession delegated to ER");
        Ok(())
    }

    /// Undelegate the GameSession PDA from the ER and commit final state.
    /// Must be called on the EPHEMERAL ROLLUP to settle scores back to base.
    pub fn undelegate_session(ctx: Context<CommitSession>) -> Result<()> {
        require!(
            !ctx.accounts.game_session.active,
            GameError::SessionStillActive
        );

        // Snapshot session values before taking the mutable profile borrow
        let blocks = ctx.accounts.game_session.blocks_placed as u64;
        let attacks = ctx.accounts.game_session.attacks as u64;
        let kills   = ctx.accounts.game_session.kills as u64;
        let score   = ctx.accounts.game_session.score;
        let authority = ctx.accounts.profile.authority;

        {
            let profile = &mut ctx.accounts.profile;
            profile.total_blocks_placed = profile.total_blocks_placed.saturating_add(blocks);
            profile.total_attacks       = profile.total_attacks.saturating_add(attacks);
            profile.total_kills         = profile.total_kills.saturating_add(kills);
            profile.total_score         = profile.total_score.saturating_add(score);
            profile.games_played        = profile.games_played.saturating_add(1);
        } // mutable borrow on profile ends here

        // Commit + undelegate — both accounts passed by shared ref now
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![
                &ctx.accounts.game_session.to_account_info(),
                &ctx.accounts.profile.to_account_info(),
            ],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        msg!(
            "Session for {} undelegated. Session score: {}",
            authority,
            score
        );
        Ok(())
    }

    // ----------------------------------------------------------
    //  EPHEMERAL ROLLUP HOT-PATH
    //  All instructions below run on the ER and use session keys
    //  so the player never signs individual txs manually.
    // ----------------------------------------------------------

    /// Start a game session.
    /// Resets session counters and marks session as active.
    /// Called on the ER after delegation.
    pub fn enter_game(ctx: Context<GameAction>, realm: String) -> Result<()> {
        require!(realm.len() <= MAX_REALM_LEN, GameError::InvalidRealm);
        let session = &mut ctx.accounts.game_session;
        require!(!session.active, GameError::SessionAlreadyActive);
        session.authority = ctx.accounts.profile.authority;
        session.realm = realm.clone();
        session.blocks_placed = 0;
        session.attacks = 0;
        session.kills = 0;
        session.score = 0;
        session.active = true;
        msg!("Game entered. Realm: {}", realm);
        Ok(())
    }

    /// Record a block placement event.
    /// Each call is one tx on the ER (cheap, fast, gasless for the player).
    #[session_auth_or(
        ctx.accounts.profile.authority == ctx.accounts.signer.key(),
        GameError::InvalidAuth
    )]
    pub fn place_block(ctx: Context<GameAction>, block_type: String) -> Result<()> {
        let session = &mut ctx.accounts.game_session;
        require!(session.active, GameError::NoActiveSession);
        session.blocks_placed = session.blocks_placed.saturating_add(1);
        session.score = session.score.saturating_add(1);
        msg!("Block placed: {}. Total: {}", block_type, session.blocks_placed);
        Ok(())
    }

    /// Record an attack event (player hits an entity).
    /// Each swing is one tx on the ER.
    #[session_auth_or(
        ctx.accounts.profile.authority == ctx.accounts.signer.key(),
        GameError::InvalidAuth
    )]
    pub fn attack(ctx: Context<GameAction>, target_type: String, damage: u8) -> Result<()> {
        let session = &mut ctx.accounts.game_session;
        require!(session.active, GameError::NoActiveSession);
        session.attacks = session.attacks.saturating_add(1);
        // Award partial score for hitting (full score on kill)
        session.score = session.score.saturating_add(damage as u64 / 2);
        msg!(
            "Attack on {}. Damage: {}. Total attacks: {}",
            target_type,
            damage,
            session.attacks
        );
        Ok(())
    }

    /// Record an entity kill (animal or enemy).
    /// Called when an entity's health reaches zero.
    #[session_auth_or(
        ctx.accounts.profile.authority == ctx.accounts.signer.key(),
        GameError::InvalidAuth
    )]
    pub fn kill_entity(
        ctx: Context<GameAction>,
        entity_type: String,
        score_reward: u64,
    ) -> Result<()> {
        let session = &mut ctx.accounts.game_session;
        require!(session.active, GameError::NoActiveSession);
        session.kills = session.kills.saturating_add(1);
        session.score = session.score.saturating_add(score_reward);
        msg!(
            "Killed {}. Reward: {}. Total kills: {}",
            entity_type,
            score_reward,
            session.kills
        );
        Ok(())
    }

    /// End the active game session.
    /// Marks session inactive so it can be undelegated safely.
    #[session_auth_or(
        ctx.accounts.profile.authority == ctx.accounts.signer.key(),
        GameError::InvalidAuth
    )]
    pub fn end_game(ctx: Context<GameAction>) -> Result<()> {
        let session = &mut ctx.accounts.game_session;
        require!(session.active, GameError::NoActiveSession);
        session.active = false;
        msg!(
            "Game ended. Blocks: {} | Attacks: {} | Kills: {} | Score: {}",
            session.blocks_placed,
            session.attacks,
            session.kills,
            session.score
        );
        Ok(())
    }

    /// Manual commit — persists current ER state to the base layer mid-session
    /// (optional checkpoint, does NOT end the session or undelegate).
    pub fn commit_session(ctx: Context<CommitSession>) -> Result<()> {
        commit_accounts(
            &ctx.accounts.payer,
            vec![
                &ctx.accounts.game_session.to_account_info(),
                &ctx.accounts.profile.to_account_info(),
            ],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        msg!("Session state committed to base layer (checkpoint)");
        Ok(())
    }
}

// ============================================================
//  ACCOUNT CONTEXTS
// ============================================================

/// Initialize the player's permanent on-chain profile.
#[derive(Accounts)]
pub struct InitializeProfile<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PlayerProfile::INIT_SPACE,
        seeds = [b"profile", authority.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, PlayerProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Delegate the GameSession PDA to the ER.
/// The `#[delegate]` macro injects delegation infrastructure accounts.
#[delegate]
#[derive(Accounts)]
pub struct DelegateSession<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: The GameSession PDA to delegate, validated by seeds.
    #[account(
        mut,
        del,
        seeds = [b"session", payer.key().as_ref()],
        bump
    )]
    pub pda: AccountInfo<'info>,
}

/// All live game actions (enter, place_block, attack, kill, end).
/// Uses session keys so the hot-path is gasless for the player.
#[derive(Accounts, Session)]
pub struct GameAction<'info> {
    #[account(
        mut,
        seeds = [b"session", profile.authority.as_ref()],
        bump
    )]
    pub game_session: Account<'info, GameSession>,

    #[account(
        mut,
        seeds = [b"profile", profile.authority.as_ref()],
        bump
    )]
    pub profile: Account<'info, PlayerProfile>,

    #[account(mut)]
    pub signer: Signer<'info>,

    /// Session token allows a delegated key to sign on behalf of the player.
    #[session(
        signer = signer,
        authority = profile.authority.key()
    )]
    pub session_token: Option<Account<'info, SessionToken>>,
}

/// Commit / undelegate — settles ER state back to the base layer.
/// The `#[commit]` macro injects magic_context and magic_program accounts.
#[commit]
#[derive(Accounts)]
pub struct CommitSession<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"session", payer.key().as_ref()],
        bump
    )]
    pub game_session: Account<'info, GameSession>,

    #[account(
        mut,
        seeds = [b"profile", payer.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, PlayerProfile>,
}

// ============================================================
//  ACCOUNT DATA STRUCTS
// ============================================================

/// Persistent player profile — lives on the base layer forever.
#[account]
#[derive(InitSpace)]
pub struct PlayerProfile {
    /// The wallet that owns this profile.
    pub authority: Pubkey,
    /// Cumulative blocks placed across all sessions.
    pub total_blocks_placed: u64,
    /// Cumulative attacks across all sessions.
    pub total_attacks: u64,
    /// Cumulative entity kills across all sessions.
    pub total_kills: u64,
    /// Cumulative score across all sessions.
    pub total_score: u64,
    /// Number of completed games.
    pub games_played: u16,
}

/// Ephemeral session state — delegated to ER for the duration of a game.
/// Settled back to base layer via commit_and_undelegate after each session.
#[account]
#[derive(InitSpace)]
pub struct GameSession {
    /// Owner of this session.
    pub authority: Pubkey,
    /// Active realm ("Jungle" | "Desert" | "Snow").
    #[max_len(16)]
    pub realm: String,
    /// Blocks placed this session.
    pub blocks_placed: u32,
    /// Attacks made this session.
    pub attacks: u32,
    /// Entities killed this session.
    pub kills: u32,
    /// Score accumulated this session.
    pub score: u64,
    /// Whether a game is currently in progress.
    pub active: bool,
}

// ============================================================
//  ERRORS
// ============================================================

#[error_code]
pub enum GameError {
    #[msg("No active session — call enter_game first")]
    NoActiveSession,
    #[msg("Session already active — call end_game before starting a new one")]
    SessionAlreadyActive,
    #[msg("Session is still active — call end_game before undelegating")]
    SessionStillActive,
    #[msg("Invalid realm name")]
    InvalidRealm,
    #[msg("Invalid authentication")]
    InvalidAuth,
}
