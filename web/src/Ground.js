import React from "react"
import { useTexture } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import * as THREE from "three"
import { useCubeStore, REALM_CONFIG } from "./useStore"

// Use static paths from public/assets/textures
const grassJpg = "/assets/textures/grass.jpg"
const dirtJpg = "/assets/textures/dirt.jpg"

export const Ground = (props) => {
  const { realm } = useCubeStore()
  const config = REALM_CONFIG[realm]

  const grass = useTexture(grassJpg)
  const dirt = useTexture(dirtJpg)

  const texture = realm === "Jungle" ? grass : (realm === "Desert" ? dirt : null)

  if (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(240, 240)
  }

  const { addCube, blockchainActions, currentBlock, socketActions } = useCubeStore()

  return (
    <RigidBody {...props} type="fixed" colliders="cuboid">
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          if (e.button === 2) {
            e.stopPropagation()
            const { x, z } = e.point
            const pos = [Math.floor(x) + 0.5, 0.5, Math.floor(z) + 0.5]
            addCube(pos[0], pos[1], pos[2])
            socketActions.placeBlock(pos, currentBlock)  // Sync to other players
            blockchainActions.placeBlock(currentBlock)
          }
        }}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial
          map={texture}
          color={config.groundColor}
          roughness={0.8}
        />
      </mesh>
    </RigidBody>
  )
}
