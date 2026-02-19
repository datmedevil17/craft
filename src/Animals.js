import React from 'react'
import Animal from './Animal'

const ANIMAL_TYPES = ['Cat', 'Dog', 'Sheep', 'Pig', 'Chick', 'Chicken', 'Horse', 'Wolf', 'Raccoon']

export const Animals = () => {
    const animals = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        type: ANIMAL_TYPES[Math.floor(Math.random() * ANIMAL_TYPES.length)],
        position: [(Math.random() - 0.5) * 50, 0.5, (Math.random() - 0.5) * 50]
    }))

    return (
        <group>
            {animals.map((animal) => (
                <Animal key={animal.id} type={animal.type} position={animal.position} />
            ))}
        </group>
    )
}
