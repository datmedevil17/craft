import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame, useGraph } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { useCubeStore } from './useStore'
import { FloatingHealthBar } from "./FloatingHealthBar"

export const Animal = ({ type, position: initialPosition }) => {
    const group = useRef()
    const rb = useRef()
    const { scene, animations } = useGLTF(`/models/Animals/${type}.gltf`)
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
    const { actions, names } = useAnimations(animations, group)

    const damagePlayer = useCubeStore(state => state.damagePlayer)

    const [health, setHealth] = useState(5)
    const [status, setStatus] = useState('alive') // 'alive', 'dying', 'dead'
    const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(...initialPosition))
    const [moving, setMoving] = useState(false)
    const [lastAttackTime, setLastAttackTime] = useState(1e9) // High initial value prevents immediate attack

    // Animation mapping to fix "weird" actions
    const animMap = useMemo(() => {
        const mapping = {
            Chick: { walk: 'Run', run: 'Run', idle: 'Idle', attack: 'Attack', eat: 'Idle_Peck' },
            Chicken: { walk: 'Run', run: 'Run', idle: 'Idle', attack: 'Attack', eat: 'Idle_Peck' },
            Pig: { walk: 'Walk', run: 'Run', idle: 'Idle', attack: 'Headbutt', eat: 'Idle_Eating' },
            Sheep: { walk: 'Walk', run: 'Run', idle: 'Idle', attack: 'Headbutt', eat: 'Idle_Eating' },
            Wolf: { walk: 'Walk', run: 'Run', idle: 'Idle', attack: 'Attack' },
            Dog: { walk: 'Walk', run: 'Run', idle: 'Idle', attack: 'Attack' },
            Cat: { walk: 'Walk', run: 'Run', idle: 'Idle', attack: 'Attack' },
            Raccoon: { walk: 'Walk', run: 'Run', idle: 'Idle', attack: 'Attack' }
        }
        return mapping[type] || { walk: 'Walk', run: 'Run', idle: 'Idle', attack: 'Attack' }
    }, [type])

    // Choose random target on ground
    const getNewTarget = useCallback((currentPos) => {
        const range = 20
        return new THREE.Vector3(
            currentPos.x + (Math.random() - 0.5) * range,
            currentPos.y,
            currentPos.z + (Math.random() - 0.5) * range
        )
    }, [])

    const respawn = useCallback(() => {
        const newPos = [
            (Math.random() - 0.5) * 50,
            5,
            (Math.random() - 0.5) * 50
        ]
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
            }
            return newHealth
        })

        // Play a quick "hit" animation if available
        const hitAnim = actions[animMap.attack] || actions.Attack || actions.Headbutt
        if (hitAnim) {
            hitAnim.reset().fadeIn(0.1).setDuration(0.5).play()
        }

        // Apply knockback
        if (rb.current) {
            const impulse = { x: (Math.random() - 0.5) * 5, y: 0, z: (Math.random() - 0.5) * 5 }
            rb.current.applyImpulse(impulse, true)
        }
    }, [status, actions, animMap])

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
                setTimeout(respawn, 1000)
            }, 3000)
            return () => clearTimeout(timeout)
        }
    }, [status, actions, names, respawn])

    useEffect(() => {
        if (status !== 'alive') return

        // Start with idle
        const idleAnim = actions[animMap.idle] || actions.Idle || Object.values(actions)[0]
        if (idleAnim) idleAnim.play()

        const interval = setInterval(() => {
            if (type === 'Wolf' || type === 'Dog' || type === 'Raccoon') return

            if (Math.random() > 0.7 && rb.current) {
                const currentPos = rb.current.translation()
                setTargetPosition(getNewTarget(currentPos))
                setMoving(true)
            } else {
                setMoving(false)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [actions, names, getNewTarget, status, type, animMap])

    useFrame((state, delta) => {
        if (status !== 'alive' || !rb.current || !group.current) return

        const currentPos = new THREE.Vector3().copy(rb.current.translation())
        const playerPos = state.camera.position
        const distToPlayer = currentPos.distanceTo(playerPos)

        const isHostile = type === 'Wolf' || type === 'Dog' || type === 'Raccoon'

        if (isHostile && distToPlayer < 15) {
            if (distToPlayer > 1.8) {
                // Chase
                const dir = playerPos.clone().sub(currentPos).normalize()
                dir.y = 0
                const velocity = rb.current.linvel()
                rb.current.setLinvel({ x: dir.x * 5, y: velocity.y, z: dir.z * 5 }, true)

                // Rotate
                const lookAtRotation = new THREE.Matrix4().lookAt(playerPos, currentPos, new THREE.Vector3(0, 1, 0))
                const q = new THREE.Quaternion().setFromRotationMatrix(lookAtRotation)
                group.current.quaternion.slerp(q, 0.1)

                // Animation
                const moveAnim = actions[animMap.run] || actions.Run || actions.Walk
                if (moveAnim && !moveAnim.isRunning()) {
                    Object.values(actions).forEach(a => a !== moveAnim && a.fadeOut(0.2))
                    moveAnim.reset().fadeIn(0.2).play()
                }
            } else {
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
                rb.current.setLinvel({ x: 0, y: rb.current.linvel().y, z: 0 }, true)
            }
            return
        }

        // Normal Passive Animal logic
        const dist = currentPos.distanceTo(targetPosition)
        if (moving && dist > 1.0) {
            const dir = targetPosition.clone().sub(currentPos).normalize()
            dir.y = 0
            const velocity = rb.current.linvel()
            rb.current.setLinvel({ x: dir.x * 3, y: velocity.y, z: dir.z * 3 }, true)
            const lookAtRotation = new THREE.Matrix4().lookAt(targetPosition, currentPos, new THREE.Vector3(0, 1, 0))
            const q = new THREE.Quaternion().setFromRotationMatrix(lookAtRotation)
            group.current.quaternion.slerp(q, 0.1)

            const moveAnim = actions[animMap.walk] || actions.Walk || actions.Run
            if (moveAnim && !moveAnim.isRunning()) {
                Object.values(actions).forEach(a => a !== moveAnim && a.fadeOut(0.2))
                moveAnim.reset().fadeIn(0.2).play()
            }
        } else {
            setMoving(false)
            rb.current.setLinvel({ x: 0, y: rb.current.linvel().y, z: 0 }, true)

            // Randomly eat if idle
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
            colliders="cuboid"
            lockRotations
            onClick={handleAttack}
        >
            <group ref={group} dispose={null} scale={0.5}>
                <primitive object={clone} />
            </group>
            <FloatingHealthBar health={health} maxHealth={5} position={[0, 1.5, 0]} />
        </RigidBody>
    )
}
