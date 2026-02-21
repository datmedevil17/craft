import React, { useMemo, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useGraph } from '@react-three/fiber'
import { SkeletonUtils } from 'three-stdlib'

export default function OtherPlayer({ type, position, rotation = [0, 0, 0], walletAddress }) {
    const group = useRef()
    const { scene, animations } = useGLTF(`/models/Characters/${type}.gltf`)
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
    const { nodes } = useGraph(clone)
    const { actions } = useAnimations(animations, group)

    // Play idle animation for now
    React.useEffect(() => {
        const idleAnim = actions.Idle || actions.Idle_General || Object.values(actions)[0]
        if (idleAnim) {
            idleAnim.play()
        }
    }, [actions])

    return (
        <group ref={group} position={position} rotation={rotation} scale={0.5}>
            <primitive object={nodes.Root || Object.values(nodes)[0]} />
            {/* Wallet address label could be added here */}
        </group>
    )
}
