import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame, useGraph } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { useCubeStore } from './useStore'
import { FloatingHealthBar } from './FloatingHealthBar'
import { KILL_REWARDS } from './hooks/use-minecraft-program'

export default function Enemy({ type, position: initialPosition }) {
    const group = useRef()
    const rb = useRef()
    const { scene, animations } = useGLTF(`/models/Enemies/${type}.gltf`)
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
    const { nodes } = useGraph(clone)
    const { actions, names } = useAnimations(animations, group)

    const { damagePlayer, blockchainActions } = useCubeStore(state => ({
        damagePlayer: state.damagePlayer,
        blockchainActions: state.blockchainActions
    }))

    const maxHealth = type === 'Giant' || type === 'Yeti' ? 20 : 5
    const [health, setHealth] = useState(maxHealth)
    const [status, setStatus] = useState('alive') // 'alive', 'dying', 'dead'
    const [lastAttackTime, setLastAttackTime] = useState(1e9) // High initial prevents immediate attack

    const respawn = useCallback(() => {
        const newPos = [
            (Math.random() - 0.5) * 80,
            5,
            (Math.random() - 0.5) * 80
        ]
        setHealth(maxHealth)
        setStatus('alive')
        if (rb.current) {
            rb.current.setTranslation({ x: newPos[0], y: newPos[1], z: newPos[2] })
            rb.current.setLinvel({ x: 0, y: 0, z: 0 })
        }
    }, [maxHealth])

    const handleAttack = useCallback((e) => {
        e.stopPropagation()
        if (status !== 'alive') return

        setHealth(prev => {
            const newHealth = prev - 1
            if (newHealth <= 0) {
                setStatus('dying')
                const reward = KILL_REWARDS[type] || 0
                blockchainActions.killEntity(type, reward)
            } else {
                blockchainActions.attack(type, 1)
            }
            return newHealth
        })

        // Flash red on hit
        if (group.current) {
            group.current.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.emissive = child.material.emissive || new THREE.Color()
                    child.material.emissive.setRGB(1, 0.3, 0.3)
                    child.material.emissiveIntensity = 2
                }
            })
            setTimeout(() => {
                if (group.current) {
                    group.current.traverse((child) => {
                        if (child.isMesh && child.material) {
                            child.material.emissiveIntensity = 0
                        }
                    })
                }
            }, 200)
        }
    }, [status, type, blockchainActions])

    useEffect(() => {
        if (status === 'dying') {
            const deathAnim = actions.Death || names.find(n => n.toLowerCase().includes('death') || n.toLowerCase().includes('die'))
            if (deathAnim) {
                Object.values(actions).forEach(action => action.fadeOut(0.2))
                const anim = typeof deathAnim === 'string' ? actions[deathAnim] : deathAnim
                anim.reset().fadeIn(0.2).play()
                anim.clampWhenFinished = true
                anim.setLoop(THREE.LoopOnce)
            }

            const timeout = setTimeout(() => {
                setStatus('dead')
                setTimeout(respawn, 5000)
            }, 3000)
            return () => clearTimeout(timeout)
        }
    }, [status, actions, names, respawn])

    // Helper: find animation by multiple name patterns
    const findAnim = useCallback((patterns) => {
        for (const p of patterns) {
            if (actions[p]) return actions[p]
            const found = names.find(n => n.toLowerCase().includes(p.toLowerCase()))
            if (found && actions[found]) return actions[found]
        }
        return null
    }, [actions, names])

    useEffect(() => {
        if (status !== 'alive') return
        const idle = findAnim(['Idle', 'idle']) || Object.values(actions)[0]
        if (idle) idle.reset().fadeIn(0.2).play()
    }, [actions, names, status, findAnim])

    useFrame((state, delta) => {
        if (status !== 'alive' || !rb.current || !group.current) return

        const currentPos = new THREE.Vector3().copy(rb.current.translation())
        const playerPos = state.camera.position
        const dist = currentPos.distanceTo(playerPos)

        // Chase range
        if (dist < 20 && dist > 1.5) {
            const dir = playerPos.clone().sub(currentPos).normalize()
            dir.y = 0

            const speed = type === 'Hedgehog' ? 5 : (type === 'Giant' || type === 'Yeti' ? 2 : 3)
            const velocity = rb.current.linvel()
            rb.current.setLinvel({
                x: dir.x * speed,
                y: velocity.y,
                z: dir.z * speed
            }, true)

            // Rotate towards player
            const targetPos = playerPos.clone()
            targetPos.y = currentPos.y // Prevent pitching up/down
            const lookAtRotation = new THREE.Matrix4().lookAt(currentPos, targetPos, new THREE.Vector3(0, 1, 0))
            const q = new THREE.Quaternion().setFromRotationMatrix(lookAtRotation)
            group.current.quaternion.slerp(q, 0.1)

            // Walk animation
            const walkAnim = findAnim(['Walk', 'Run', 'walk', 'run'])
            const idleAnim = findAnim(['Idle', 'idle'])
            if (walkAnim && !walkAnim.isRunning()) {
                if (idleAnim) idleAnim.fadeOut(0.2)
                walkAnim.reset().fadeIn(0.2).play()
            }
        } else if (dist <= 1.5) {
            // Attack player
            const now = state.clock.getElapsedTime()
            if (now - lastAttackTime > 1.5) {
                damagePlayer(type === 'Giant' || type === 'Yeti' ? 20 : 10)
                setLastAttackTime(now)

                // Play attack animation (LoopOnce)
                const attackAnim = findAnim(['Attack', 'Punch', 'Bite', 'Slash', 'attack'])
                if (attackAnim) {
                    Object.values(actions).forEach(a => a !== attackAnim && a.fadeOut(0.15))
                    attackAnim.setLoop(THREE.LoopOnce)
                    attackAnim.clampWhenFinished = true
                    attackAnim.reset().fadeIn(0.1).play()
                }
            }
            rb.current.setLinvel({ x: 0, y: rb.current.linvel().y, z: 0 }, true)
        } else {
            // Idle
            rb.current.setLinvel({ x: 0, y: rb.current.linvel().y, z: 0 }, true)
            const walkAnim = findAnim(['Walk', 'Run', 'walk', 'run'])
            const idleAnim = findAnim(['Idle', 'idle']) || Object.values(actions)[0]
            if (walkAnim && walkAnim.isRunning()) walkAnim.fadeOut(0.3)
            if (idleAnim && !idleAnim.isRunning()) idleAnim.reset().fadeIn(0.3).play()
        }
    })

    if (status === 'dead') return null

    const scale = type === 'Giant' || type === 'Yeti' ? 1.5 : 0.5

    return (
        <RigidBody
            ref={rb}
            position={initialPosition}
            colliders={false}
            type="dynamic"
            enabledRotations={[false, false, false]}
            onClick={handleAttack}
        >
            <group ref={group} dispose={null} scale={scale}>
                <primitive object={nodes.Root || Object.values(nodes)[0]} rotation={[0, Math.PI, 0]} />
            </group>
            <CuboidCollider args={[0.5 * scale, 1 * scale, 0.5 * scale]} position={[0, 1 * scale, 0]} />
            <FloatingHealthBar health={health} maxHealth={maxHealth} position={[0, scale * 2.5, 0]} />
        </RigidBody>
    )
}
