import React from "react"
import { useCubeStore, REALM_CONFIG } from "./useStore"
import { inventoryFlags } from "./inventoryFlags"
import { WalletMultiButton, useWalletModal } from "@solana/wallet-adapter-react-ui"
import { useWallet } from "@solana/wallet-adapter-react"
import { useMinecraftProgram, KILL_REWARDS } from "./hooks/use-minecraft-program"
import { getNPCResponse } from "./aiService"
import { ENTITY_MINTS } from "./MintConfig"
import { useSocket } from "./SocketContext"

// Visual display map for every block and tool
const ITEM_DISPLAY = {
    Block_Grass: { color: '#5a8a3c', emoji: '🟩' },
    Block_Dirt: { color: '#8B5E3C', emoji: '🟫' },
    Block_Stone: { color: '#808080', emoji: '🪨' },
    Block_WoodPlanks: { color: '#c8a96e', emoji: '🟨' },
    Block_Brick: { color: '#8B3A2F', emoji: '🧱' },
    Block_Crate: { color: '#b5892c', emoji: '📦' },
    Block_Cheese: { color: '#f5c518', emoji: '🧀' },
    Block_Blank: { color: '#cfcfcf', emoji: '⬜' },
    Block_GreyBricks: { color: '#6b6b6b', emoji: '🪨' },
    Block_Coal: { color: '#2a2a2a', emoji: '⬛' },
    Block_Metal: { color: '#aab4c4', emoji: '🩶' },
    Block_Snow: { color: '#e8f4ff', emoji: '❄️' },
    Block_Ice: { color: '#a8d8ea', emoji: '🧊' },
    Block_Crystal: { color: '#9b59b6', emoji: '💎' },
    Block_Diamond: { color: '#00bcd4', emoji: '💠' },
    Axe_Wood: { color: '#8B5E3C', emoji: '🪓' },
    Axe_Stone: { color: '#808080', emoji: '🪓' },
    Axe_Gold: { color: '#FFD700', emoji: '🪓' },
    Axe_Diamond: { color: '#00bcd4', emoji: '🪓' },
    Pickaxe_Wood: { color: '#8B5E3C', emoji: '⛏️' },
    Pickaxe_Stone: { color: '#808080', emoji: '⛏️' },
    Pickaxe_Gold: { color: '#FFD700', emoji: '⛏️' },
    Pickaxe_Diamond: { color: '#00bcd4', emoji: '⛏️' },
    Shovel_Wood: { color: '#8B5E3C', emoji: '🪏' },
    Shovel_Stone: { color: '#808080', emoji: '🪏' },
    Shovel_Gold: { color: '#FFD700', emoji: '🪏' },
    Shovel_Diamond: { color: '#00bcd4', emoji: '🪏' },
    Sword_Wood: { color: '#8B5E3C', emoji: '🗡️' },
    Sword_Stone: { color: '#808080', emoji: '🗡️' },
    Sword_Gold: { color: '#FFD700', emoji: '🗡️' },
    Sword_Diamond: { color: '#00bcd4', emoji: '🗡️' },
}

function ItemSlotContent({ item }) {
    if (!item) return null
    const display = ITEM_DISPLAY[item] || { color: '#555', emoji: '❓' }
    const label = item.replace('Block_', '').replace(/_/g, ' ')
    return (
        <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: `${display.color}44`, borderRadius: '2px',
            pointerEvents: 'none'
        }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{display.emoji}</span>
            <span style={{ fontSize: '7px', color: '#fff', textShadow: '1px 1px 0 #000', marginTop: '2px', textAlign: 'center', lineHeight: 1, wordBreak: 'break-word', padding: '0 2px' }}>
                {label}
            </span>
        </div>
    )
}

// ─── Online Players Count ─────────────────────────────────────────────────────
function OnlinePlayersCount() {
    const { players } = useSocket()
    const count = Object.keys(players).length

    return (
        <div style={{ fontSize: '12px', color: '#7ec87e', marginTop: '4px' }}>
            👥 {count} player{count !== 1 ? 's' : ''} online
        </div>
    )
}

