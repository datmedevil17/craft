import React from "react"
import { useCubeStore, REALM_CONFIG } from "./useStore"
import { WalletMultiButton, useWalletModal } from "@solana/wallet-adapter-react-ui"
import { useWallet } from "@solana/wallet-adapter-react"
import { useMinecraftProgram, KILL_REWARDS } from "./hooks/use-minecraft-program"
import { getNPCResponse } from "./aiService"
import { ENTITY_MINTS } from "./MintConfig"


export const UI = () => {
    const { connected, publicKey, select, wallets } = useWallet()
    const { setVisible } = useWalletModal()
    const {
        currentTool, setTool, tools,
        currentBlock, setBlock, blocks,
        dialogue, closeDialogue, setNPCResponse, setDialogueLoading,
        gameStarted, startGame, realm,
        playerHealth, isGameOver, restartGame,
        showStatsModal, setShowStatsModal,
        showUndelegatePrompt, setShowUndelegatePrompt,
        endGame: endGameState,
        blockchainActions
    } = useCubeStore()

    const {
        profile,
        delegationStatus,
        sessionToken,
        isLoading,
        isSessionLoading,
        isDelegating,
        initializeProfile,
        createSession,
        delegateSession,
        undelegateSession,
        enterGame,
        endGame,
        placeBlock,
        attack,
        killEntity,
        erGameSession
    } = useMinecraftProgram()

    const [userInput, setUserInput] = React.useState("")

    const handleSend = async () => {
        if (!userInput.trim()) return
        setDialogueLoading(true)
        const response = await getNPCResponse(userInput, dialogue.npcType)
        setNPCResponse(response)
        setUserInput("")
    }

    // Onboarding flow state
    const isProfileReady = !!profile
    const isSessionReady = !!sessionToken
    const isDelegated = delegationStatus === "delegated"

    // Bridge blockchain actions to store
    React.useEffect(() => {
        blockchainActions.placeBlock = (type) => {
            console.log("Blockchain Action: placeBlock", type)
            placeBlock(type).catch(console.error)
        }
        blockchainActions.attack = (target, damage) => {
            console.log("Blockchain Action: attack", target, damage)
            attack(target, damage).catch(console.error)
        }
        blockchainActions.killEntity = (type, reward) => {
            console.log("Blockchain Action: killEntity", type)
            // Use provided reward or lookup in KILL_REWARDS
            const finalReward = reward ?? (KILL_REWARDS[type] || 0);
            console.log(`[Score] Killing ${type}. Reward: ${finalReward}`);
            killEntity(type, finalReward).catch(console.error)
        }
        blockchainActions.enterGame = (realm) => {
            console.log("Blockchain Action: enterGame", realm)
            enterGame(realm).catch(console.error)
        }
    }, [placeBlock, attack, killEntity, enterGame, blockchainActions])

    React.useEffect(() => {
        if (isDelegated) {
            console.log("Game session is DELEGATED!");
        }
    }, [isDelegated]);

    const setupSteps = [
        { label: "Connect Wallet", done: connected, current: !connected },
        { label: "Init Profile", done: isProfileReady, current: connected && !isProfileReady },
        { label: "Create Session", done: isSessionReady, current: isProfileReady && !isSessionReady },
        { label: "Delegate", done: isDelegated, current: isSessionReady && !isDelegated }
    ]

    const handleStepAction = async (step) => {
        console.log("Step clicked:", step.label)
        if (step.label === "Connect Wallet") {
            const solflare = wallets.find(w => w.adapter.name === 'Solflare')
            if (solflare) {
                console.log("Selecting Solflare...")
                select(solflare.adapter.name)
            } else {
                console.log("Solflare not found, showing modal...")
                setVisible(true)
            }
        }
        if (step.label === "Init Profile") await initializeProfile()
        if (step.label === "Create Session") await createSession()
        if (step.label === "Delegate") await delegateSession()
    }

    if (!gameStarted) {
        if (showUndelegatePrompt && isDelegated) {
            return (
                <div style={{
                    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                    background: "rgba(0,0,0,0.9)", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", color: "white",
                    fontFamily: "'Press Start 2P', cursive", zIndex: 4000, pointerEvents: "auto"
                }}>
                    <h2 style={{ color: "#55FF55", marginBottom: "30px" }}>SETTLE GAME SESSION?</h2>
                    <p style={{ fontSize: "12px", textAlign: "center", maxWidth: "500px", lineHeight: "1.6", marginBottom: "40px" }}>
                        Ending your game move state back to the base layer. This updates your permanent profile stats.
                    </p>
                    <div style={{ display: "flex", gap: "20px" }}>
                        <button
                            onClick={async () => {
                                await undelegateSession()
                                setShowUndelegatePrompt(false)
                            }}
                            disabled={isLoading}
                            style={{
                                padding: "15px 30px", background: "#55FF55", color: "black",
                                border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px"
                            }}
                        >
                            {isLoading ? "SETTLING..." : "SETTLE & EXIT"}
                        </button>
                        <button
                            onClick={() => setShowUndelegatePrompt(false)}
                            style={{
                                padding: "15px 30px", background: "#333", color: "white",
                                border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px"
                            }}
                        >
                            CANCEL
                        </button>
                    </div>
                </div>
            )
        }

        return (
            <div style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", color: "white", fontFamily: "'Press Start 2P', cursive",
                zIndex: 2000, pointerEvents: "auto"
            }}>
                <div style={{ position: "absolute", top: 20, right: 20, zIndex: 10000 }}>
                    <WalletMultiButton />
                </div>

                <h1 style={{
                    fontSize: "52px", marginBottom: "10px", color: "#fff",
                    textShadow: "0 0 20px rgba(74,144,226,0.8)", letterSpacing: "4px", fontWeight: "900"
                }}>MAGICCRAFT</h1>

                {/* Onboarding Steps */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "40px", marginTop: "20px" }}>
                    {setupSteps.map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div
                                onClick={() => s.current && handleStepAction(s)}
                                style={{
                                    padding: "10px 15px", borderRadius: "8px", fontSize: "10px",
                                    background: s.done ? "#55FF55" : (s.current ? "#4a90e2" : "#333"),
                                    color: s.done ? "black" : "white",
                                    cursor: s.current ? "pointer" : "default",
                                    border: s.current ? "2px solid white" : "2px solid transparent",
                                    opacity: (s.done || s.current) ? 1 : 0.5,
                                    transition: "all 0.3s"
                                }}
                            >
                                {s.done ? "✓ " : ""}{s.label}
                                {s.current && isLoading && "..."}
                            </div>
                            {i < setupSteps.length - 1 && <div style={{ color: "#555" }}>→</div>}
                        </div>
                    ))}
                </div>

                <p style={{ marginBottom: "30px", fontSize: "14px", opacity: isDelegated ? 1 : 0.5, letterSpacing: "2px" }}>
                    {isDelegated ? "SELECT YOUR REALM" : "COMPLETE STEPS ABOVE TO PLAY"}
                </p>

                <div style={{ display: "flex", gap: "30px", opacity: isDelegated ? 1 : 0.3, pointerEvents: isDelegated ? "auto" : "none" }}>
                    {Object.keys(REALM_CONFIG).map((r) => {
                        const config = REALM_CONFIG[r]
                        return (
                            <div
                                key={r} onClick={() => {
                                    blockchainActions.enterGame(r)
                                    startGame(r)
                                }}
                                style={{
                                    width: "200px", height: "280px", background: "rgba(0,0,0,0.4)",
                                    borderRadius: "15px", border: "2px solid rgba(255,255,255,0.1)",
                                    cursor: "pointer", display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "flex-end",
                                    transition: "all 0.3s", position: "relative", overflow: "hidden",
                                    padding: "20px", boxSizing: "border-box"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.border = "2px solid #fff"; e.currentTarget.style.transform = "translateY(-10px)" }}
                                onMouseLeave={(e) => { e.currentTarget.style.border = "2px solid rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)" }}
                            >
                                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: `url(${config.preview}) center/cover no-repeat`, opacity: 0.6 }}></div>
                                <h2 style={{ zIndex: 1, margin: "0 0 10px 0", fontSize: "16px", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{r}</h2>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (isGameOver) {
        return (
            <div style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                background: "rgba(139, 0, 0, 0.8)", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", color: "white",
                fontFamily: "'Press Start 2P', cursive", zIndex: 3000, pointerEvents: "auto"
            }}>
                <h1 style={{ fontSize: "80px", margin: 0, textShadow: "0 5px 15px rgba(0,0,0,0.5)" }}>YOU DIED</h1>
                <button
                    onClick={restartGame}
                    style={{
                        marginTop: "40px", padding: "15px 40px", fontSize: "24px",
                        background: "white", color: "black", border: "none", borderRadius: "10px",
                        cursor: "pointer", fontWeight: "bold", transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
                    onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                >
                    RESPAWN
                </button>
            </div>
        )
    }

    return (
        <>
            {/* IN-GAME HEADER BOX */}
            <div
                onClick={() => setShowStatsModal(true)}
                style={{
                    position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.8)", border: "2px solid #55FF55", borderRadius: "8px",
                    padding: "10px 20px", color: "white", fontFamily: "'Press Start 2P', cursive",
                    display: "flex", gap: "30px", cursor: "pointer", zIndex: 1000, pointerEvents: "auto",
                    boxShadow: "0 0 15px rgba(85,255,85,0.2)"
                }}
            >
                <div style={{ fontSize: "10px" }}>
                    <div style={{ color: "#55FF55", marginBottom: "4px" }}>PLAYER</div>
                    <div>{publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}</div>
                </div>
                <div style={{ fontSize: "10px" }}>
                    <div style={{ color: "#55FF55", marginBottom: "4px" }}>SCORE</div>
                    <div>{erGameSession?.score.toString() || "0"}</div>
                </div>
                <div style={{ fontSize: "10px" }}>
                    <div style={{ color: "#55FF55", marginBottom: "4px" }}>SESSION</div>
                    <div>{isDelegated ? "DELEGATED" : "LOCAL"}</div>
                </div>
            </div>

            {/* STATS MODAL */}
            {showStatsModal && (
                <div style={{
                    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                    background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center",
                    justifyContent: "center", zIndex: 5000, pointerEvents: "auto"
                }}>
                    <div style={{
                        width: "400px", background: "#1a1a1a", border: "3px solid #55FF55",
                        padding: "30px", color: "white", fontFamily: "'Press Start 2P', cursive"
                    }}>
                        <h2 style={{ color: "#55FF55", textAlign: "center", marginBottom: "30px", fontSize: "18px" }}>PROFILE STATS</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px", fontSize: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>TOTAL SCORE:</span>
                                <span>{profile?.totalScore.toString() || "0"}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>TOTAL KILLS:</span>
                                <span>{profile?.totalKills.toString() || "0"}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>BLOCKS PLACED:</span>
                                <span>{profile?.totalBlocksPlaced.toString() || "0"}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>GAMES PLAYED:</span>
                                <span>{profile?.gamesPlayed || "0"}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowStatsModal(false)}
                            style={{
                                width: "100%", marginTop: "40px", padding: "12px", background: "#55FF55",
                                color: "black", border: "none", cursor: "pointer", fontFamily: "'Press Start 2P', cursive"
                            }}
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            )}

            <div style={{ position: "absolute", top: 20, right: 20, pointerEvents: "auto" }}>
                <WalletMultiButton />
            </div>

            {/* END GAME BUTTON */}
            <div style={{ position: "absolute", bottom: 20, right: 20, pointerEvents: "auto" }}>
                <button
                    onClick={async () => {
                        try {
                            // 1. Call on-chain endGame (ER instruction)
                            // This marks the session as inactive so it can be undelegated.
                            await endGame()
                            // 2. Show the settlement prompt
                            endGameState()
                        } catch (err) {
                            console.error("Failed to end game on-chain:", err)
                            // Fallback to showing the prompt anyway if error
                            endGameState()
                        }
                    }}
                    style={{
                        padding: "12px 20px", background: "#FF5555", color: "white",
                        border: "none", borderRadius: "8px", cursor: "pointer",
                        fontFamily: "'Press Start 2P', cursive", fontSize: "10px"
                    }}
                >
                    QUIT GAME
                </button>
            </div>

            {dialogue.isOpen && (
                <div style={{
                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                    width: "400px", background: "rgba(0,0,0,0.85)", padding: "20px",
                    borderRadius: "15px", border: "2px solid #4a90e2", color: "white",
                    fontFamily: "'VT323', monospace", pointerEvents: "auto", zIndex: 1000
                }}>
                    <h3 style={{ marginTop: 0, color: "#4a90e2" }}>{dialogue.npcType?.replace('_', ' ')}</h3>
                    <div style={{
                        height: "150px", overflowY: "auto", marginBottom: "15px", padding: "10px",
                        background: "rgba(255,255,255,0.05)", borderRadius: "8px", fontSize: "14px", lineHeight: "1.4"
                    }}>
                        {dialogue.isLoading ? "Thinking..." : dialogue.npcResponse}
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <input
                            type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask something..."
                            style={{
                                flex: 1, background: "#222", color: "white", border: "1px solid #444",
                                padding: "8px", borderRadius: "4px", outline: "none"
                            }}
                        />
                        <button onClick={handleSend} style={{ background: "#4a90e2", color: "white", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer" }}>Send</button>
                        <button onClick={closeDialogue} style={{ background: "#e74c3c", color: "white", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer" }}>Close</button>
                    </div>
                </div>
            )}

            <div style={{ position: "absolute", top: 20, left: 20, pointerEvents: "auto", display: "flex", flexDirection: "column", gap: "10px", fontFamily: "'VT323', monospace" }}>
                <div style={{ width: "250px", height: "30px", background: "rgba(0,0,0,0.5)", borderRadius: "15px", border: "2px solid white", overflow: "hidden", position: "relative" }}>
                    <div style={{
                        width: `${playerHealth}%`, height: "100%", background: "linear-gradient(90deg, #ff4d4d, #ff0000)",
                        transition: "width 0.3s ease", boxShadow: "0 0 10px rgba(255,0,0,0.5)"
                    }} />
                    <div style={{ position: "absolute", width: "100%", textAlign: "center", top: 4, fontSize: "18px", fontWeight: "bold", textShadow: "1px 1px black" }}>
                        HP: {playerHealth}
                    </div>
                </div>

                <div style={{ background: "rgba(0,0,0,0.7)", padding: "10px", borderRadius: "8px", border: `2px solid ${REALM_CONFIG[realm].groundColor}`, color: "white" }}>
                    <div style={{ marginBottom: "5px", fontSize: "14px", fontWeight: "bold", color: "#4a90e2" }}>REALM: {realm.toUpperCase()}</div>
                </div>

                <div style={{ background: "rgba(0,0,0,0.5)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>
                    <div style={{ marginBottom: "5px", fontSize: "12px", opacity: 0.7 }}>SELECT TOOL</div>
                    <select
                        value={currentTool} onChange={(e) => setTool(e.target.value)}
                        style={{ width: "100%", background: "#222", color: "white", border: "1px solid #444", padding: "5px", borderRadius: "4px", outline: "none" }}
                    >
                        {tools.map(tool => (
                            <option key={tool} value={tool}>{tool.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>

                <div style={{ background: "rgba(0,0,0,0.5)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>
                    <div style={{ marginBottom: "5px", fontSize: "12px", opacity: 0.7 }}>SELECT BLOCK</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px" }}>
                        {blocks.map(block => (
                            <div
                                key={block} onClick={() => setBlock(block)} title={block.replace('Block_', '')}
                                style={{
                                    width: "45px", height: "45px", background: currentBlock === block ? "#4a90e2" : "#333",
                                    border: currentBlock === block ? "2px solid white" : "1px solid #555",
                                    borderRadius: "4px", cursor: "pointer", display: "flex",
                                    alignItems: "center", justifyContent: "center", fontSize: "10px",
                                    textAlign: "center", overflow: "hidden"
                                }}
                            >
                                <span style={{ transform: "scale(0.8)" }}>{block.replace('Block_', '').substring(0, 5)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: "10px", fontSize: "12px", color: "white", opacity: 0.8, textShadow: "1px 1px 2px black" }}>
                    <b>L-Click:</b> Remove | <b>R-Click:</b> Place
                </div>
            </div>
        </>
    )
}
