import * as THREE from "three"
import { useTexture } from "@react-three/drei"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import grass from "./assets/grass.jpg"
import { useCubeStore } from "./useStore"

export function Ground(props) {
  const texture = useTexture(grass)
  const addCube = useCubeStore((state) => state.addCube)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return (
    <RigidBody {...props} type="fixed" colliders={false}>
      <mesh
        receiveShadow
        position={[0, 0, 0]}
        rotation-x={-Math.PI / 2}
        onClick={(e) => {
          e.stopPropagation()
          if (e.button === 2) { // Right click to add
            const { x, y, z } = e.point
            addCube(Math.round(x), y + 0.5, Math.round(z))
          }
        }}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial map={texture} map-repeat={[240, 240]} color="green" />
      </mesh>
      <CuboidCollider args={[1000, 2, 1000]} position={[0, -2, 0]} />
    </RigidBody>
  )
}
