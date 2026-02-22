import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame, useGraph } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { useCubeStore } from './useStore'
import { FloatingHealthBar } from "./FloatingHealthBar"
import { KILL_REWARDS } from './hooks/use-minecraft-program'
import { ANIMAL_CONFIG, DEFAULT_ANIMAL_CONFIG } from './config/animationConfig'

export const Animal = ({ id, type, position: initialPosition, allPositions }) => {
    const group = useRef()
    const rb = useRef()
    const { scene, animations } = useGLTF(`/models/Animals/${type}.gltf`)
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
    const { actions, names } = useAnimations(animations, group)

    const { damagePlayer, blockchainActions, realm } = useCubeStore(state => ({
        damagePlayer: state.damagePlayer,
        blockchainActions: state.blockchainActions,
        realm: state.realm
    }))

    const [health, setHealth] = useState(5)
    const [status, setStatus] = useState('alive') // 'alive', 'dying', 'dead'
    const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(...initialPosition))
    const [moving, setMoving] = useState(false)
    const [lastAttackTime, setLastAttackTime] = useState(1e9) // High initial value prevents immediate attack

    // Configuration based on entity type
    const config = useMemo(() => ANIMAL_CONFIG[type] || DEFAULT_ANIMAL_CONFIG, [type])
    const animMap = config.animations
    const scale = config.scale || 0.5
    const speed = config.speed || 2
    const runSpeed = config.runSpeed || 4
    const attackRange = config.attackRange || 1.8
    const chaseRange = config.chaseRange || 15

    // Choose random target on ground that is NOT in the river
    const getNewTarget = useCallback((currentPos) => {
        const range = 20
        for (let i = 0; i < 8; i++) {
            const x = currentPos.x + (Math.random() - 0.5) * range
            const z = currentPos.z + (Math.random() - 0.5) * range
            if (!useCubeStore.getState().isInRiver(x, z)) {
                return new THREE.Vector3(x, currentPos.y, z)
            }
        }
        // fallback: stay put
        return new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z)
    }, [])

    const respawn = useCallback(() => {
        let newPos = [0, 5, 50] // default safe
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 100
            const z = (Math.random() - 0.5) * 100
            if (!useCubeStore.getState().isInRiver(x, z)) {
                newPos = [x, 5, z]
                break
            }
        }
        setTargetPosition(new THREE.Vector3(...newPos))
        setHealth(5)
        setStatus('alive')
        setMoving(false)
        if (rb.current) {
            rb.current.setTranslation({ x: newPos[0], y: newPos[1], z: newPos[2] })
            rb.current.setLinvel({ x: 0, y: 0, z: 0 })
        }
    }, [])

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

        const hitAnim = actions[animMap.attack] || actions.Attack || actions.Headbutt
        if (hitAnim) {
            hitAnim.reset().fadeIn(0.1).setDuration(0.5).play()
        }

        if (rb.current) {
            const impulse = { x: (Math.random() - 0.5) * 5, y: 0, z: (Math.random() - 0.5) * 5 }
            rb.current.applyImpulse(impulse, true)
        }
    }, [status, actions, animMap, type, blockchainActions])

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
                if (allPositions.current[id]) delete allPositions.current[id]
                setTimeout(respawn, 1000)
            }, 3000)
            return () => clearTimeout(timeout)
        }
    }, [status, actions, names, respawn, id, allPositions])

    useEffect(() => {
        if (status !== 'alive') return

        const idleAnim = actions[animMap.idle] || actions.Idle || Object.values(actions)[0]
        if (idleAnim) idleAnim.play()

        const interval = setInterval(() => {
            // Animals follow player in Snow realm, otherwise random walk
            if (realm === 'Snow' || type === 'Wolf' || type === 'Dog' || type === 'Raccoon') return

            if (Math.random() > 0.7 && rb.current) {
                const currentPos = rb.current.translation()
                setTargetPosition(getNewTarget(currentPos))
                setMoving(true)
            } else {
                setMoving(false)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [actions, names, getNewTarget, status, type, animMap, realm])

    useFrame((state, delta) => {
        if (status !== 'alive' || !rb.current || !group.current) return

        const currentPos = new THREE.Vector3().copy(rb.current.translation())
        allPositions.current[id] = currentPos // Register current position

        const playerPos = state.camera.position
        const distToPlayer = currentPos.distanceTo(playerPos)

        const isHostile = (type === 'Wolf' || type === 'Dog' || type === 'Raccoon') && realm !== 'Snow'
        const shouldFollow = realm === 'Snow' || isHostile

        let movementDir = new THREE.Vector3(0, 0, 0)
        let finalSpeed = speed

        if (shouldFollow && distToPlayer < 20) {
            if (distToPlayer > (isHostile ? 1.8 : 4)) {
                // Determine direction to player
                movementDir.subVectors(playerPos, currentPos).normalize()
                finalSpeed = isHostile ? runSpeed + 1 : runSpeed
            } else if (isHostile) {
                // Attack Player
                const now = state.clock.getElapsedTime()
                if (now - lastAttackTime > 1.5) {
                    damagePlayer(10)
                    setLastAttackTime(now)
                    const attackAnim = actions[animMap.attack] || actions.Attack || actions.Headbutt
                    if (attackAnim) {
                        attackAnim.reset().fadeIn(0.1).play()
                    }
                }
            }
        } else if (moving) {
            const dist = currentPos.distanceTo(targetPosition)
            if (dist > 1.0) {
                movementDir.subVectors(targetPosition, currentPos).normalize()
                finalSpeed = speed
            } else {
                setMoving(false)
            }
        }

        // Separation Force: Don't stack over each other
        const separationForce = new THREE.Vector3(0, 0, 0)
        let neighborCount = 0
        const separationDistance = 3.0

        Object.entries(allPositions.current).forEach(([neighborId, neighborPos]) => {
            if (neighborId === id.toString()) return
            const dist = currentPos.distanceTo(neighborPos)
            if (dist < separationDistance && dist > 0) {
                const diff = new THREE.Vector3().subVectors(currentPos, neighborPos)
                diff.normalize().divideScalar(dist) // Weight by proximity
                separationForce.add(diff)
                neighborCount++
            }
        })

        if (neighborCount > 0) {
            separationForce.divideScalar(neighborCount)
            movementDir.add(separationForce.multiplyScalar(2.0)) // Strength of separation
        }

        if (movementDir.lengthSq() > 0.01) {
            movementDir.normalize()
            movementDir.y = 0

            const velocity = rb.current.linvel()
            rb.current.setLinvel({
                x: movementDir.x * finalSpeed,
                y: velocity.y,
                z: movementDir.z * finalSpeed
            }, true)

            // Look in direction of movement
            const targetLook = currentPos.clone().add(movementDir)
            const lookAtRotation = new THREE.Matrix4().lookAt(currentPos, targetLook, new THREE.Vector3(0, 1, 0))
            const q = new THREE.Quaternion().setFromRotationMatrix(lookAtRotation)
            group.current.quaternion.slerp(q, 0.1)

            const mAnim = (finalSpeed > speed) ? (actions[animMap.run] || actions.Run) : (actions[animMap.walk] || actions.Walk)
            if (mAnim && !mAnim.isRunning()) {
                Object.values(actions).forEach(a => a !== mAnim && a.fadeOut(0.2))
                mAnim.reset().fadeIn(0.2).play()
            }
        } else {
            rb.current.setLinvel({ x: 0, y: rb.current.linvel().y, z: 0 }, true)
            const idleAnim = (Math.random() > 0.5 && actions[animMap.eat]) ? actions[animMap.eat] : (actions[animMap.idle] || actions.Idle)
            if (idleAnim && !idleAnim.isRunning()) {
                Object.values(actions).forEach(a => a !== idleAnim && a.fadeOut(0.2))
                idleAnim.reset().fadeIn(0.2).play()
            }
        }
    })

    if (status === 'dead') return null

    return (
        <RigidBody
            ref={rb}
            name="Animal"
            type="dynamic"
            position={initialPosition}
            colliders={false}
            enabledRotations={[false, false, false]}
            onClick={handleAttack}
        >
            <group ref={group} dispose={null} scale={scale}>
                <primitive object={clone} rotation={[0, Math.PI, 0]} />
            </group>
            <CuboidCollider args={[0.4 * scale, 0.4 * scale, 0.6 * scale]} position={[0, 0.4 * scale, 0]} />
            <FloatingHealthBar health={health} maxHealth={5} position={[0, scale * 2.5, 0]} />
        </RigidBody>
    )
}
