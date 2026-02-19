import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'

export default function Animal({ type, position: initialPosition }) {
    const group = useRef()
    const rb = useRef()
    const { nodes, animations } = useGLTF(`/models/Animals/${type}.gltf`)
    const { actions, names } = useAnimations(animations, group)

    const [health, setHealth] = useState(3)
    const [status, setStatus] = useState('alive') // 'alive', 'dying', 'dead'
    const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(...initialPosition))
    const [moving, setMoving] = useState(false)
    const [spawnPos, setSpawnPos] = useState(new THREE.Vector3(...initialPosition))

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
            5, // Spawn slightly in air to show physics
            (Math.random() - 0.5) * 50
        ]
        setSpawnPos(new THREE.Vector3(...newPos))
        setTargetPosition(new THREE.Vector3(...newPos))
        setHealth(3)
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

        // Apply a little knockback
        if (rb.current) {
            const impulse = { x: (Math.random() - 0.5) * 5, y: 5, z: (Math.random() - 0.5) * 5 }
            rb.current.applyImpulse(impulse, true)
        }
    }, [status])

    useEffect(() => {
        if (status === 'dying') {
            const deathAnim = actions.Death || names.find(n => n.toLowerCase().includes('death') || n.toLowerCase().includes('die'))
            if (deathAnim) {
                // Stop all other animations
                Object.values(actions).forEach(action => action.fadeOut(0.2))
                const anim = typeof deathAnim === 'string' ? actions[deathAnim] : deathAnim
                anim.reset().fadeIn(0.2).play()
                anim.clampWhenFinished = true
                anim.setLoop(THREE.LoopOnce)
            }

            // Wait 3 seconds then die (disappear)
            const timeout = setTimeout(() => {
                setStatus('dead')
                // Wait another short bit then respawn
                setTimeout(respawn, 1000)
            }, 3000)
            return () => clearTimeout(timeout)
        }
    }, [status, actions, names, respawn])

    useEffect(() => {
        if (status !== 'alive') return

        // Start with a sensible initial animation
        const initialAnim = names.find(n => ['Walk', 'Run', 'Idle'].includes(n)) || names[0]
        if (actions[initialAnim]) {
            actions[initialAnim].play()
        }

        // Periodically change target
        const interval = setInterval(() => {
            if (Math.random() > 0.7 && rb.current) {
                const currentPos = rb.current.translation()
                setTargetPosition(getNewTarget(currentPos))
                setMoving(true)
            } else {
                setMoving(false)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [actions, names, getNewTarget, status])

    useFrame((state, delta) => {
        if (status !== 'alive' || !rb.current || !group.current) return

        const currentPos = new THREE.Vector3().copy(rb.current.translation())
        const dist = currentPos.distanceTo(targetPosition)

        if (moving && dist > 0.5) {
            // Move towards target using velocity
            const dir = targetPosition.clone().sub(currentPos).normalize()
            dir.y = 0 // Keep movement on horizontal plane

            const velocity = rb.current.linvel()
            rb.current.setLinvel({
                x: dir.x * 3,
                y: velocity.y,
                z: dir.z * 3
            }, true)

            // Rotate towards target
            const lookAtRotation = new THREE.Matrix4().lookAt(targetPosition, currentPos, new THREE.Vector3(0, 1, 0))
            const q = new THREE.Quaternion().setFromRotationMatrix(lookAtRotation)
            group.current.quaternion.slerp(q, 0.1)

            // Animation switching
            const moveAnim = actions.Walk || actions.Run
            if (moveAnim && !moveAnim.isRunning()) {
                actions.Idle?.fadeOut(0.2)
                actions.Idle_Peck?.fadeOut(0.2)
                actions.Idle_Eating?.fadeOut(0.2)
                moveAnim.reset().fadeIn(0.2).play()
            }
        } else {
            setMoving(false)
            // Stop horizontal movement
            const velocity = rb.current.linvel()
            rb.current.setLinvel({ x: 0, y: velocity.y, z: 0 }, true)

            // Switch to Idle
            const idleAnim = actions.Idle || actions.Idle_Peck || actions.Idle_Eating
            if (idleAnim && !idleAnim.isRunning()) {
                actions.Walk?.fadeOut(0.2)
                actions.Run?.fadeOut(0.2)
                idleAnim.reset().fadeIn(0.2).play()
            }
        }
    })

    if (status === 'dead') return null

    return (
        <RigidBody
            ref={rb}
            position={initialPosition}
            colliders={false}
            type="dynamic"
            enabledRotations={[false, false, false]}
        >
            <group ref={group} dispose={null} scale={0.5} onClick={handleAttack}>
                <primitive object={nodes.AnimalArmature || nodes.Root || Object.values(nodes)[0]} />
            </group>
            {/* Rough collider for animals */}
            <CuboidCollider args={[0.4, 0.4, 0.4]} position={[0, 0.4, 0]} />
        </RigidBody>
    )
}
