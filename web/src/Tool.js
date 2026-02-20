import { useGLTF } from "@react-three/drei"
import { useCubeStore } from "./useStore"

export default function Tool(props) {
    const currentTool = useCubeStore((state) => state.currentTool)
    const { nodes, materials } = useGLTF(`/models/Tools/${currentTool}.gltf`)

    // Find the mesh node. In these models, the mesh name usually matches the tool name.
    // We can also just find the first mesh in nodes.
    const meshName = Object.keys(nodes).find(key => nodes[key].type === 'Mesh')
    const mesh = nodes[meshName]

    return (
        <group dispose={null} {...props} pointerEvents="none">
            <group rotation={[0, Math.PI / 1.8 + Math.PI, 0.2]} scale={0.4}>
                <mesh geometry={mesh.geometry} material={materials.Atlas} />
            </group>
        </group>
    )
}
