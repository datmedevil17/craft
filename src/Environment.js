import React, { useMemo } from 'react'
import { EnvironmentElement } from './EnvironmentElement'
import { Mountain } from './Mountain'
import { River } from './River'
import { useCubeStore } from './useStore'

const REALM_ASSETS = {
    Jungle: [
        'Tree_1', 'Tree_2', 'Tree_3',
        'Bamboo', 'Bamboo_Mid', 'Bamboo_Small',
        'Plant_2', 'Plant_3', 'Bush',
        'Flowers_1', 'Flowers_2',
        'Grass_Big', 'Grass_Small'
    ],
    Desert: [
        'DeadTree_1', 'DeadTree_2', 'DeadTree_3',
        'Rock1', 'Rock2'
    ],
    Snow: [
        'Crystal_Big', 'Crystal_Small',
        'Rock1', 'Rock2'
    ]
}

export const Environment = () => {
    const { realm, isInRiver } = useCubeStore()

    const { items, mountains } = useMemo(() => {
        const assets = REALM_ASSETS[realm] || REALM_ASSETS.Jungle
        const count = realm === 'Jungle' ? 2000 : 800 // High density for Jungle
        const items = []
        const localMountains = []
        const range = 300 // Expanded range
        const minDistance = realm === 'Jungle' ? 3 : 6 // Jungle is denser
        const safeRadius = 25 // Wider safe zone
        const riverWidth = 10 // Wide enough to be visible

        // Generate Mountains at edges for Desert/Snow
        if (realm === 'Desert' || realm === 'Snow') {
            for (let i = 0; i < 15; i++) {
                const angle = (i / 15) * Math.PI * 2
                const dist = 120 + Math.random() * 80
                localMountains.push({
                    id: i,
                    type: Math.random() > 0.5 ? 'Rock1' : 'Rock2',
                    position: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
                    scale: 2 + Math.random() * 3,
                    rotation: [0, Math.random() * Math.PI, 0]
                })
            }
        }

        // Generate random elements
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * range
            const z = (Math.random() - 0.5) * range

            // Don't spawn in center safe zone
            const distFromCenter = Math.sqrt(x * x + z * z)
            if (distFromCenter < safeRadius) continue

            // Don't spawn in the river
            if (isInRiver(x, z)) continue

            let tooClose = false
            for (const item of items) {
                const dx = item.position[0] - x
                const dz = item.position[2] - z
                const distSq = dx * dx + dz * dz
                if (distSq < minDistance * minDistance) {
                    tooClose = true
                    break
                }
            }

            if (!tooClose) {
                const type = assets[Math.floor(Math.random() * assets.length)]
                let scale = 0.8 + Math.random() * 0.7

                // Increase crystal size in snow
                if (realm === 'Snow' && type.includes('Crystal')) {
                    scale *= 3.5 // Make them significantly larger and more "ancient"
                }

                items.push({
                    id: i,
                    type,
                    position: [x, 0, z],
                    rotation: [0, Math.random() * Math.PI * 2, 0],
                    scale
                })
            }
        }
        return { items, mountains: localMountains }
    }, [realm])

    return (
        <group>
            {realm === 'Jungle' && <River width={15} />}
            {items.map((el) => (
                <EnvironmentElement
                    key={`item-${realm}-${el.id}`}
                    type={el.type}
                    position={el.position}
                    rotation={el.rotation}
                    scale={el.scale}
                />
            ))}
            {mountains.map((mtn) => (
                <Mountain
                    key={`mtn-${realm}-${mtn.id}`}
                    type={mtn.type}
                    position={mtn.position}
                    rotation={mtn.rotation}
                    scale={mtn.scale}
                />
            ))}
        </group>
    )
}
