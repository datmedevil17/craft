import React, { useMemo, useRef, useEffect } from 'react'
import { useGLTF, useAnimations, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { useCubeStore } from './useStore'
import { useSocket } from './SocketContext'

/**
 * Boss3D — Renders the realm boss at a fixed position.
 * Clicking attacks the boss via server.
 * Health bar synced from server.
 */
export default function Boss3D() {
    const { bossState } = useSocket()
    const { socketActions } = useCubeStore()

    if (!bossState || !bossState.alive) return null

    return <BossModel bossState={bossState} attackBoss={socketActions.attackBoss} />
}

function BossModel({ bossState, attackBoss }) {
    const group = useRef()
    const { scene, animations } = useGLTF(`/models/Enemies/${bossState.type}.gltf`)
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
    const { actions } = useAnimations(animations, group)

    useEffect(() => {
        const idle = actions.Idle || Object.values(actions)[0]
        if (idle) idle.reset().fadeIn(0.2).play()
    }, [actions])

    // Slowly rotate the boss to face camera
    useFrame((state) => {
        if (!group.current) return
        const cam = state.camera.position
        const bpos = bossState.position
        const angle = Math.atan2(cam.x - bpos[0], cam.z - bpos[2])
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, angle, 0.05)
    })

    const handleClick = (e) => {
        e.stopPropagation()
        attackBoss()
    }

    const hpPercent = Math.max(0, bossState.hp / bossState.maxHp)
    const scale = 2.5 // Boss is big

    return (
        <RigidBody
            position={bossState.position}
            type="fixed"
            colliders={false}
            onClick={handleClick}
        >
            <group ref={group} scale={scale}>
                <primitive object={clone} />
            </group>
            <CuboidCollider args={[2, 3, 2]} position={[0, 3, 0]} />

            {/* Boss Health Bar - HTML overlay */}
            <Html position={[0, scale * 4, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
                <div style={{
                    textAlign: 'center', userSelect: 'none', fontFamily: "'Press Start 2P', monospace"
                }}>
                    <div style={{
                        color: '#ff4444', fontSize: '14px', fontWeight: 'bold',
                        textShadow: '2px 2px 4px #000', marginBottom: '6px'
                    }}>
                        {bossState.type}
                    </div>
                    <div style={{
                        width: '180px', height: '14px',
                        background: '#333', borderRadius: '7px', border: '2px solid #000',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${hpPercent * 100}%`, height: '100%',
                            background: hpPercent > 0.5
                                ? 'linear-gradient(180deg, #ff3333, #cc0000)'
                                : hpPercent > 0.25
                                    ? 'linear-gradient(180deg, #ff8800, #cc5500)'
                                    : 'linear-gradient(180deg, #ff0000, #880000)',
                            transition: 'width 0.3s ease',
                            borderRadius: '5px'
                        }} />
                    </div>
                    <div style={{
                        color: '#fff', fontSize: '8px', marginTop: '3px',
                        textShadow: '1px 1px 2px #000'
                    }}>
                        {bossState.hp} / {bossState.maxHp}
                    </div>
                </div>
            </Html>
        </RigidBody>
    )
}
