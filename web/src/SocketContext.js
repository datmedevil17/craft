import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCubeStore } from './useStore';

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { publicKey } = useWallet();
    const [socket, setSocket] = useState(null);
    const [players, setPlayers] = useState({});
    const [bossState, setBossState] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const realm = useCubeStore((state) => state.realm);
    const gameStarted = useCubeStore((state) => state.gameStarted);
    const socketRef = useRef(null);

    const getRoomName = useCallback(() => {
        return `Room ${['Jungle', 'Desert', 'Snow'].indexOf(realm) + 1}`;
    }, [realm]);

    // ── Socket Connection ──────────────────────────────────────────────────
    useEffect(() => {
        const serverUrl = process.env.REACT_APP_SOCKET_SERVER_URL || 'http://localhost:3001';
        const newSocket = io(serverUrl);
        setSocket(newSocket);
        socketRef.current = newSocket;

        // ── Player Events ──────────────────────────────────────────────────
        newSocket.on('currentPlayers', (playerList) => {
            setPlayers(playerList);
        });

        newSocket.on('playerJoined', (player) => {
            setPlayers(prev => ({ ...prev, [player.walletAddress]: player }));
        });

        newSocket.on('playerMoved', ({ walletAddress, position, rotation }) => {
            setPlayers(prev => {
                if (!prev[walletAddress]) return prev;
                return {
                    ...prev,
                    [walletAddress]: { ...prev[walletAddress], position, rotation }
                };
            });
        });

        newSocket.on('playerLeft', (walletAddress) => {
            setPlayers(prev => {
                const next = { ...prev };
                delete next[walletAddress];
                return next;
            });
        });

        // ── Health Events ──────────────────────────────────────────────────
        newSocket.on('health_update', ({ walletAddress, hp, maxHp }) => {
            setPlayers(prev => {
                if (!prev[walletAddress]) return prev;
                return {
                    ...prev,
                    [walletAddress]: { ...prev[walletAddress], hp, maxHp }
                };
            });
            // Update local player health in store
            const myWallet = publicKey?.toBase58();
            if (walletAddress === myWallet) {
                useCubeStore.getState().setPlayerHealth(hp);
            }
        });

        newSocket.on('player_dead', ({ walletAddress, killedBy }) => {
            setPlayers(prev => {
                if (!prev[walletAddress]) return prev;
                return {
                    ...prev,
                    [walletAddress]: { ...prev[walletAddress], alive: false, hp: 0 }
                };
            });
            const myWallet = publicKey?.toBase58();
            if (walletAddress === myWallet) {
                useCubeStore.getState().setPlayerHealth(0);
            }
        });

        newSocket.on('player_respawn', ({ walletAddress, hp, position }) => {
            setPlayers(prev => {
                if (!prev[walletAddress]) return prev;
                return {
                    ...prev,
                    [walletAddress]: { ...prev[walletAddress], alive: true, hp, position }
                };
            });
            const myWallet = publicKey?.toBase58();
            if (walletAddress === myWallet) {
                useCubeStore.getState().setPlayerHealth(hp);
            }
        });

        newSocket.on('player_hit', ({ attacker, target, damage }) => {
            // Could add hit effects/sounds here
        });

        newSocket.on('username_update', ({ walletAddress, username }) => {
            setPlayers(prev => {
                if (!prev[walletAddress]) return prev;
                return {
                    ...prev,
                    [walletAddress]: { ...prev[walletAddress], username }
                };
            });
        });

        // ── Boss Events ────────────────────────────────────────────────────
        newSocket.on('boss_health', (state) => {
            setBossState(state);
        });

        newSocket.on('boss_attack', ({ targetWallet, damage, bossPosition }) => {
            // Visual feedback handled by Boss component
        });

        newSocket.on('boss_dead', ({ roomName, killedBy, bossType }) => {
            setBossState(prev => prev ? { ...prev, alive: false, hp: 0 } : prev);
        });

        // ── Chat Events ────────────────────────────────────────────────────
        newSocket.on('chat_history', (history) => {
            setChatMessages(history);
        });

        newSocket.on('chat_message', (msg) => {
            setChatMessages(prev => [...prev.slice(-49), msg]);
        });

        newSocket.on('whisper_message', (msg) => {
            setChatMessages(prev => [...prev.slice(-49), msg]);
        });

        // ── Block Sync Events ──────────────────────────────────────────────
        newSocket.on('current_blocks', (blocks) => {
            // Load all blocks from server into store
            const store = useCubeStore.getState();
            blocks.forEach(b => {
                store.addCube(b.pos[0], b.pos[1], b.pos[2], b.type);
            });
        });

        newSocket.on('block_placed', (block) => {
            console.log('[BLOCK SYNC] Received block_placed:', block);
            useCubeStore.getState().addCube(block.pos[0], block.pos[1], block.pos[2], block.type);
        });

        newSocket.on('block_removed', ({ position }) => {
            useCubeStore.getState().removeCube(position[0], position[1], position[2]);
        });

        // ── Player Action Sync ─────────────────────────────────────────────
        newSocket.on('player_action', ({ walletAddress, action }) => {
            setPlayers(prev => {
                if (!prev[walletAddress]) return prev;
                return {
                    ...prev,
                    [walletAddress]: { ...prev[walletAddress], currentAction: action }
                };
            });
        });

        return () => newSocket.close();
    }, [publicKey]);

    // ── Join Room ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (socket && gameStarted && publicKey) {
            const walletAddress = publicKey.toBase58();
            socket.emit('joinRoom', {
                walletAddress,
                roomName: getRoomName(),
                model: 'Character_Male_1',
                username: walletAddress.slice(0, 6)
            });
        }
    }, [socket, gameStarted, publicKey, realm, getRoomName]);

    // ── Bridge socket actions into zustand for R3F Canvas access ──────────
    useEffect(() => {
        if (!socketRef.current || !publicKey || !gameStarted) return;
        const wallet = publicKey.toBase58();
        const room = getRoomName();
        const s = socketRef.current;

        useCubeStore.getState().setSocketActions({
            placeBlock: (position, type) => {
                console.log('[BLOCK SYNC] Store bridge → place_block:', { position, type, room });
                s.emit('place_block', { walletAddress: wallet, roomName: room, position, type });
            },
            removeBlock: (position) => {
                console.log('[BLOCK SYNC] Store bridge → remove_block:', { position, room });
                s.emit('remove_block', { walletAddress: wallet, roomName: room, position });
            },
            sendAction: (action) => {
                s.emit('player_action', { walletAddress: wallet, roomName: room, action });
            },
            attackPlayer: (targetWallet) => {
                s.emit('player_attack', { attackerWallet: wallet, targetWallet, roomName: room });
            },
            attackBoss: () => {
                s.emit('attack_boss', { walletAddress: wallet, roomName: room });
            },
        });
    }, [socket, gameStarted, publicKey, realm, getRoomName]);

    // ── Emitters ───────────────────────────────────────────────────────────
    const updatePosition = useCallback((position, rotation) => {
        if (socketRef.current && publicKey && gameStarted) {
            socketRef.current.emit('updatePosition', {
                walletAddress: publicKey.toBase58(),
                roomName: getRoomName(),
                position,
                rotation
            });
        }
    }, [publicKey, gameStarted, getRoomName]);

    const attackPlayer = useCallback((targetWallet) => {
        if (socketRef.current && publicKey && gameStarted) {
            socketRef.current.emit('player_attack', {
                attackerWallet: publicKey.toBase58(),
                targetWallet,
                roomName: getRoomName()
            });
        }
    }, [publicKey, gameStarted, getRoomName]);

    const attackBoss = useCallback(() => {
        if (socketRef.current && publicKey && gameStarted) {
            socketRef.current.emit('attack_boss', {
                walletAddress: publicKey.toBase58(),
                roomName: getRoomName()
            });
        }
    }, [publicKey, gameStarted, getRoomName]);

    const sendChat = useCallback((text) => {
        if (socketRef.current && publicKey && gameStarted && text.trim()) {
            socketRef.current.emit('chat_message', {
                walletAddress: publicKey.toBase58(),
                roomName: getRoomName(),
                text: text.trim()
            });
        }
    }, [publicKey, gameStarted, getRoomName]);

    const sendWhisper = useCallback((targetWallet, text) => {
        if (socketRef.current && publicKey && gameStarted && text.trim()) {
            socketRef.current.emit('whisper_message', {
                walletAddress: publicKey.toBase58(),
                roomName: getRoomName(),
                targetWallet,
                text: text.trim()
            });
        }
    }, [publicKey, gameStarted, getRoomName]);

    const setUsername = useCallback((username) => {
        if (socketRef.current && publicKey && gameStarted) {
            socketRef.current.emit('set_username', {
                walletAddress: publicKey.toBase58(),
                roomName: getRoomName(),
                username
            });
        }
    }, [publicKey, gameStarted, getRoomName]);

    const placeBlockSync = useCallback((position, type) => {
        if (socketRef.current && publicKey && gameStarted) {
            console.log('[BLOCK SYNC] Emitting place_block:', { position, type, room: getRoomName() });
            socketRef.current.emit('place_block', {
                walletAddress: publicKey.toBase58(),
                roomName: getRoomName(),
                position,
                type
            });
        } else {
            console.warn('[BLOCK SYNC] Cannot emit - socket:', !!socketRef.current, 'pk:', !!publicKey, 'started:', gameStarted);
        }
    }, [publicKey, gameStarted, getRoomName]);

    const removeBlockSync = useCallback((position) => {
        if (socketRef.current && publicKey && gameStarted) {
            socketRef.current.emit('remove_block', {
                walletAddress: publicKey.toBase58(),
                roomName: getRoomName(),
                position
            });
        }
    }, [publicKey, gameStarted, getRoomName]);

    const sendPlayerAction = useCallback((action) => {
        if (socketRef.current && publicKey && gameStarted) {
            socketRef.current.emit('player_action', {
                walletAddress: publicKey.toBase58(),
                roomName: getRoomName(),
                action
            });
        }
    }, [publicKey, gameStarted, getRoomName]);

    return (
        <SocketContext.Provider value={{
            socket, players, bossState, chatMessages,
            updatePosition, attackPlayer, attackBoss,
            sendChat, sendWhisper, setUsername,
            placeBlockSync, removeBlockSync, sendPlayerAction
        }}>
            {children}
        </SocketContext.Provider>
    );
};
