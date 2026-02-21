import React from 'react'
import { useSocket } from './SocketContext'
import OtherPlayer from './OtherPlayer'
import { useWallet } from '@solana/wallet-adapter-react'

export const OtherPlayers = () => {
    const { players } = useSocket()
    const { publicKey } = useWallet()
    const myWallet = publicKey?.toBase58()

    return (
        <group>
            {Object.values(players).map((player) => {
                // Don't render self
                if (player.walletAddress === myWallet) return null

                return (
                    <OtherPlayer
                        key={player.walletAddress}
                        type={player.model}
                        position={player.position}
                        rotation={player.rotation}
                        walletAddress={player.walletAddress}
                    />
                )
            })}
        </group>
    )
}
