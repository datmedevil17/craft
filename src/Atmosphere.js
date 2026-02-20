import React, { useMemo, useRef } from 'react'
import { useCubeStore } from './useStore'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Particles = ({ count, color }) => {
    const mesh = useRef()
    const particles = useMemo(() => {
        const temp = []
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100
            const factor = 20 + Math.random() * 100
            const speed = 0.01 + Math.random() / 200
            const xFactor = -50 + Math.random() * 100
            const yFactor = -50 + Math.random() * 100
            const zFactor = -50 + Math.random() * 100
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 })
        }
        return temp
    }, [count])

    useFrame((state) => {
        particles.forEach((particle, i) => {
            let { t, factor, speed, xFactor, yFactor, zFactor } = particle
            t = particle.t += speed / 2
            const s = Math.cos(t)
            const dummy = new THREE.Object3D()
            dummy.position.set(
                (xFactor + Math.cos(t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
                (yFactor + Math.sin(t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
                (zFactor + Math.cos(t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
            )
            dummy.scale.set(s, s, s)
            dummy.rotation.set(s * 5, s * 5, s * 5)
            dummy.updateMatrix()
            mesh.current.setMatrixAt(i, dummy.matrix)
        })
        mesh.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={mesh} args={[null, null, count]} raycast={() => null}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color={color} />
        </instancedMesh>
    )
}

export const Atmosphere = () => {
    const { realm } = useCubeStore()

    const config = useMemo(() => {
        switch (realm) {
            case 'Jungle':
                return {
                    fogColor: '#1a2e1a',
                    fogNear: 50,
                    fogFar: 150,
                    lightTint: '#d0ffd0',
                    particleColor: '#ffffff',
                    particles: false
                }
            case 'Desert':
                return {
                    fogColor: '#3d2b1f',
                    fogNear: 40,
                    fogFar: 120,
                    lightTint: '#ffe0b0',
                    particleColor: '#d2b48c',
                    particles: true,
                    particleCount: 200
                }
            case 'Snow':
                return {
                    fogColor: '#e0f0ff',
                    fogNear: 30,
                    fogFar: 100,
                    lightTint: '#ffffff',
                    particleColor: '#ffffff',
                    particles: true,
                    particleCount: 500
                }
            default:
                return {
                    fogColor: '#000000',
                    fogNear: 50,
                    fogFar: 200,
                    lightTint: '#ffffff',
                    particleColor: '#ffffff',
                    particles: false
                }
        }
    }, [realm])

    return (
        <>
            <fog attach="fog" args={[config.fogColor, config.fogNear, config.fogFar]} />
            <ambientLight intensity={0.5} color={config.lightTint} />
            {config.particles && <Particles count={config.particleCount} color={config.particleColor} />}
        </>
    )
}
