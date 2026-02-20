import React from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const Sun = () => {
    const sunRef = React.useRef()

    useFrame((state) => {
        if (sunRef.current) {
            // Keep the sun at a fixed distance from the camera
            const direction = new THREE.Vector3(100, 80, 100).normalize()
            const distance = 400
            sunRef.current.position.copy(state.camera.position).add(direction.multiplyScalar(distance))
            sunRef.current.lookAt(state.camera.position)
        }
    })

    return (
        <mesh ref={sunRef}>
            {/* Minecraft sun is a square! */}
            <planeGeometry args={[50, 50]} />
            <meshBasicMaterial color="#ffffff" fog={false} />
        </mesh>
    )
}
