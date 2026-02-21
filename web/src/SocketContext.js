import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCubeStore } from './useStore';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { publicKey } = useWallet();
    const [socket, setSocket] = useState(null);
    const [players, setPlayers] = useState({});
    const realm = useCubeStore((state) => state.realm);
    const gameStarted = useCubeStore((state) => state.gameStarted);

    useEffect(() => {
        const serverUrl = process.env.REACT_APP_SOCKET_SERVER_URL || 'http://localhost:3001';
        const newSocket = io(serverUrl);
        setSocket(newSocket);

        newSocket.on('currentPlayers', (playerList) => {
            setPlayers(playerList);
        });

        newSocket.on('playerJoined', (player) => {
            setPlayers((prev) => ({ ...prev, [player.walletAddress]: player }));
        });

        newSocket.on('playerMoved', ({ walletAddress, position, rotation }) => {
            setPlayers((prev) => {
                if (!prev[walletAddress]) return prev;
                return {
                    ...prev,
                    [walletAddress]: {
                        ...prev[walletAddress],
                        position,
                        rotation,
                    },
                };
            });
        });

        newSocket.on('playerLeft', (walletAddress) => {
            setPlayers((prev) => {
                const newPlayers = { ...prev };
                delete newPlayers[walletAddress];
                return newPlayers;
            });
        });

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (socket && gameStarted && publicKey) {
            const walletAddress = publicKey.toBase58();
            // Logic for choosing a character model could follow here
            const model = 'Character_Male_1'; // Default or based on user choice
            socket.emit('joinRoom', {
                walletAddress,
                roomName: `Room ${['Jungle', 'Desert', 'Snow'].indexOf(realm) + 1}`,
                model,
            });
        }
    }, [socket, gameStarted, publicKey, realm]);

    const updatePosition = useCallback((position, rotation) => {
        if (socket && publicKey && gameStarted) {
            socket.emit('updatePosition', {
                walletAddress: publicKey.toBase58(),
                roomName: `Room ${['Jungle', 'Desert', 'Snow'].indexOf(realm) + 1}`,
                position,
                rotation,
            });
        }
    }, [socket, publicKey, gameStarted, realm]);

    return (
        <SocketContext.Provider value={{ socket, players, updatePosition }}>
            {children}
        </SocketContext.Provider>
    );
};
