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

        // Play a hit animation
        const hitAnim = actions.Attack || actions.Walk || Object.values(actions)[0]
        if (hitAnim) {
            hitAnim.reset().fadeIn(0.1).setDuration(0.5).play()
        }
    }, [status, actions])

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

    useEffect(() => {
        if (status !== 'alive') return
        const idleAnim = actions.Idle || names.find(n => n.includes('Idle')) || names[0]
        if (actions[idleAnim]) actions[idleAnim].play()
    }, [actions, names, status])

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
            const lookAtRotation = new THREE.Matrix4().lookAt(targetPos, currentPos, new THREE.Vector3(0, 1, 0))
            const q = new THREE.Quaternion().setFromRotationMatrix(lookAtRotation)
            group.current.quaternion.slerp(q, 0.1)

            // Walk animation
            const moveAnim = actions.Walk || actions.Run || names.find(n => n.includes('Walk'))
            if (moveAnim) {
                const anim = typeof moveAnim === 'string' ? actions[moveAnim] : moveAnim
                if (!anim.isRunning()) anim.reset().fadeIn(0.2).play()
            }
        } else if (dist <= 1.5) {
            // Attack player
            const now = state.clock.getElapsedTime()
            if (now - lastAttackTime > 1.5) {
                damagePlayer(type === 'Giant' || type === 'Yeti' ? 20 : 10)
                setLastAttackTime(now)

                // Play attack animation
                const attackAnim = actions.Attack || names.find(n => n.includes('Attack'))
                if (attackAnim) {
                    const anim = typeof attackAnim === 'string' ? actions[attackAnim] : attackAnim
                    anim.reset().fadeIn(0.1).play()
                }
            }
            rb.current.setLinvel({ x: 0, y: rb.current.linvel().y, z: 0 }, true)
        } else {
            // Idle
            rb.current.setLinvel({ x: 0, y: rb.current.linvel().y, z: 0 }, true)
            const moveAnim = actions.Walk || actions.Run || names.find(n => n.includes('Walk'))
            if (moveAnim) {
                const anim = typeof moveAnim === 'string' ? actions[moveAnim] : moveAnim
                anim.fadeOut(0.2)
            }
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
                <primitive object={nodes.Root || Object.values(nodes)[0]} />
            </group>
            <CuboidCollider args={[0.5 * scale, 1 * scale, 0.5 * scale]} position={[0, 1 * scale, 0]} />
            <FloatingHealthBar health={health} maxHealth={maxHealth} position={[0, 2 * scale + 0.5, 0]} />
        </RigidBody>
    )
}
