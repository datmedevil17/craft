import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, setProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { type Meinkraft } from "../idl/meinkraft";
import IDL from "../idl/meinkraft-idl";
import { useSessionKeyManager } from "@magicblock-labs/gum-react-sdk";
import { useCubeStore } from "../useStore";

// ----------------------------------------------------------------
//  Types
// ----------------------------------------------------------------

export interface MeinkraftAccount {
    authority: PublicKey;
    realm: string;
    blocksPlaced: bigint;
    attacks: bigint;
    kills: bigint;
    score: bigint;
    gamesPlayed: bigint;
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

const ER_ENDPOINT = "https://devnet.magicblock.app";
const ER_WS_ENDPOINT = "wss://devnet.magicblock.app";

// Score rewards for kills
export const KILL_REWARDS: Record<string, number> = {
    Chick: 5, Chicken: 8, Pig: 10, Sheep: 8, Horse: 12, Wolf: 15,
    Dog: 12, Cat: 8, Raccoon: 12, Skeleton: 20, Skeleton_Armor: 30,
    Hedgehog: 15, Giant: 50, Zombie: 25, Demon: 40, Goblin: 15,
    Yeti: 50, Wizard: 35, Cow: 10, Spider: 20,
};

// ----------------------------------------------------------------
//  PDA helpers
// ----------------------------------------------------------------

function deriveMeinkraftPDA(authority: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [authority.toBuffer()],
        PROGRAM_ID
    );
    return pda;
}

// ----------------------------------------------------------------
//  Hook
// ----------------------------------------------------------------

