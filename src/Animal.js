import React, { useEffect, useRef, useState } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Animal({ type, position }) {
    const group = useRef()
    const { nodes, materials, animations } = useGLTF(`/models/Animals/${type}.gltf`)
    const { actions, names } = useAnimations(animations, group)

    const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(...position))
    const [moving, setMoving] = useState(false)

    // Choose random target on ground
    const getNewTarget = () => {
        const range = 20
        return new THREE.Vector3(
            position[0] + (Math.random() - 0.5) * range,
            0.5,
            position[2] + (Math.random() - 0.5) * range
        )
    }

    useEffect(() => {
        // Start with a sensible initial animation
        const initialAnim = names.find(n => ['Walk', 'Run', 'Idle'].includes(n)) || names[0]
        if (actions[initialAnim]) {
            actions[initialAnim].play()
        }

        // Periodically change target
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                setTargetPosition(getNewTarget())
                setMoving(true)
            } else {
                setMoving(false)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [actions, names])

    useFrame((state, delta) => {
        if (moving && group.current) {
            const currentPos = group.current.position
            const dist = currentPos.distanceTo(targetPosition)

            if (dist > 0.1) {
                // Move towards target
                const dir = targetPosition.clone().sub(currentPos).normalize()
                currentPos.add(dir.multiplyScalar(delta * 2))

                // Rotate towards target
                const lookAtRotation = new THREE.Matrix4().lookAt(targetPosition, currentPos, new THREE.Vector3(0, 1, 0))
                const q = new THREE.Quaternion().setFromRotationMatrix(lookAtRotation)
                group.current.quaternion.slerp(q, 0.1)

                // Ensure Walk or Run is playing if moving
                const moveAnim = actions.Walk || actions.Run
                if (moveAnim && !moveAnim.isRunning()) {
                    actions.Idle?.fadeOut(0.2)
                    actions.Idle_Peck?.fadeOut(0.2)
                    moveAnim.reset().fadeIn(0.2).play()
                }
            } else {
                setMoving(false)
                // Switch to Idle
                const idleAnim = actions.Idle || actions.Idle_Peck
                if (idleAnim && !idleAnim.isRunning()) {
                    actions.Walk?.fadeOut(0.2)
                    actions.Run?.fadeOut(0.2)
                    idleAnim.reset().fadeIn(0.2).play()
                }
            }
        } else if (group.current) {
            // Stay in Idle if not moving
            const idleAnim = actions.Idle || actions.Idle_Peck
            if (idleAnim && !idleAnim.isRunning()) {
                actions.Walk?.fadeOut(0.2)
                actions.Run?.fadeOut(0.2)
                idleAnim.reset().fadeIn(0.2).play()
            }
        }
    })

    return (
        <group ref={group} position={position} dispose={null} scale={0.5}>
            <primitive object={nodes.AnimalArmature || nodes.Root || Object.values(nodes)[0]} />
        </group>
    )
}