// ─── Boss HP Bar ──────────────────────────────────────────────────────────────
function BossHpBar() {
    const { bossState } = useSocket()
    if (!bossState || !bossState.alive) return null

    const hpPct = Math.max(0, (bossState.hp / bossState.maxHp) * 100)
    const barColor = hpPct > 50
        ? 'linear-gradient(90deg, #ff3333, #cc0000)'
        : hpPct > 25
            ? 'linear-gradient(90deg, #ff8800, #cc5500)'
            : 'linear-gradient(90deg, #ff0000, #880000)'

    return (
        <div style={{
            position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
            zIndex: 2000, pointerEvents: 'none', textAlign: 'center',
            fontFamily: "'Press Start 2P', monospace"
        }}>
            <div style={{
                color: '#ff4444', fontSize: '12px', fontWeight: 'bold',
                textShadow: '2px 2px 4px #000', marginBottom: '4px'
            }}>
                ⚔️ {bossState.type.toUpperCase()} ⚔️
            </div>
            <div style={{
                width: '300px', height: '18px',
                background: 'rgba(0,0,0,0.7)', borderRadius: '9px',
                border: '2px solid #ff4444', overflow: 'hidden', position: 'relative'
            }}>
                <div style={{
                    width: `${hpPct}%`, height: '100%', background: barColor,
                    transition: 'width 0.3s ease', borderRadius: '7px'
                }} />
                <div style={{
                    position: 'absolute', width: '100%', textAlign: 'center', top: 2,
                    fontSize: '9px', color: '#fff', fontWeight: 'bold', textShadow: '1px 1px 2px #000'
                }}>
                    {bossState.hp} / {bossState.maxHp}
                </div>
            </div>
        </div>
    )
}

