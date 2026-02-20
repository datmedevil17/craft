import React from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'

export const EnvironmentElement = ({ type, position, rotation, scale = 1 }) => {
    const { scene } = useGLTF(`/models/Environment/${type}.gltf`)

    // Simple collider based on type
    const colliderType = (type.includes('Tree') || type.includes('Rock') || type.includes('Crystal') || type.includes('Bamboo'))
        ? "trimesh"
        : "cuboid"

    return (
        <RigidBody
            position={position}
            rotation={rotation}
            type="fixed"
            colliders={colliderType}
        >
            <primitive
                object={scene.clone()}
                scale={scale * 0.5} // Standardize scale
            />
        </RigidBody>
    )
}
