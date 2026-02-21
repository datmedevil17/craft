import { useCallback, useRef, useState } from "react"
import { useGLTF } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { useCubeStore } from "./useStore"

export const Cubes = () => {
  const cubes = useCubeStore((state) => state.cubes)
  const realm = useCubeStore((state) => state.realm)
  return cubes
    .filter(cube => cube.realm === realm && cube.type && cube.type.startsWith('Block_'))
    .map((cube, index) => <Cube key={index} position={cube.pos} type={cube.type} />)
}

export function Cube({ position, type, ...props }) {
  const ref = useRef()
  const [hover, set] = useState(null)
  const { addCube, removeCube, currentTool, blockchainActions, currentBlock, cameraMode } = useCubeStore()
  const [clicks, setClicks] = useState(0)
  const { getRequiredClicks } = require("./miningConfig")
  const requiredClicks = getRequiredClicks(type, currentTool)

  const { nodes, materials } = useGLTF(`/models/Blocks/${type}.gltf`)
  const meshName = Object.keys(nodes).find(key => nodes[key].type === 'Mesh')
  const mesh = nodes[meshName]

  const onMove = useCallback((e) => {
    e.stopPropagation()
    set(true)
  }, [])
  const onOut = useCallback(() => set(null), [])
  const onClick = useCallback((e) => {
    e.stopPropagation()
    if (e.button === 0) {
      // Left click only → damage/break block
      setClicks(prev => {
        const next = prev + 1
        if (next >= requiredClicks) {
          const [x, y, z] = position
          removeCube(x, y, z)
        }
        return next
      })
    } else if (e.button === 2) {
      // Right click with a block selected → place block (first-person only)
      if (cameraMode !== 'first') return;
      if (!currentBlock || !currentBlock.startsWith('Block_')) return;
      const { x, y, z } = ref.current.translation()
      const { x: nx, y: ny, z: nz } = e.face.normal
      addCube(x + nx, y + ny, z + nz)
      blockchainActions.placeBlock(currentBlock)
    }
  }, [addCube, removeCube, position, requiredClicks])

  const currentScale = 0.5 - (clicks / requiredClicks) * 0.05 // Subtle shrinking as it gets damaged

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
        scale={currentScale}
      />
      {hover && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.51, 0.51, 0.51]} />
          <meshStandardMaterial color="hotpink" transparent opacity={0.2} />
        </mesh>
      )}
    </RigidBody>
  )
}
