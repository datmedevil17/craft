import React, { useEffect } from "react"
import { useCubeStore } from "./useStore"

// ─── Minecraft-style TX success toast ────────────────────────────────────────
// Stacks in bottom-right corner. Each toast:
//   • shows a label + short tx hash
//   • opens Solana Explorer (devnet) on click
//   • auto-dismisses after 6 s
// ─────────────────────────────────────────────────────────────────────────────

const EXPLORER_BASE = "https://explorer.solana.com/tx"
const CLUSTER = "devnet"
const LIFETIME_MS = 6000

function Toast({ toast }) {
    const removeToast = useCubeStore((s) => s.removeToast)

    useEffect(() => {
        const timer = setTimeout(() => removeToast(toast.id), LIFETIME_MS)
        return () => clearTimeout(timer)
    }, [toast.id, removeToast])

    const explorerUrl = toast.hash ? `${EXPLORER_BASE}/${toast.hash}?cluster=${CLUSTER}` : null
    const shortHash = toast.hash ? `${toast.hash.slice(0, 6)}…${toast.hash.slice(-4)}` : null

    return (
        <div
            onClick={() => explorerUrl && window.open(explorerUrl, "_blank", "noopener,noreferrer")}
            title={toast.hash ? "Click to view on Solana Explorer" : ""}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                padding: "12px 16px",
                background: "rgba(15, 15, 15, 0.97)",
                border: "2px solid #55FF55",
                borderRadius: "4px",
                boxShadow: "0 0 12px rgba(85,255,85,0.35), inset 0 0 8px rgba(85,255,85,0.05)",
                cursor: "pointer",
                maxWidth: "320px",
                fontFamily: "'Press Start 2P', monospace",
                userSelect: "none",
                animation: "mc-toast-in 0.2s ease-out",
                pointerEvents: "auto",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#88FF88"
                e.currentTarget.style.boxShadow = "0 0 20px rgba(85,255,85,0.5), inset 0 0 12px rgba(85,255,85,0.1)"
                e.currentTarget.style.backgroundColor = "rgba(25, 25, 25, 0.99)"
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#55FF55"
                e.currentTarget.style.boxShadow = "0 0 12px rgba(85,255,85,0.35), inset 0 0 8px rgba(85,255,85,0.05)"
                e.currentTarget.style.backgroundColor = "rgba(15, 15, 15, 0.97)"
            }}
        >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "10px", color: "#55FF55" }}>{toast.hash ? "✔" : "ℹ"}</span>
                <span style={{ fontSize: "9px", color: "#55FF55", letterSpacing: "1px" }}>
                    {toast.hash ? "TX SUCCESS" : "MESSAGE"}
                </span>
            </div>

            {/* Label */}
            <div style={{ fontSize: "8px", color: "#CCCCCC", letterSpacing: "0.5px" }}>
                {toast.label}
            </div>

            {toast.hash && (
                <>
                    {/* Hash */}
                    <div style={{ fontSize: "7px", color: "#888888", fontFamily: "monospace", letterSpacing: "0.5px" }}>
                        {shortHash}
                    </div>

                    {/* CTA */}
                    <div style={{
                        marginTop: "4px",
                        fontSize: "7px",
                        color: "#55FF55",
                        opacity: 0.75,
                        letterSpacing: "0.5px",
                    }}>
                        VIEW ON EXPLORER →
                    </div>
                </>
            )}
        </div>
    )
}

export function TxToast() {
    const toasts = useCubeStore((s) => s.toasts)

    if (!toasts.length) return null

    return (
        <>
            {/* Keyframe injection (once per mount) */}
            <style>{`
                @keyframes mc-toast-in {
                    from { opacity: 0; transform: translateY(12px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0)      scale(1);    }
                }
            `}</style>

            <div
                style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "24px",
                    display: "flex",
                    flexDirection: "column-reverse",
                    gap: "10px",
                    zIndex: 9999,
                    pointerEvents: "none", // let clicks pass through container, children opt-in
                }}
            >
                {toasts.map((t) => (
                    <Toast key={t.id} toast={t} />
                ))}
            </div>
        </>
    )
}
