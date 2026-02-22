import React, { useRef } from 'react'
import { Animal } from './Animal'
import { useCubeStore } from './useStore'

export const Animals = () => {
    const { animals: realmAnimals, isInRiver } = useCubeStore()
    const animalPositions = useRef({}) // { id: Vector3 }

    const spawnedAnimals = React.useMemo(() => {
        if (!realmAnimals || realmAnimals.length === 0) return []

        return Array.from({ length: 80 }, (_, i) => {
            let pos
            let attempts = 0
            while (attempts < 10) {
                const potentialPos = [(Math.random() - 0.5) * 120, 5, (Math.random() - 0.5) * 120]
                const distFromSpawn = Math.sqrt(potentialPos[0] ** 2 + potentialPos[2] ** 2)
                const inRiver = isInRiver(potentialPos[0], potentialPos[2])

                if (distFromSpawn > 20 && !inRiver) {
                    pos = potentialPos
                    break
                }
                attempts++
            }
            if (!pos) pos = [0, 5, 50] // Fallback — safe from river

            return {
                id: i,
                type: realmAnimals[Math.floor(Math.random() * realmAnimals.length)],
                position: pos
            }
        })
    }, [realmAnimals])

    return (
        <group>
            {spawnedAnimals.map((animal) => (
                <Animal
                    key={`${animal.type}-${animal.id}`}
                    id={animal.id}
                    type={animal.type}
                    position={animal.position}
                    allPositions={animalPositions}
                />
            ))}
        </group>
    )
}
