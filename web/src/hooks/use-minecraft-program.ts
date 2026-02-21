import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, setProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { type Meinkraft } from "../idl/meinkraft";
import IDL from "../idl/meinkraft.json";
import { useSessionKeyManager } from "@magicblock-labs/gum-react-sdk";
import { useCubeStore } from "../useStore";

// ----------------------------------------------------------------
//  Types
// ----------------------------------------------------------------

export interface PlayerProfile {
    authority: PublicKey;
    totalBlocksPlaced: bigint;
    totalAttacks: bigint;
    totalKills: bigint;
    totalScore: bigint;
    gamesPlayed: number;
}

export interface PendingMint {
    mint: PublicKey;
    count: number;
}

export interface GameSession {
    authority: PublicKey;
    realm: string;
    blocksPlaced: number;
    attacks: number;
    kills: number;
    score: bigint;
    pendingMints: PendingMint[];
    active: boolean;
}

export type DelegationStatus = "undelegated" | "delegated" | "checking";

// ----------------------------------------------------------------
//  Constants
// ----------------------------------------------------------------

const PROGRAM_ID = new PublicKey(IDL.address);
const DELEGATION_PROGRAM_ID = new PublicKey(
    "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
);
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

const ER_ENDPOINT = "https://devnet.magicblock.app";
const ER_WS_ENDPOINT = "wss://devnet.magicblock.app";

// Score rewards for kills (keep in sync with game UI config)
export const KILL_REWARDS: Record<string, number> = {
    Chick: 5,
    Chicken: 8,
    Pig: 10,
    Sheep: 8,
    Horse: 12,
    Wolf: 15,
    Dog: 12,
    Cat: 8,
    Raccoon: 12,
    Skeleton: 20,
    Skeleton_Armor: 30,
    Hedgehog: 15,
    Giant: 50,
    Zombie: 25,
    Demon: 40,
    Goblin: 15,
    Yeti: 50,
    Wizard: 35,
};

// ----------------------------------------------------------------
//  PDA helpers
// ----------------------------------------------------------------

function deriveProfilePDA(authority: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("profile"), authority.toBuffer()],
        PROGRAM_ID
    );
    return pda;
}

function deriveSessionPDA(authority: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("session"), authority.toBuffer()],
        PROGRAM_ID
    );
    return pda;
}

// ----------------------------------------------------------------
//  Hook
// ----------------------------------------------------------------

/**
 * useMinecraftProgram
 *
 * Provides all on-chain interactions for Meinkraft:
 *   Base layer: initializeProfile, delegateSession
 *   ER hot-path (session-keyed): enterGame, placeBlock, attack,
 *                                killEntity, endGame, commitSession
 *   Settle:     undelegateSession
 */
