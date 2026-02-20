import React, { useMemo, useRef, useState } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useGraph, useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { useCubeStore } from './useStore'

export default function NPC({ type, position, rotation = [0, 0, 0] }) {
    const group = useRef()
    const { scene, animations } = useGLTF(`/models/Characters/${type}.gltf`)
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
    const { nodes } = useGraph(clone)
    const { actions } = useAnimations(animations, group)
    const openDialogue = useCubeStore(state => state.openDialogue)
    const [hasGreeted, setHasGreeted] = useState(false)

    // Play idle animation
    React.useEffect(() => {
        const idleAnim = actions.Idle || actions.Idle_General || Object.values(actions)[0]
        if (idleAnim) {
            idleAnim.play()
        }
    }, [actions])

    // Auto-talk proximity check
    useFrame((state) => {
        if (hasGreeted) return

        const playerPos = state.camera.position
        const npcPos = new THREE.Vector3(...position)
        const distance = playerPos.distanceTo(npcPos)

        if (distance < 5) {
            setHasGreeted(true)
            openDialogue(type)
        }
    })

    return (
        <RigidBody position={position} rotation={rotation} type="fixed" colliders={false}>
            <group ref={group} onClick={(e) => {
                e.stopPropagation()
                openDialogue(type)
            }} scale={0.5}>
                <primitive object={nodes.Root || Object.values(nodes)[0]} />
            </group>
            <CuboidCollider args={[0.4, 0.8, 0.4]} position={[0, 0.8, 0]} />
        </RigidBody>
    )
}