// ─── Chat Overlay ─────────────────────────────────────────────────────────────
function ChatOverlay() {
    const { chatMessages, sendChat, sendWhisper, players } = useSocket()
    const { publicKey } = useWallet()
    const [chatInput, setChatInput] = React.useState('')
    const [chatFocused, setChatFocused] = React.useState(false)
    const chatListRef = React.useRef(null)
    const inputRef = React.useRef(null)
    const myWallet = publicKey?.toBase58()

    // Auto-scroll
    React.useEffect(() => {
        if (chatListRef.current) {
            chatListRef.current.scrollTop = chatListRef.current.scrollHeight
        }
    }, [chatMessages])

    // Enter to focus chat
    React.useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Enter' && !chatFocused && document.pointerLockElement) {
                e.preventDefault()
                setChatFocused(true)
                // Release pointer lock for typing
                document.exitPointerLock()
                setTimeout(() => inputRef.current?.focus(), 50)
            }
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [chatFocused])

    const handleSend = () => {
        if (!chatInput.trim()) { setChatFocused(false); return }

        // Whisper: /w <username> <message>
        const whisperMatch = chatInput.match(/^\/w\s+(\S+)\s+(.+)/)
        if (whisperMatch) {
            const targetName = whisperMatch[1]
            const msg = whisperMatch[2]
            // Find target wallet by username
            const target = Object.values(players).find(p =>
                p.username === targetName || p.walletAddress?.startsWith(targetName)
            )
            if (target) {
                sendWhisper(target.walletAddress, msg)
            }
        } else {
            sendChat(chatInput)
        }
        setChatInput('')
        setChatFocused(false)
    }

    // Show last 15 messages (or fewer)
    const visibleMessages = chatMessages.slice(-15)

    return (
        <div style={{
            position: 'fixed', bottom: 90, left: 10, width: '320px',
            zIndex: 1500, fontFamily: "'VT323', monospace", pointerEvents: chatFocused ? 'auto' : 'none'
        }}>
            {/* Message list */}
            <div
                ref={chatListRef}
                style={{
                    maxHeight: '180px', overflowY: 'auto', overflowX: 'hidden',
                    background: chatFocused ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)',
                    borderRadius: '6px 6px 0 0', padding: '6px',
                    transition: 'background 0.2s ease'
                }}
            >
                {visibleMessages.map((msg, i) => (
                    <div key={i} style={{
                        fontSize: '13px', lineHeight: '1.3', marginBottom: '2px', wordBreak: 'break-word',
                        color: msg.system ? '#ffcc00' : msg.whisper ? '#c792ea' : '#fff',
                        fontStyle: msg.whisper ? 'italic' : 'normal',
                        opacity: chatFocused ? 1 : 0.8,
                        textShadow: '1px 1px 2px #000'
                    }}>
                        {msg.whisper && <span style={{ color: '#9c6bc4' }}>[Whisper] </span>}
                        <span style={{
                            color: msg.system ? '#ffcc00' : msg.senderWallet === myWallet ? '#82aaff' : '#c3e88d',
                            fontWeight: 'bold'
                        }}>
                            {msg.sender}:
                        </span>{' '}
                        {msg.text}
                    </div>
                ))}
            </div>

            {/* Input */}
            {chatFocused && (
                <div style={{ display: 'flex', gap: '0' }}>
                    <input
                        ref={inputRef}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSend()
                            if (e.key === 'Escape') { setChatFocused(false); setChatInput('') }
                            e.stopPropagation() // Don't let game handle these keys
                        }}
                        placeholder="Type message... (/w name msg)"
                        style={{
                            flex: 1, background: 'rgba(0,0,0,0.8)', color: '#fff',
                            border: '1px solid #555', borderRight: 'none',
                            padding: '6px 8px', fontSize: '13px', outline: 'none',
                            borderRadius: '0 0 0 6px', fontFamily: "'VT323', monospace"
                        }}
                    />
                    <button
                        onClick={handleSend}
                        style={{
                            background: '#4a90e2', color: '#fff', border: 'none',
                            padding: '6px 12px', fontSize: '13px', cursor: 'pointer',
                            borderRadius: '0 0 6px 0', fontFamily: "'VT323', monospace"
                        }}
                    >Send</button>
                </div>
            )}

            {!chatFocused && (
                <div style={{
                    fontSize: '11px', color: '#888', padding: '2px 6px',
                    background: 'rgba(0,0,0,0.3)', borderRadius: '0 0 6px 6px',
                    textAlign: 'center', pointerEvents: 'none'
                }}>
                    Press Enter to chat
                </div>
            )}
        </div>
    )
}


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
        isInventoryOpen, setInventoryOpen,
        isMenuOpen, setMenuOpen,
        cameraMode, setCameraMode,
        hotbarSlots, setHotbarSlot,
        selectedHotbarIndex, setSelectedHotbarIndex,
        inventorySlots, setInventorySlot,
        dragSource, setDragSource,
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

    // Onboarding flow state
    const isProfileReady = !!profile
    const isSessionReady = !!sessionToken
    const isDelegated = delegationStatus === "delegated"

    const [userInput, setUserInput] = React.useState("")
    const [hoveredItem, setHoveredItem] = React.useState(null) // for tooltip
    const { addToast } = useCubeStore()

    // Auto-transition and feedback logic
    React.useEffect(() => {
        if (!connected || gameStarted) return

        if (isProfileReady && !isSessionReady) {
            // Check if we just connected and profile was already there
            const hasToastedProfile = sessionStorage.getItem("hasToastedProfile")
            if (!hasToastedProfile) {
                addToast("Profile already initialized")
                sessionStorage.setItem("hasToastedProfile", "true")
            }
        }

        if (isSessionReady) {
            const hasLoggedSession = sessionStorage.getItem("hasLoggedSession")
            if (!hasLoggedSession) {
                console.log("session key present")
                sessionStorage.setItem("hasLoggedSession", "true")
            }
        }
    }, [connected, isProfileReady, isSessionReady, gameStarted, addToast])

    const handleSend = async () => {
        if (!userInput.trim()) return
        setDialogueLoading(true)
        const response = await getNPCResponse(userInput, dialogue.npcType)
        setNPCResponse(response)
        setUserInput("")
    }

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

    // Smart dispatch: set the active block OR tool based on item type
    const applyHotbarItem = (item) => {
        if (!item) return;
        if (item.startsWith('Block_')) setBlock(item);
        else setTool(item);
    };

    // Inventory Toggle and Hotbar Selection
    React.useEffect(() => {
        if (!gameStarted || isGameOver) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isInventoryOpen) {
                    inventoryFlags.suppressNextMenuOpen = true;
                    setInventoryOpen(false);
                    return;
                }
                if (isMenuOpen) {
                    inventoryFlags.suppressNextMenuOpen = true;
                    setMenuOpen(false);
                    return;
                }
                // In-game Esc: open Game Menu directly and suppress the
                // pointerlockchange event that will fire when browser releases lock
                inventoryFlags.suppressNextMenuOpen = true;
                setMenuOpen(true);
                return;
            }

            // 'E' to toggle inventory
            if (e.key.toLowerCase() === 'e' && !dialogue.isOpen && !isMenuOpen) {
                if (isInventoryOpen) {
                    inventoryFlags.suppressNextMenuOpen = true;
                    setInventoryOpen(false);
                    // User must click canvas to re-lock — drei handles it
                } else {
                    // Opening: free the cursor WITHOUT triggering Game Menu
                    inventoryFlags.suppressNextMenuOpen = true;
                    setInventoryOpen(true);
                    document.exitPointerLock();
                }
            }

            // F5: cycle camera mode like Minecraft (prevent browser refresh)
            if (e.key === 'F5') {
                e.preventDefault();
                const cur = useCubeStore.getState().cameraMode;
                setCameraMode(cur === 'first' ? 'third_back' : 'first');
                return;
            }

            // Number keys 1-9 to select hotbar slot
            if (!dialogue.isOpen && !isMenuOpen && e.key >= '1' && e.key <= '9') {
                const idx = parseInt(e.key) - 1;
                setSelectedHotbarIndex(idx);
                const item = useCubeStore.getState().hotbarSlots[idx];
                if (item) applyHotbarItem(item);
            }
        };

        const handleWheel = (e) => {
            if (dialogue.isOpen || isInventoryOpen || isMenuOpen) return;
            const slots = useCubeStore.getState().hotbarSlots;
            const cur = useCubeStore.getState().selectedHotbarIndex;
            let next = cur + Math.sign(e.deltaY);
            if (next < 0) next = 8;
            if (next > 8) next = 0;
            setSelectedHotbarIndex(next);
            if (slots[next]) applyHotbarItem(slots[next]);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('wheel', handleWheel);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('wheel', handleWheel);
        }
    }, [gameStarted, isGameOver, dialogue.isOpen, isInventoryOpen, setInventoryOpen, isMenuOpen, setMenuOpen, blocks, selectedHotbarIndex, setSelectedHotbarIndex]);

    // Helper: handle drop on a hotbar slot
    const handleDropOnHotbar = (hotbarIndex) => {
        const src = useCubeStore.getState().dragSource;
        if (!src) return;
        const { type, index } = src;
        const displaced = useCubeStore.getState().hotbarSlots[hotbarIndex]; // what's currently in the target hotbar slot

        if (type === 'inventory') {
            const item = useCubeStore.getState().inventorySlots[index];
            // Place item in hotbar slot
            setHotbarSlot(hotbarIndex, item);
            // Swap displaced hotbar item back to inventory slot
            setInventorySlot(index, displaced);
        } else if (type === 'hotbar') {
            const item = useCubeStore.getState().hotbarSlots[index];
            // Swap hotbar slots
            setHotbarSlot(hotbarIndex, item);
            setHotbarSlot(index, displaced);
        }

        setDragSource(null);
        const selectedIdx = useCubeStore.getState().selectedHotbarIndex;
        const finalItem = useCubeStore.getState().hotbarSlots[hotbarIndex];
        if (selectedIdx === hotbarIndex && finalItem) applyHotbarItem(finalItem);
    };

    // Helper: handle drop on an inventory slot
    const handleDropOnInventory = (inventoryIndex) => {
        const src = useCubeStore.getState().dragSource;
        if (!src) return;
        const { type, index } = src;
        if (type === 'hotbar') {
            const item = useCubeStore.getState().hotbarSlots[index];
            const displaced = useCubeStore.getState().inventorySlots[inventoryIndex];
            setInventorySlot(inventoryIndex, item);
            setHotbarSlot(index, displaced);
        } else if (type === 'inventory') {
            const item = useCubeStore.getState().inventorySlots[index];
            const displaced = useCubeStore.getState().inventorySlots[inventoryIndex];
            setInventorySlot(inventoryIndex, item);
            setInventorySlot(index, displaced);
        }
        setDragSource(null);
    };

    // Helper: click inventory item → SWAP with selected hotbar slot (or shift+click → first empty hotbar slot)
    const handleInventoryItemClick = (e, inventoryIndex) => {
        const item = useCubeStore.getState().inventorySlots[inventoryIndex];
        if (!item) return;
        if (e.shiftKey) {
            // Move to first empty hotbar slot, clear inventory slot
            const slots = useCubeStore.getState().hotbarSlots;
            const emptyIdx = slots.findIndex(s => s === null);
            if (emptyIdx !== -1) {
                setHotbarSlot(emptyIdx, item);
                setInventorySlot(inventoryIndex, null);
                applyHotbarItem(item);
            }
        } else {
            // Swap with currently selected hotbar slot
            const idx = useCubeStore.getState().selectedHotbarIndex;
            const displaced = useCubeStore.getState().hotbarSlots[idx]; // what was in hotbar
            setHotbarSlot(idx, item);
            setInventorySlot(inventoryIndex, displaced);
            applyHotbarItem(item);
        }
    };

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

        if (isDelegated) {
            return (
                <div style={{
                    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", color: "white", fontFamily: "'Press Start 2P', cursive",
                    zIndex: 2000, pointerEvents: "auto"
                }}>
                    {/* Background Logo with Light Black Overlay */}
                    <div style={{
                        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                        backgroundImage: "url(/mainLogio.png)", backgroundSize: "cover",
                        backgroundPosition: "center", zIndex: -2
                    }} />
                    <div style={{
                        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                        background: "rgba(0, 0, 0, 0.6)", zIndex: -1
                    }} />

                    <div style={{ position: "absolute", top: 20, right: 20, zIndex: 10000 }}>
                        <WalletMultiButton />
                    </div>


                    <p style={{ marginBottom: "30px", fontSize: "14px", letterSpacing: "2px" }}>
                        SELECT YOUR REALM
                    </p>

                    <div style={{ display: "flex", gap: "30px" }}>
                        {Object.keys(REALM_CONFIG).map((r) => {
                            const config = REALM_CONFIG[r]
                            return (
                                <div
                                    key={r} onClick={() => {
                                        blockchainActions.enterGame(r)
                                        startGame(r)
                                    }}
                                    style={{
                                        width: "200px", height: "280px", background: "rgba(255,255,255,0.05)",
                                        backdropFilter: "blur(10px)",
                                        borderRadius: "15px", border: "1px solid rgba(255,255,255,0.2)",
                                        cursor: "pointer", display: "flex", flexDirection: "column",
                                        alignItems: "center", justifyContent: "flex-end",
                                        transition: "all 0.3s", position: "relative", overflow: "hidden",
                                        padding: "20px", boxSizing: "border-box"
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.border = "1px solid #fff"; e.currentTarget.style.transform = "translateY(-10px)" }}
                                    onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "translateY(0)" }}
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

        return (
            <div style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", color: "white", fontFamily: "'Press Start 2P', cursive",
                zIndex: 2000, pointerEvents: "auto"
            }}>
                {/* Background Logo with Light Black Overlay */}
                <div style={{
                    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                    backgroundImage: "url(/mainLogio.png)", backgroundSize: "cover",
                    backgroundPosition: "center", zIndex: -2
                }} />
                <div style={{
                    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                    background: "rgba(0, 0, 0, 0.6)", zIndex: -1
                }} />

                <div style={{ position: "absolute", top: 20, right: 20, zIndex: 10000 }}>
                    <WalletMultiButton />
                </div>


                <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "24px",
                    padding: "40px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "20px",
                    width: "400px"
                }}>
                    {!connected && (
                        <button
                            onClick={() => setVisible(true)}
                            style={{
                                width: "100%", padding: "18px", background: "#4a90e2",
                                color: "white", border: "none", borderRadius: "12px",
                                fontSize: "14px", cursor: "pointer", transition: "all 0.2s",
                                fontFamily: "'Press Start 2P', cursive"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                            CONNECT WALLET
                        </button>
                    )}

                    {connected && !isProfileReady && (
                        <button
                            disabled={isLoading}
                            onClick={initializeProfile}
                            style={{
                                width: "100%", padding: "18px", background: "#55FF55",
                                color: "black", border: "none", borderRadius: "12px",
                                fontSize: "14px", cursor: "pointer", transition: "all 0.2s",
                                fontFamily: "'Press Start 2P', cursive"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                            {isLoading ? "INITIALIZING..." : "INIT PROFILE"}
                        </button>
                    )}

                    {connected && isProfileReady && !isSessionReady && (
                        <button
                            disabled={isSessionLoading}
                            onClick={createSession}
                            style={{
                                width: "100%", padding: "18px", background: "#FFB000",
                                color: "black", border: "none", borderRadius: "12px",
                                fontSize: "14px", cursor: "pointer", transition: "all 0.2s",
                                fontFamily: "'Press Start 2P', cursive"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                            {isSessionLoading ? "CREATING..." : "INIT SESSION"}
                        </button>
                    )}

                    {connected && isProfileReady && isSessionReady && (
                        <button
                            disabled={isLoading}
                            onClick={delegateSession}
                            style={{
                                width: "100%", padding: "24px", background: "#55FF55",
                                color: "black", border: "none", borderRadius: "12px",
                                fontSize: "18px", cursor: "pointer", transition: "all 0.2s",
                                fontFamily: "'Press Start 2P', cursive", fontWeight: "bold",
                                boxShadow: "0 0 20px rgba(85,255,85,0.4)"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                            {isLoading ? "DELEGATING..." : "ENTER"}
                        </button>
                    )}
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
            {/* EX-HUD: Wallet, End Game, In-Game Header have been moved to Game Menu */}

            {/* GAME MENU OVERLAY (Triggered by Esc) */}
            {isMenuOpen && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    background: "rgba(0,0,0,0.75)", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", zIndex: 4000, pointerEvents: "auto",
                    fontFamily: "'Press Start 2P', cursive"
                }}>
                    <h2 style={{ color: "white", fontSize: "32px", marginBottom: "40px", textShadow: "4px 4px 0 #000" }}>Game Menu</h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "400px" }}>
                        <button
                            onClick={() => setMenuOpen(false)}
                            style={{
                                background: "#a0a0a0", border: "4px solid #fff", borderRightColor: "#555", borderBottomColor: "#555",
                                padding: "15px", fontSize: "16px", color: "black", fontWeight: "bold", cursor: "pointer", fontFamily: "'Press Start 2P', cursive"
                            }}
                        >
                            Back to Game
                        </button>

                        <button
                            onClick={() => setShowStatsModal(true)}
                            style={{
                                background: "#a0a0a0", border: "4px solid #fff", borderRightColor: "#555", borderBottomColor: "#555",
                                padding: "15px", fontSize: "16px", color: "black", fontWeight: "bold", cursor: "pointer", fontFamily: "'Press Start 2P', cursive"
                            }}
                        >
                            Profile Stats
                        </button>

                        <div style={{ alignSelf: "center", marginTop: "10px", marginBottom: "10px" }}>
                            <WalletMultiButton />
                        </div>

                        <button
                            onClick={async () => {
                                setMenuOpen(false)
                                try {
                                    await endGame()
                                    endGameState()
                                } catch (err) {
                                    console.error("Failed to end game on-chain:", err)
                                    endGameState()
                                }
                            }}
                            style={{
                                background: "#c24444", border: "4px solid #ff7a7a", borderRightColor: "#7a2a2a", borderBottomColor: "#7a2a2a",
                                padding: "15px", fontSize: "16px", color: "white", fontWeight: "bold", cursor: "pointer", fontFamily: "'Press Start 2P', cursive",
                                marginTop: "20px"
                            }}
                        >
                            Save and Quit to Title
                        </button>
                    </div>
                </div>
            )}

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
                {/* HEARTS ROW — Minecraft style */}
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', maxWidth: '220px' }}>
                    {Array.from({ length: 15 }, (_, i) => {
                        const heartHp = (i + 1) * 2;
                        const isFull = playerHealth >= heartHp;
                        const isHalf = !isFull && playerHealth >= heartHp - 1;
                        return (
                            <span key={i} style={{ fontSize: '18px', lineHeight: 1, filter: isFull ? 'none' : isHalf ? 'saturate(0.5)' : 'grayscale(1) opacity(0.3)', transition: 'filter 0.3s ease' }}>
                                {isFull ? '❤️' : isHalf ? '💔' : '🖤'}
                            </span>
                        );
                    })}
                </div>

                <div style={{ background: "rgba(0,0,0,0.7)", padding: "10px", borderRadius: "8px", border: `2px solid ${REALM_CONFIG[realm].groundColor}`, color: "white" }}>
                    <div style={{ marginBottom: "5px", fontSize: "14px", fontWeight: "bold", color: "#4a90e2" }}>REALM: {realm.toUpperCase()}</div>
                    <OnlinePlayersCount />
                </div>

                {/* BOSS HP BAR (top center) */}
                <BossHpBar />

                {/* CHAT OVERLAY */}
                <ChatOverlay />

                {/* CROSSHAIR */}
                {!isInventoryOpen && !isMenuOpen && !dialogue.isOpen && (
                    <div style={{
                        position: "fixed", top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)", zIndex: 500,
                        pointerEvents: "none"
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <line x1="12" y1="2" x2="12" y2="22" stroke="white" strokeWidth="2" opacity="0.85" />
                            <line x1="2" y1="12" x2="22" y2="12" stroke="white" strokeWidth="2" opacity="0.85" />
                        </svg>
                    </div>
                )}

                {/* SELECTED ITEM NAME LABEL above hotbar */}
                {!isInventoryOpen && !isMenuOpen && hotbarSlots[selectedHotbarIndex] && (
                    <div style={{
                        position: "fixed", bottom: "82px", left: "50%",
                        transform: "translateX(-50%)",
                        background: "rgba(0,0,0,0.6)", color: "white",
                        padding: "3px 10px", borderRadius: "4px",
                        fontSize: "13px", fontFamily: "'VT323', monospace",
                        pointerEvents: "none", zIndex: 1001, letterSpacing: "1px",
                        textShadow: "1px 1px 0 #000"
                    }}>
                        {hotbarSlots[selectedHotbarIndex].replace('Block_', '').replace(/_/g, ' ')}
                    </div>
                )}

                {/* 9-SLOT HOTBAR */}
                <div style={{ position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "4px", pointerEvents: "auto", zIndex: 1000 }}>
                    {hotbarSlots.map((item, index) => {
                        const isSelected = selectedHotbarIndex === index;
                        return (
                            <div
                                key={index}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDropOnHotbar(index)}
                                onClick={() => {
                                    setSelectedHotbarIndex(index);
                                    if (item) applyHotbarItem(item);
                                }}
                                style={{
                                    width: "52px", height: "52px",
                                    background: isSelected ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.65)",
                                    border: isSelected ? "3px solid white" : "2px solid #666",
                                    borderRadius: "4px", display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "center", cursor: "pointer",
                                    position: "relative", boxShadow: isSelected ? "0 0 12px rgba(255,255,255,0.8)" : "none"
                                }}
                            >
                                <span style={{ fontSize: "10px", color: "#aaa", position: "absolute", top: 2, left: 4, zIndex: 1 }}>{index + 1}</span>
                                {item && (
                                    <div
                                        draggable
                                        onDragStart={() => setDragSource({ type: 'hotbar', index })}
                                        style={{ width: '100%', height: '100%', cursor: 'grab' }}
                                    >
                                        <ItemSlotContent item={item} />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* INVENTORY OVERLAY */}
                {isInventoryOpen && (
                    <div
                        style={{
                            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                            background: "rgba(0, 0, 0, 0.7)", display: "flex", justifyContent: "center",
                            alignItems: "center", zIndex: 2000, pointerEvents: "auto", fontFamily: "'VT323', monospace"
                        }}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <div style={{
                            background: "#c6c6c6", border: "4px solid #fff", borderRightColor: "#555",
                            borderBottomColor: "#555", padding: "20px", width: "640px", maxWidth: "96vw",
                            boxShadow: "0 0 30px rgba(0,0,0,0.9)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                <h2 style={{ margin: 0, color: "#373737", fontWeight: "bold", fontSize: "22px" }}>Inventory</h2>
                                <button onClick={() => setInventoryOpen(false)} style={{ background: "transparent", border: "none", color: "#373737", fontSize: "22px", cursor: "pointer", fontWeight: "bold" }}>✕</button>
                            </div>

                            {/* 26-slot Grid */}
                            <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#555", fontFamily: "sans-serif" }}>
                                Click to place in hotbar slot · Shift+click → first empty slot · Drag to rearrange
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "4px", marginBottom: "12px", position: "relative" }}>
                                {inventorySlots.map((item, index) => (
                                    <div
                                        key={index}
                                        title={item ? item.replace('Block_', '').replace(/_/g, ' ') : ''}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => handleDropOnInventory(index)}
                                        onMouseEnter={() => item && setHoveredItem(item)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        onClick={(e) => handleInventoryItemClick(e, index)}
                                        style={{
                                            width: "52px", height: "52px", background: "#8b8b8b",
                                            border: "2px inset #555", display: "flex", alignItems: "center",
                                            justifyContent: "center", position: "relative", borderRadius: "2px",
                                            cursor: item ? "pointer" : "default"
                                        }}
                                    >
                                        {item && (
                                            <div
                                                draggable
                                                onDragStart={(e) => { e.stopPropagation(); setDragSource({ type: 'inventory', index }); }}
                                                style={{ width: '100%', height: '100%', cursor: 'grab' }}
                                            >
                                                <ItemSlotContent item={item} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Hotbar row inside inventory */}
                            <div style={{ borderTop: "2px solid #555", paddingTop: "10px" }}>
                                <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#333" }}>Hotbar (drag items here)</p>
                                <div style={{ display: "flex", gap: "4px" }}>
                                    {hotbarSlots.map((item, index) => {
                                        const isSelected = selectedHotbarIndex === index;
                                        return (
                                            <div
                                                key={index}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={() => handleDropOnHotbar(index)}
                                                onClick={() => { setSelectedHotbarIndex(index); if (item) applyHotbarItem(item); }}
                                                style={{
                                                    width: "52px", height: "52px",
                                                    background: isSelected ? "rgba(100,180,255,0.4)" : "#8b8b8b",
                                                    border: isSelected ? "3px solid #4a90e2" : "2px inset #555",
                                                    borderRadius: "2px", display: "flex", flexDirection: "column",
                                                    alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative"
                                                }}
                                            >
                                                <span style={{ fontSize: "9px", color: "#aaa", position: "absolute", top: 1, left: 3 }}>{index + 1}</span>
                                                {item && (
                                                    <div
                                                        draggable
                                                        onDragStart={() => setDragSource({ type: 'hotbar', index })}
                                                        style={{ textAlign: "center", cursor: "grab", padding: "2px" }}
                                                    >
                                                        <span style={{ fontSize: "9px", color: "white", textShadow: "1px 1px 0 #000", lineHeight: "1.1" }}>
                                                            {item.replace('Block_', '').replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
