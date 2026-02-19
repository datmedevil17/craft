import { useCallback, useRef, useState } from "react"
import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { useCubeStore } from "./useStore"

export const Cubes = () => {
  const cubes = useCubeStore((state) => state.cubes)
  return cubes.map((cube, index) => <Cube key={index} position={cube.pos} type={cube.type} />)
}

export function Cube({ position, type, ...props }) {
  const ref = useRef()
  const [hover, set] = useState(null)
  const { addCube, removeCube } = useCubeStore()
  const { nodes, materials } = useGLTF(`/models/Blocks/${type}.gltf`)

  // Find the mesh node
  const meshName = Object.keys(nodes).find(key => nodes[key].type === 'Mesh')
  const mesh = nodes[meshName]

  const onMove = useCallback((e) => {
    e.stopPropagation()
    set(true)
  }, [])
  const onOut = useCallback(() => set(null), [])
  const onClick = useCallback((e) => {
    e.stopPropagation()
    if (e.button === 0) { // Left click to remove
      const [x, y, z] = position
      removeCube(x, y, z)
    } else if (e.button === 2) { // Right click to add
      const { x, y, z } = ref.current.translation()
      // Use the face normal to determine the neighbor position
      const { x: nx, y: ny, z: nz } = e.face.normal
      addCube(x + nx, y + ny, z + nz)
    }
  }, [addCube, removeCube, position])

  return (
    <RigidBody position={position} type="fixed" colliders="cuboid" ref={ref}>
      <mesh
        receiveShadow
        castShadow
        onPointerMove={onMove}
        onPointerOut={onOut}
        onClick={onClick}
        geometry={mesh.geometry}
        material={materials.Atlas}
        scale={0.5}
      />
      {hover && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.01, 1.01, 1.01]} />
          <meshStandardMaterial color="hotpink" transparent opacity={0.2} />
        </mesh>
      )}
    </RigidBody>
  )
}
