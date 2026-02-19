import React from "react"
import { useCubeStore } from "./useStore"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

export const UI = () => {
    const { currentTool, setTool, tools, currentBlock, setBlock, blocks } = useCubeStore()

    return (
        <>
            <div style={{ position: "absolute", top: 20, right: 20, pointerEvents: "auto" }}>
                <WalletMultiButton />
            </div>
            <div style={{ position: "absolute", top: 20, left: 20, pointerEvents: "auto", display: "flex", flexDirection: "column", gap: "10px", fontFamily: "'Inter', sans-serif" }}>
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
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "5px" }}>
                        {blocks.map(block => (
                            <div
                                key={block}
                                onClick={() => setBlock(block)}
                                title={block.replace('Block_', '')}
                                style={{
                                    width: "40px",
                                    height: "40px",
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
                                <span style={{ transform: "scale(0.8)" }}>{block.replace('Block_', '').substring(0, 3)}</span>
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
