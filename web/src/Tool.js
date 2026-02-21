import { useGLTF } from "@react-three/drei"
import { useCubeStore } from "./useStore"
import { useMemo } from "react"

/**
 * Renders the currently selected hotbar item in the player's hand.
 * Supports both tools (e.g. Axe_Wood) and blocks (e.g. Block_Grass).
 */
export default function Tool(props) {
    const hotbarSlots = useCubeStore((state) => state.hotbarSlots)
    const selectedHotbarIndex = useCubeStore((state) => state.selectedHotbarIndex)
    const selectedItem = hotbarSlots[selectedHotbarIndex]

    if (!selectedItem) return null

    const isBlock = selectedItem.startsWith('Block_')
    const modelPath = isBlock
        ? `/models/Blocks/${selectedItem}.gltf`
        : `/models/Tools/${selectedItem}.gltf`

    return <ItemModel key={selectedItem} modelPath={modelPath} isBlock={isBlock} {...props} />
}

function ItemModel({ modelPath, isBlock, ...props }) {
    const { nodes, materials } = useGLTF(modelPath)

    const meshName = Object.keys(nodes).find(key => nodes[key].type === 'Mesh')
    const mesh = nodes[meshName]

    // Blocks and tools have slightly different ideal hand positions/scales
    const rotation = isBlock
        ? [0.4, Math.PI / 4, 0.3]
        : [0, Math.PI / 1.8 + Math.PI, 0.2]
    const scale = isBlock ? 0.28 : 0.4

    return (
        <group dispose={null} {...props} pointerEvents="none">
            <group rotation={rotation} scale={scale}>
                <mesh geometry={mesh.geometry} material={materials.Atlas} />
            </group>
        </group>
    )
}
