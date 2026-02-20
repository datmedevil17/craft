import React from 'react'
import Enemy from './Enemy'
import { useCubeStore } from './useStore'

export const Enemies = () => {
    const { enemies, isInRiver } = useCubeStore()

    // Spawn a fixed number of enemies for the realm
    const enemyInstances = React.useMemo(() => {
        if (!enemies || enemies.length === 0) return []

        const instances = []
        for (let i = 0; i < 40; i++) {
            const type = enemies[i % enemies.length]
            let pos
            let attempts = 0
            while (attempts < 10) {
                const potentialPos = [
                    (Math.random() - 0.5) * 120,
                    5,
                    (Math.random() - 0.5) * 120
                ]
                const distFromSpawn = Math.sqrt(potentialPos[0] ** 2 + potentialPos[2] ** 2)
                const inRiver = isInRiver(potentialPos[0], potentialPos[2])

                if (distFromSpawn > 20 && !inRiver) {
                    pos = potentialPos
                    break
                }
                attempts++
            }
            if (!pos) pos = [40, 5, 40] // Fallback

            // Scale giants and yetis less frequently
            if ((type === 'Giant' || type === 'Yeti') && i % 3 !== 0) {
                // skip to keep them sparse
            } else {
                instances.push({ id: `enemy-${i}`, type, pos })
            }
        }
        return instances
    }, [enemies])

    return (
        <group>
            {enemyInstances.map((enemy) => (
                <Enemy key={enemy.id} type={enemy.type} position={enemy.pos} />
            ))}
        </group>
    )
}