export function useMinecraftProgram() {
    useEffect(() => {
        console.log("[Status] useMinecraftProgram loaded (v5 - IDL-aligned)");
    }, []);

    const { connection } = useConnection();
    const wallet = useWallet();

    // ---- State ----
    const [meinkraftPubkey, setMeinkraftPubkey] = useState<PublicKey | null>(null);
    const [account, setAccount] = useState<MeinkraftAccount | null>(null);
    const [erAccount, setErAccount] = useState<MeinkraftAccount | null>(null);
    const [delegationStatus, setDelegationStatus] = useState<DelegationStatus>("checking");
    const [isLoading, setIsLoading] = useState(false);
    const [isDelegating, setIsDelegating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ---- Base layer Program ----
    const program = useMemo(() => {
        if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) return null;
        const provider = new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
        setProvider(provider);
        return new Program<Meinkraft>(IDL as Meinkraft, provider);
    }, [connection, wallet]);

    // ---- ER connection ----
    const erConnection = useMemo(() =>
        new Connection(ER_ENDPOINT, { wsEndpoint: ER_WS_ENDPOINT, commitment: "confirmed" }),
        []);

    const sessionWallet = useSessionKeyManager(wallet as any, connection, "devnet");
    const { sessionToken, createSession: sdkCreateSession, isLoading: isSessionLoading, revokeSession } = sessionWallet;
    const createSession = useCallback(() => sdkCreateSession(PROGRAM_ID), [sdkCreateSession]);

    // ---- ER Program (Anchor 0.30+) ----
    const erProgram = useMemo(() => {
        const hasSession = sessionToken != null && sessionWallet?.publicKey != null;
        const signer = hasSession ? sessionWallet : (wallet.publicKey ? wallet : null);
        if (!signer) return null;
        const provider = new AnchorProvider(erConnection, signer as any, { commitment: "confirmed" });
        return new Program<Meinkraft>(IDL as Meinkraft, provider);
    }, [erConnection, wallet, sessionToken, sessionWallet]);

    // ---- Derive PDA ----
    useEffect(() => {
        if (wallet.publicKey) {
            setMeinkraftPubkey(deriveMeinkraftPDA(wallet.publicKey));
        } else {
            setMeinkraftPubkey(null);
            setAccount(null);
            setErAccount(null);
            setDelegationStatus("checking");
        }
    }, [wallet.publicKey]);

    // ---- Fetchers ----
    const fetchAccount = useCallback(async () => {
        if (!program || !meinkraftPubkey) return;
        try {
            const acc = await program.account.meinkraftAccount.fetch(meinkraftPubkey);
            setAccount({
                authority: acc.authority,
                realm: acc.realm,
                blocksPlaced: BigInt(acc.blocksPlaced.toString()),
                attacks: BigInt(acc.attacks.toString()),
                kills: BigInt(acc.kills.toString()),
                score: BigInt(acc.score.toString()),
                gamesPlayed: BigInt(acc.gamesPlayed.toString()),
                active: acc.active,
            });
        } catch (err) {
            console.debug("Meinkraft account not found:", err);
            setAccount(null);
        }
    }, [program, meinkraftPubkey]);

    const fetchErAccount = useCallback(async () => {
        if (!erProgram || !meinkraftPubkey) return;
        try {
            const acc = await erProgram.account.meinkraftAccount.fetch(meinkraftPubkey, "confirmed");
            setErAccount({
                authority: acc.authority,
                realm: acc.realm,
                blocksPlaced: BigInt(acc.blocksPlaced.toString()),
                attacks: BigInt(acc.attacks.toString()),
                kills: BigInt(acc.kills.toString()),
                score: BigInt(acc.score.toString()),
                gamesPlayed: BigInt(acc.gamesPlayed.toString()),
                active: acc.active,
            });
        } catch { setErAccount(null); }
    }, [erProgram, meinkraftPubkey]);

    const checkDelegation = useCallback(async (currentOwner?: PublicKey) => {
        if (!meinkraftPubkey) return;
        try {
            let owner = currentOwner;
            if (!owner) {
                const info = await connection.getAccountInfo(meinkraftPubkey);
                if (!info) { setDelegationStatus("undelegated"); return; }
                owner = info.owner;
            }
            const isDelegated = owner.equals(DELEGATION_PROGRAM_ID);
            const status = isDelegated ? "delegated" : "undelegated";
            setDelegationStatus(prev => {
                if (prev !== status || true) { // Force log for visibility
                    console.log(`[Status] Account Owner: ${owner?.toBase58()}`);
                    console.log(`[Status] Delegation: ${status.toUpperCase()}`);
                }
                return status;
            });
            if (isDelegated) fetchErAccount();
            else setErAccount(null);
        } catch (err) { console.error("Check delegation failed:", err); }
    }, [meinkraftPubkey, connection, fetchErAccount]);

    // ---- Subscriptions ----
    useEffect(() => {
        if (!program || !meinkraftPubkey) return;
        fetchAccount();
        checkDelegation();
        const sub = connection.onAccountChange(meinkraftPubkey, (info) => {
            fetchAccount();
            checkDelegation(info.owner);
        }, "confirmed");
        return () => { connection.removeAccountChangeListener(sub); };
    }, [program, meinkraftPubkey, connection]);

    useEffect(() => {
        if (!erProgram || !meinkraftPubkey || delegationStatus !== "delegated") return;
        const sub = erConnection.onAccountChange(meinkraftPubkey, () => fetchErAccount(), "confirmed");
        return () => { erConnection.removeAccountChangeListener(sub); };
    }, [erProgram, meinkraftPubkey, erConnection, delegationStatus, fetchErAccount]);

    // ---- Actions ----
    const sendErTx = useCallback(async (methodBuilder: any, actionName: string) => {
        if (!erProgram || !wallet.publicKey) throw new Error("Not ready");
        setIsLoading(true);
        try {
            const hasSession = sessionToken != null && sessionWallet?.publicKey != null;
            const signer = hasSession ? sessionWallet.publicKey! : wallet.publicKey;
            let tx = await methodBuilder
                .accounts({
                    signer,
                    sessionToken: hasSession ? sessionToken : null,
                    meinkraftAccount: meinkraftPubkey
                })
                .transaction();

            tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;
            tx.feePayer = signer;
            tx = await (hasSession ? sessionWallet.signTransaction!(tx) : wallet.signTransaction!(tx));

            const txHash = await erConnection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
            await erConnection.confirmTransaction(txHash, "confirmed");
            useCubeStore.getState().addToast(actionName, txHash);
            await fetchErAccount();
            return txHash;
        } catch (err: any) {
            console.error(`ER Tx Error (${actionName}):`, err);
            const msg = err?.message?.toLowerCase() || "";
            // If the error suggests the session token is expired or unauthorized, clear it
            if (msg.includes("expire") || msg.includes("session") || msg.includes("signature verification failed") || msg.includes("0xbbf") || msg.includes("unauthorized")) {
                console.log("[Status] Session appears expired. Revoking...");
                useCubeStore.getState().addToast("Session Expired", "Please INIT SESSION again");
                if (revokeSession) revokeSession();
            }
            setError(err instanceof Error ? err.message : "Error");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [erProgram, wallet, sessionToken, sessionWallet, meinkraftPubkey, erConnection, fetchErAccount]);

    const initialize = useCallback(async () => {
        if (!program || !wallet.publicKey) return;
        setIsLoading(true);
        try {
            const tx = await program.methods
                .initialize()
                .accounts({ authority: wallet.publicKey })
                .rpc();
            useCubeStore.getState().addToast("Initialize", tx);
            await fetchAccount();
        } finally { setIsLoading(false); }
    }, [program, wallet.publicKey, fetchAccount]);

    const delegateSession = useCallback(async () => {
        if (!program || !wallet.publicKey) return;
        setIsLoading(true); setIsDelegating(true);
        try {
            const tx = await program.methods
                .delegate()
                .accounts({ payer: wallet.publicKey })
                .rpc({ skipPreflight: true });
            useCubeStore.getState().addToast("Delegate", tx);
            await new Promise(r => setTimeout(r, 2000));
            await checkDelegation();
        } finally { setIsLoading(false); setIsDelegating(false); }
    }, [program, wallet.publicKey, checkDelegation]);

    const enterGame = (realm: string) => sendErTx(erProgram?.methods.enterGame(realm), "Enter Game");
    const placeBlock = (type: string) => sendErTx(erProgram?.methods.placeBlock(type), "Place Block");
    const attack = (type: string, dmg: number) => sendErTx(erProgram?.methods.attack(type, dmg), "Attack");
    const killEntity = (type: string, reward: number) => sendErTx(erProgram?.methods.killEntity(type, new BN(reward)), "Kill Entity");
    const endGame = () => sendErTx(erProgram?.methods.endGame(), "End Game");

    const commitSession = useCallback(async () => {
        if (!program || !wallet.publicKey) return;
        setIsLoading(true);
        try {
            let tx = await program.methods
                .commit()
                .accounts({ payer: wallet.publicKey })
                .transaction();

            tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;
            tx.feePayer = wallet.publicKey;
            tx = await wallet.signTransaction!(tx);

            const txHash = await erConnection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
            await erConnection.confirmTransaction(txHash, "confirmed");
            useCubeStore.getState().addToast("Commit", txHash);
            await fetchAccount();
        } finally { setIsLoading(false); }
    }, [program, wallet, erConnection, fetchAccount]);

    const undelegateSession = useCallback(async () => {
        if (!program || !wallet.publicKey) return;
        setIsLoading(true);
        try {
            let tx = await program.methods
                .undelegate()
                .accounts({ payer: wallet.publicKey })
                .transaction();

            tx.recentBlockhash = (await erConnection.getLatestBlockhash()).blockhash;
            tx.feePayer = wallet.publicKey;
            tx = await wallet.signTransaction!(tx);

            const txHash = await erConnection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
            await erConnection.confirmTransaction(txHash, "confirmed");
            useCubeStore.getState().addToast("Undelegate", txHash);
            await new Promise(r => setTimeout(r, 2000));
            setDelegationStatus("undelegated");
            await fetchAccount();
        } finally { setIsLoading(false); }
    }, [program, wallet, erConnection, fetchAccount]);

    return {
        program, erProgram, account, profile: erAccount || account, erAccount, erGameSession: erAccount,
        isLoading, isDelegating, error, delegationStatus, isSessionLoading,
        initialize, initializeProfile: initialize, delegateSession,
        enterGame, placeBlock, attack, killEntity, endGame,
        commitSession, undelegateSession, createSession, sessionToken, revokeSession,
        checkDelegation, KILL_REWARDS,
    };
}
