import React from "react"
import { useCubeStore, REALM_CONFIG } from "./useStore"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { getNPCResponse } from "./aiService"

export const UI = () => {
    const {
        currentTool, setTool, tools,
        currentBlock, setBlock, blocks,
        dialogue, closeDialogue, setNPCResponse, setDialogueLoading,
        gameStarted, startGame, realm,
        playerHealth, isGameOver, restartGame
    } = useCubeStore()

    const [userInput, setUserInput] = React.useState("")

    const handleSend = async () => {
        if (!userInput.trim()) return
        setDialogueLoading(true)
        const response = await getNPCResponse(userInput, dialogue.npcType)
        setNPCResponse(response)
        setUserInput("")
    }

    if (!gameStarted) {
        return (
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontFamily: "'VT323', monospace",
                zIndex: 2000,
                pointerEvents: "auto"
            }}>
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0.1,
                    backgroundImage: "radial-gradient(#4a90e2 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                    pointerEvents: "none"
                }}></div>

                <h1 style={{
                    fontSize: "72px",
                    marginBottom: "10px",
                    color: "#fff",
                    textShadow: "0 0 20px rgba(74,144,226,0.8)",
                    letterSpacing: "4px",
                    fontWeight: "900",
                    fontFamily: "'Press Start 2P', cursive"
                }}>MEINKRAFT</h1>
                <p style={{ marginBottom: "50px", fontSize: "24px", opacity: 0.8, letterSpacing: "2px" }}>SELECT YOUR REALM</p>

                <div style={{ display: "flex", gap: "30px" }}>
                    {Object.keys(REALM_CONFIG).map((r) => {
                        const config = REALM_CONFIG[r]
                        const gradients = {
                            Jungle: "linear-gradient(to bottom, rgba(45, 90, 39, 0.8), rgba(20, 40, 18, 0.9))",
                            Desert: "linear-gradient(to bottom, rgba(210, 180, 140, 0.8), rgba(139, 69, 19, 0.9))",
                            Snow: "linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(135, 206, 235, 0.9))"
                        }
                        return (
                            <div
                                key={r}
                                onClick={() => startGame(r)}
                                style={{
                                    width: "240px",
                                    height: "320px",
                                    background: gradients[r],
                                    borderRadius: "20px",
                                    border: "2px solid rgba(255,255,255,0.1)",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                    position: "relative",
                                    overflow: "hidden",
                                    padding: "30px",
                                    boxSizing: "border-box",
                                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-15px) scale(1.02)"
                                    e.currentTarget.style.border = "2px solid #fff"
                                    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(255,255,255,0.2)"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0) scale(1)"
                                    e.currentTarget.style.border = "2px solid rgba(255,255,255,0.1)"
                                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)"
                                }}
                            >
                                <div style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    background: `url(${config.preview}) center/cover no-repeat`,
                                    opacity: 0.8,
                                    zIndex: 0
                                }}></div>

                                <h2 style={{ zIndex: 1, margin: "0 0 10px 0", fontSize: "24px", fontWeight: "800", textShadow: "0 2px 10px rgba(0,0,0,0.5)", fontFamily: "'Press Start 2P', cursive" }}>{r}</h2>
                                <div style={{
                                    zIndex: 1,
                                    padding: "8px 20px",
                                    background: "rgba(255,255,255,0.2)",
                                    backdropFilter: "blur(5px)",
                                    borderRadius: "30px",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    textTransform: "uppercase",
                                    letterSpacing: "1px"
                                }}>Enter World</div>
                            </div>
                        )
                    })}
                </div>
                <div style={{ marginTop: "60px" }}>
                    <WalletMultiButton />
                </div>
            </div>
        )
    }

    if (isGameOver) {
        return (
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(139, 0, 0, 0.8)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontFamily: "'Press Start 2P', cursive",
                zIndex: 3000,
                pointerEvents: "auto"
            }}>
                <h1 style={{ fontSize: "80px", margin: 0, textShadow: "0 5px 15px rgba(0,0,0,0.5)" }}>YOU DIED</h1>
                <button
                    onClick={restartGame}
                    style={{
                        marginTop: "40px",
                        padding: "15px 40px",
                        fontSize: "24px",
                        background: "white",
                        color: "black",
                        border: "none",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        transition: "all 0.2s"
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
            <div style={{ position: "absolute", top: 20, right: 20, pointerEvents: "auto" }}>
                <WalletMultiButton />
            </div>

            {dialogue.isOpen && (
                <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "400px",
                    background: "rgba(0,0,0,0.85)",
                    padding: "20px",
                    borderRadius: "15px",
                    border: "2px solid #4a90e2",
                    color: "white",
                    fontFamily: "'VT323', monospace",
                    pointerEvents: "auto",
                    zIndex: 1000
                }}>
                    <h3 style={{ marginTop: 0, color: "#4a90e2" }}>{dialogue.npcType?.replace('_', ' ')}</h3>
                    <div style={{
                        height: "150px",
                        overflowY: "auto",
                        marginBottom: "15px",
                        padding: "10px",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        lineHeight: "1.4"
                    }}>
                        {dialogue.isLoading ? "Thinking..." : dialogue.npcResponse}
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask something..."
                            style={{
                                flex: 1,
                                background: "#222",
                                color: "white",
                                border: "1px solid #444",
                                padding: "8px",
                                borderRadius: "4px",
                                outline: "none"
                            }}
                        />
                        <button
                            onClick={handleSend}
                            style={{
                                background: "#4a90e2",
                                color: "white",
                                border: "none",
                                padding: "8px 15px",
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
                        >
                            Send
                        </button>
                        <button
                            onClick={closeDialogue}
                            style={{
                                background: "#e74c3c",
                                color: "white",
                                border: "none",
                                padding: "8px 15px",
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div style={{ position: "absolute", top: 20, left: 20, pointerEvents: "auto", display: "flex", flexDirection: "column", gap: "10px", fontFamily: "'VT323', monospace" }}>
                <div style={{ width: "250px", height: "30px", background: "rgba(0,0,0,0.5)", borderRadius: "15px", border: "2px solid white", overflow: "hidden", position: "relative" }}>
                    <div style={{
                        width: `${playerHealth}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #ff4d4d, #ff0000)",
                        transition: "width 0.3s ease",
                        boxShadow: "0 0 10px rgba(255,0,0,0.5)"
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
                        value={currentTool}
                        onChange={(e) => setTool(e.target.value)}
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
                                key={block}
                                onClick={() => setBlock(block)}
                                title={block.replace('Block_', '')}
                                style={{
                                    width: "45px",
                                    height: "45px",
                                    background: currentBlock === block ? "#4a90e2" : "#333",
                                    border: currentBlock === block ? "2px solid white" : "1px solid #555",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "10px",
                                    textAlign: "center",
                                    overflow: "hidden"
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
