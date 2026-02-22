import React, { useMemo, useRef, useEffect } from 'react'
import { useGLTF, useAnimations, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { SkeletonUtils } from 'three-stdlib'
import { useCubeStore } from './useStore'
import { FloatingHealthBar } from './FloatingHealthBar'

export default function OtherPlayer({ type, position, rotation = [0, 0, 0], walletAddress, hp = 30, maxHp = 30, username, alive = true, currentAction = 'idle' }) {
    const group = useRef()
    const { scene, animations } = useGLTF(`/models/Characters/${type}.gltf`)
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
    const { actions } = useAnimations(animations, group)
    const { socketActions } = useCubeStore()

    useEffect(() => {
        const idle = actions.Idle || actions.Idle_General || Object.values(actions)[0]
        if (idle) idle.reset().fadeIn(0.2).play()
    }, [actions])

    // Sync animation from server action state
    useEffect(() => {
        let targetAnim = null
        if (currentAction === 'walk') targetAnim = actions.Walk || actions.Run || actions.Idle
        else if (currentAction === 'attack') targetAnim = actions.Attack || actions.Walk
        else targetAnim = actions.Idle || actions.Idle_General || Object.values(actions)[0]

        if (targetAnim && !targetAnim.isRunning()) {
            Object.values(actions).forEach(a => a !== targetAnim && a.fadeOut(0.2))
            targetAnim.reset().fadeIn(0.2).play()
        }
    }, [currentAction, actions])

    // Smoothly lerp to target position
    useFrame(() => {
        if (!group.current || !alive) return
        group.current.position.lerp({ x: position[0], y: position[1] - 0.5, z: position[2] }, 0.2)
        if (rotation) {
            group.current.rotation.set(0, rotation[1] + Math.PI, 0)
        }
    })

    if (!alive) return null

    const handleClick = (e) => {
        e.stopPropagation()
        socketActions.attackPlayer(walletAddress)
    }

    return (
        <group ref={group} scale={0.5} onClick={handleClick} style={{ cursor: 'crosshair' }}>
            <primitive object={clone} />
            {/* Nametag */}
            <Html position={[0, 4.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
                <div style={{
                    color: '#fff', fontSize: '11px', fontWeight: 'bold',
                    textShadow: '1px 1px 2px #000, -1px -1px 2px #000',
                    whiteSpace: 'nowrap', fontFamily: "'Press Start 2P', monospace",
                    userSelect: 'none'
                }}>
                    {username || walletAddress?.slice(0, 6)}
                </div>
            </Html>
            {/* Health bar */}
            <FloatingHealthBar health={hp} maxHealth={maxHp} position={[0, 4, 0]} />
        </group>
    )
}