export function useMinecraftProgram() {
    const { connection } = useConnection();
    const wallet = useWallet();

    // ---- State ----
    const [profilePubkey, setProfilePubkey] = useState<PublicKey | null>(null);
    const [sessionPubkey, setSessionPubkey] = useState<PublicKey | null>(null);
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [gameSession, setGameSession] = useState<GameSession | null>(null);
    const [delegationStatus, setDelegationStatus] = useState<DelegationStatus>("checking");
    const [erGameSession, setErGameSession] = useState<GameSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDelegating, setIsDelegating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ---- Base layer Anchor provider + program ----
    const program = useMemo(() => {
        if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
            return null;
        }
        const provider = new AnchorProvider(
            connection,
            {
                publicKey: wallet.publicKey,
                signTransaction: wallet.signTransaction,
                signAllTransactions: wallet.signAllTransactions,
            },
            { commitment: "confirmed" }
        );
        setProvider(provider);
        return new Program<Meinkraft>(IDL as Meinkraft, provider);
    }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

    // ---- Ephemeral Rollup connection + provider + program ----
    const erConnection = useMemo(() => {
        return new Connection(ER_ENDPOINT, {
            wsEndpoint: ER_WS_ENDPOINT,
            commitment: "confirmed",
        });
    }, []);

    const erProvider = useMemo(() => {
        if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
            return null;
        }
        return new AnchorProvider(
            erConnection,
            {
                publicKey: wallet.publicKey,
                signTransaction: wallet.signTransaction,
                signAllTransactions: wallet.signAllTransactions,
            },
            { commitment: "confirmed" }
        );
    }, [erConnection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

    // ---- Session Key Manager ----
    const sessionWallet = useSessionKeyManager(wallet as any, connection, "devnet");
    const { sessionToken, createSession: sdkCreateSession, isLoading: isSessionLoading } = sessionWallet;

    const createSession = useCallback(async () => {
        return await sdkCreateSession(PROGRAM_ID);
    }, [sdkCreateSession]);

    const erProgram = useMemo(() => {
        if (!erConnection) return null;

        // Use session wallet as signer on ER if available
        const hasSession = sessionToken != null && sessionWallet?.publicKey != null;
        const signerWallet = hasSession
            ? sessionWallet
            : (wallet.publicKey && wallet.signTransaction && wallet.signAllTransactions)
                ? {
                    publicKey: wallet.publicKey,
                    signTransaction: wallet.signTransaction,
                    signAllTransactions: wallet.signAllTransactions,
                }
                : null;

        if (!signerWallet) return null;

        const provider = new AnchorProvider(
            erConnection,
            signerWallet as any,
            { commitment: "confirmed" }
        );
        return new Program<Meinkraft>(IDL as Meinkraft, provider);
    }, [erConnection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions, sessionToken, sessionWallet]);

    // ---- Derive PDAs when wallet connects ----
    useEffect(() => {
        if (wallet.publicKey) {
            setProfilePubkey(deriveProfilePDA(wallet.publicKey));
            setSessionPubkey(deriveSessionPDA(wallet.publicKey));
        } else {
            setProfilePubkey(null);
            setSessionPubkey(null);
            setProfile(null);
            setGameSession(null);
            setDelegationStatus("checking");
        }
    }, [wallet.publicKey]);

    // ---- Fetch helpers ----
    const fetchProfile = useCallback(async () => {
        if (!program || !profilePubkey) { setProfile(null); return; }
        try {
            const acc = await program.account.playerProfile.fetch(profilePubkey);
            setProfile({
                authority: acc.authority,
                totalBlocksPlaced: BigInt(acc.totalBlocksPlaced.toString()),
                totalAttacks: BigInt(acc.totalAttacks.toString()),
                totalKills: BigInt(acc.totalKills.toString()),
                totalScore: BigInt(acc.totalScore.toString()),
                gamesPlayed: acc.gamesPlayed,
            });
        } catch (err) {
            console.debug("Profile not found (new wallet):", err);
            setProfile(null);
        }
    }, [program, profilePubkey]);

    const fetchSession = useCallback(async () => {
        if (!program || !sessionPubkey) { setGameSession(null); return; }
        try {
            const acc = await program.account.gameSession.fetch(sessionPubkey);
            setGameSession({
                authority: acc.authority,
                realm: acc.realm,
                blocksPlaced: acc.blocksPlaced,
                attacks: acc.attacks,
                kills: acc.kills,
                score: BigInt(acc.score.toString()),
                pendingMints: acc.pendingMints || [],
                active: acc.active,
            });
        } catch {
            setGameSession(null);
        }
    }, [program, sessionPubkey]);

    const fetchErSession = useCallback(async () => {
        if (!erProgram || !sessionPubkey) { setErGameSession(null); return; }
        try {
            const acc = await erProgram.account.gameSession.fetch(sessionPubkey);
            setErGameSession({
                authority: acc.authority,
                realm: acc.realm,
                blocksPlaced: acc.blocksPlaced,
                attacks: acc.attacks,
                kills: acc.kills,
                score: BigInt(acc.score.toString()),
                pendingMints: acc.pendingMints || [],
                active: acc.active,
            });
        } catch {
            setErGameSession(null);
        }
    }, [erProgram, sessionPubkey]);

    // ---- Delegation status check ----
    const checkDelegationStatus = useCallback(async () => {
        if (!sessionPubkey) { setDelegationStatus("checking"); return; }
        try {
            const info = await connection.getAccountInfo(sessionPubkey);
            if (!info) { setDelegationStatus("undelegated"); return; }
            const isDelegated = info.owner.equals(DELEGATION_PROGRAM_ID);
            console.log(`Session delegation status: ${isDelegated ? "DELEGATED" : "UNDELEGATED"}`);
            setDelegationStatus(isDelegated ? "delegated" : "undelegated");
            if (isDelegated) await fetchErSession();
        } catch {
            setDelegationStatus("undelegated");
        }
    }, [sessionPubkey, connection, fetchErSession]);

    // ---- Base-layer subscriptions ----
    useEffect(() => {
        if (!program || !profilePubkey || !sessionPubkey) return;

        fetchProfile();
        fetchSession();
        checkDelegationStatus();

        const profileSub = connection.onAccountChange(
            profilePubkey,
            async (info) => {
                try {
                    const dec = program.coder.accounts.decode("playerProfile", info.data);
                    setProfile({
                        authority: dec.authority,
                        totalBlocksPlaced: BigInt(dec.totalBlocksPlaced.toString()),
                        totalAttacks: BigInt(dec.totalAttacks.toString()),
                        totalKills: BigInt(dec.totalKills.toString()),
                        totalScore: BigInt(dec.totalScore.toString()),
                        gamesPlayed: dec.gamesPlayed,
                    });
                } catch (e) { console.error("Failed to decode profile:", e); }
            },
            "confirmed"
        );

        const sessionSub = connection.onAccountChange(
            sessionPubkey,
            async (info) => {
                try {
                    const dec = program.coder.accounts.decode("gameSession", info.data);
                    setGameSession({
                        authority: dec.authority,
                        realm: dec.realm,
                        blocksPlaced: dec.blocksPlaced,
                        attacks: dec.attacks,
                        kills: dec.kills,
                        score: BigInt(dec.score.toString()),
                        pendingMints: dec.pendingMints || [],
                        active: dec.active,
                    });
                } catch (e) { console.error("Failed to decode session:", e); }
                // Recheck delegation status whenever the base-layer session account changes
                await checkDelegationStatus();
            },
            "confirmed"
        );

        return () => {
            connection.removeAccountChangeListener(profileSub);
            connection.removeAccountChangeListener(sessionSub);
        };
    }, [program, profilePubkey, sessionPubkey, connection, fetchProfile, fetchSession, checkDelegationStatus]);

    // ---- ER session subscription (when delegated) ----
    useEffect(() => {
        if (!erProgram || !sessionPubkey || delegationStatus !== "delegated") return;

        const sub = erConnection.onAccountChange(
            sessionPubkey,
            async (info) => {
                try {
                    const dec = erProgram.coder.accounts.decode("gameSession", info.data);
                    setErGameSession({
                        authority: dec.authority,
                        realm: dec.realm,
                        blocksPlaced: dec.blocksPlaced,
                        attacks: dec.attacks,
                        kills: dec.kills,
                        score: BigInt(dec.score.toString()),
                        pendingMints: dec.pendingMints || [],
                        active: dec.active,
                    });
                } catch (e) { console.error("Failed to decode ER session:", e); }
            },
            "confirmed"
        );

        return () => { erConnection.removeAccountChangeListener(sub); };
    }, [erProgram, sessionPubkey, erConnection, delegationStatus]);

    // ================================================================
    //  Helper: send a signed tx directly to the Ephemeral Rollup
    //  Supports session-key signing (no wallet popup for each action).
    // ================================================================
    const sendErTx = useCallback(async (
        methodBuilder: ReturnType<Program<Meinkraft>["methods"][keyof Program<Meinkraft>["methods"]]>,
        actionName: string,
        extraAccounts: Record<string, PublicKey | null> = {}
    ): Promise<string> => {
        if (!erProgram || !erProvider || !wallet.publicKey) {
            throw new Error("ER Program not loaded or wallet not connected");
        }

        setIsLoading(true);
        setError(null);

        try {
            const hasSession = sessionToken != null && sessionWallet?.publicKey != null;
            const signer = hasSession ? sessionWallet.publicKey! : wallet.publicKey;

            let tx = await (methodBuilder as any)
                .accounts({
                    signer,
                    sessionToken: hasSession ? sessionToken : null,
                    gameSession: sessionPubkey,
                    profile: profilePubkey,
                    ...extraAccounts,
                })
                .transaction();

            tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;

            if (hasSession && sessionWallet?.signTransaction) {
                tx.feePayer = sessionWallet.publicKey!;
                tx = await sessionWallet.signTransaction(tx);
            } else {
                tx.feePayer = wallet.publicKey;
                tx = await erProvider.wallet.signTransaction(tx);
            }

            const txHash = await erConnection.sendRawTransaction(tx.serialize(), {
                skipPreflight: true,
            });
            await erConnection.confirmTransaction(txHash, "confirmed");

            // 🍞 Toast
            useCubeStore.getState().addToast(txHash, actionName);

            // Refresh live ER state
            await fetchErSession();

            return txHash;
        } catch (err) {
            const msg = err instanceof Error ? err.message : `Failed to ${actionName} on ER`;
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [erProgram, erProvider, erConnection, wallet.publicKey, sessionToken, sessionWallet, fetchErSession]);

    // ================================================================
    //  BASE LAYER INSTRUCTIONS
    // ================================================================

    /**
     * Create the player's on-chain profile (once per wallet).
     */
    const initializeProfile = useCallback(async (): Promise<string> => {
        if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
        setIsLoading(true);
        setError(null);
        try {
            const tx = await program.methods
                .initializeProfile()
                .accounts({ authority: wallet.publicKey })
                .rpc();
            useCubeStore.getState().addToast(tx, "Initialize Profile");
            await fetchProfile();
            return tx;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to initialize profile";
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, wallet.publicKey, fetchProfile]);

    /**
     * Delegate the GameSession PDA to the MagicBlock Ephemeral Rollup.
     * Call this on devnet BEFORE entering the game.
     */
    const delegateSession = useCallback(async (): Promise<string> => {
        if (!program || !wallet.publicKey) throw new Error("Wallet not connected");
        setIsLoading(true);
        setIsDelegating(true);
        setError(null);
        try {
            const tx = await program.methods
                .delegateSession()
                .accounts({ payer: wallet.publicKey })
                .rpc({ skipPreflight: true });

            useCubeStore.getState().addToast(tx, "Delegate Session");
            console.log("Session successfully delegated to ER cluster.");

            // Wait a bit for delegation to propagate across the network
            await new Promise(r => setTimeout(r, 2000));
            await checkDelegationStatus();
            return tx;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to delegate session";
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
            setIsDelegating(false);
        }
    }, [program, wallet.publicKey, checkDelegationStatus]);

    // ================================================================
    //  EPHEMERAL ROLLUP HOT-PATH INSTRUCTIONS
    //  These run on the ER and are signed by the session key,
    //  so the player's main wallet is NOT prompted.
    // ================================================================

    /**
     * Enter the game on the ER. Resets session state and marks active.
     * @param realm "Jungle" | "Desert" | "Snow"
     */
    const enterGame = useCallback(async (realm: string): Promise<string> => {
        if (!erProgram) throw new Error("ER Program not loaded");
        return sendErTx(erProgram.methods.enterGame(realm), "enterGame");
    }, [erProgram, sendErTx]);

    /**
     * Record placing a block. Fires once per block placed in-game.
     * @param blockType e.g. "Block_Grass", "Block_Stone"
     */
    const placeBlock = useCallback(async (blockType: string): Promise<string> => {
        if (!erProgram) throw new Error("ER Program not loaded");
        return sendErTx(erProgram.methods.placeBlock(blockType), "placeBlock");
    }, [erProgram, sendErTx]);

    /**
     * Record an attack on an entity.
     * @param targetType entity name, e.g. "Wolf", "Skeleton"
     * @param damage damage dealt (1–255)
     */
    const attack = useCallback(async (targetType: string, damage: number): Promise<string> => {
        if (!erProgram) throw new Error("ER Program not loaded");
        return sendErTx(
            erProgram.methods.attack(targetType, damage),
            "attack"
        );
    }, [erProgram, sendErTx]);

    /**
     * Record an entity kill and award score.
     * @param entityType entity name, e.g. "Wolf"
     * @param scoreReward points to award (use KILL_REWARDS or custom)
     * @param mintPubkey Token mint address for the NFT
     */
    const killEntity = useCallback(async (
        entityType: string,
        scoreReward?: number,
        mintPubkey?: PublicKey
    ): Promise<string> => {
        if (!erProgram) throw new Error("ER Program not loaded");
        const reward = scoreReward ?? KILL_REWARDS[entityType] ?? 10;

        // Append mint pubkey to entity type if provided so the program can extract it
        const typeWithMint = mintPubkey
            ? `${entityType}:${mintPubkey.toBase58()}`
            : entityType;

        return sendErTx(
            erProgram.methods.killEntity(typeWithMint, new BN(reward)),
            "killEntity"
        );
    }, [erProgram, sendErTx]);

    /**
     * End the active game session (runs on ER).
     * Must be called before undelegating.
     */
    const endGame = useCallback(async (): Promise<string> => {
        if (!erProgram) throw new Error("ER Program not loaded");
        return sendErTx(erProgram.methods.endGame(), "endGame");
    }, [erProgram, sendErTx]);

    // ================================================================
    //  COMMIT / UNDELEGATE
    // ================================================================

    /**
     * Mid-session checkpoint — persists current ER state to base layer
     * without ending the session.
     */
    const commitSession = useCallback(async (): Promise<string> => {
        if (!program || !erProvider || !wallet.publicKey) {
            throw new Error("Program not loaded or not delegated");
        }
        setIsLoading(true);
        setError(null);
        try {
            let tx = await program.methods
                .commitSession()
                .accounts({ payer: wallet.publicKey })
                .transaction();

            tx.feePayer = wallet.publicKey;
            tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;
            tx = await erProvider.wallet.signTransaction(tx);

            const txHash = await erConnection.sendRawTransaction(tx.serialize(), {
                skipPreflight: true,
            });
            await erConnection.confirmTransaction(txHash, "confirmed");

            useCubeStore.getState().addToast(txHash, "Commit Session");

            // Attempt to get base-layer commitment signature
            try {
                const { GetCommitmentSignature } = await import(
                    "@magicblock-labs/ephemeral-rollups-sdk"
                );
                const sig = await GetCommitmentSignature(txHash, erConnection);
                console.log("Commit settled on base layer:", sig);
            } catch {
                console.debug("GetCommitmentSignature not available");
            }

            await fetchProfile();
            return txHash;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to commit session";
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, erProvider, erConnection, connection, wallet.publicKey, fetchProfile]);

    /**
     * Undelegate the GameSession from the ER and settle final stats
     * into the PlayerProfile on the base layer.
     * Must call endGame() first.
     */
    const undelegateSession = useCallback(async (): Promise<string> => {
        if (!program || !erProvider || !wallet.publicKey) {
            throw new Error("Program not loaded or not delegated");
        }
        setIsLoading(true);
        setError(null);
        try {
            // Collect remaining accounts for NFT minting from ER session state
            const remainingAccounts: { pubkey: PublicKey, isWritable: boolean, isSigner: boolean }[] = [];

            if (erGameSession && erGameSession.pendingMints) {
                for (const pending of erGameSession.pendingMints) {
                    const mint = new PublicKey(pending.mint);

                    // Derive ATA for the player
                    const [ata] = PublicKey.findProgramAddressSync(
                        [
                            wallet.publicKey.toBuffer(),
                            TOKEN_PROGRAM_ID.toBuffer(),
                            mint.toBuffer(),
                        ],
                        ASSOCIATED_TOKEN_PROGRAM_ID
                    );

                    remainingAccounts.push({ pubkey: mint, isWritable: true, isSigner: false });
                    remainingAccounts.push({ pubkey: ata, isWritable: true, isSigner: false });
                }
            }

            let tx = await program.methods
                .undelegateSession()
                .accounts({
                    payer: wallet.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                } as any)
                .remainingAccounts(remainingAccounts)
                .transaction();

            tx.feePayer = wallet.publicKey;
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            if (!wallet.signTransaction) throw new Error("Wallet does not support signing");
            tx = await wallet.signTransaction(tx);

            const txHash = await connection.sendRawTransaction(tx.serialize(), {
                skipPreflight: true,
            });
            await connection.confirmTransaction(txHash, "confirmed");

            useCubeStore.getState().addToast(txHash, "Undelegate Session");
            console.log("Session successfully undelegated and settled on base layer.");

            // Wait for undelegation to propagate
            await new Promise(r => setTimeout(r, 2000));

            setDelegationStatus("undelegated");
            setErGameSession(null);

            await fetchProfile();
            await fetchSession();

            return txHash;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to undelegate session";
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [program, erProvider, erConnection, connection, wallet.publicKey, fetchProfile, fetchSession]);

    // ================================================================
    //  Return
    // ================================================================

    return {
        // Programs
        program,
        erProgram,

        // Account state
        profile,
        profilePubkey,
        gameSession,       // base-layer session (post-undelegate)
        erGameSession,     // live ER session (during gameplay)
        sessionPubkey,

        // Status
        isLoading,
        isDelegating,
        error,
        delegationStatus,
        isSessionLoading,

        // Base layer
        initializeProfile,
        delegateSession,

        // ER hot-path (session-keyed — no wallet popup per tx)
        enterGame,
        placeBlock,
        attack,
        killEntity,
        endGame,

        // Commit / settle
        commitSession,
        undelegateSession,

        // Session key
        createSession,
        sessionToken,

        // Utilities
        refetchProfile: fetchProfile,
        refetchSession: fetchSession,
        refetchErSession: fetchErSession,
        checkDelegation: checkDelegationStatus,

        // Helpers
        KILL_REWARDS,
    };
}
