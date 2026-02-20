import React from 'react'
import NPC from './NPC'

export const NPCs = () => {
    // Spawning NPCs closer to the player's initial position (0,0,0)
    return (
        <group>
            {/* Guide NPC - very close to spawn */}
            <NPC type="Character_Male_1" position={[5, 0, 8]} rotation={[0, Math.PI, 0]} />

            {/* Additional NPCs nearby */}
            <NPC type="Character_Female_1" position={[-6, 0, 10]} rotation={[0, Math.PI / 4, 0]} />
            <NPC type="Character_Female_2" position={[8, 0, -6]} rotation={[0, -Math.PI / 4, 0]} />
        </group>
    )
}
