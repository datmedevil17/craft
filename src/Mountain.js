import React from 'react'
import { EnvironmentElement } from './EnvironmentElement'

export const Mountain = ({ type, position, scale = 1, rotation = [0, 0, 0] }) => {
    // A mountain is essentially a massive rock
    // We can also cluster smaller rocks around it
    return (
        <group position={position} rotation={rotation}>
            <EnvironmentElement
                type={type}
                position={[0, 0, 0]}
                scale={scale * 5} // Base mountain
            />
            {/* Cluster some "foothills" */}
            <EnvironmentElement
                type={type === 'Rock1' ? 'Rock2' : 'Rock1'}
                position={[scale * 2, -scale, scale]}
                scale={scale * 2}
            />
            <EnvironmentElement
                type={type === 'Rock1' ? 'Rock2' : 'Rock1'}
                position={[-scale * 2, -scale * 0.5, -scale]}
                scale={scale * 2.5}
            />
        </group>
    )
}
