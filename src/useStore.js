import create from "zustand"

export const useCubeStore = create((set) => ({
    cubes: [],
    addCube: (x, y, z, type) => set((state) => ({ cubes: [...state.cubes, { pos: [x, y, z], type: type || state.currentBlock }] })),
    removeCube: (x, y, z) =>
        set((state) => ({
            cubes: state.cubes.filter((cube) => {
                const [cx, cy, cz] = cube.pos
                return cx !== x || cy !== y || cz !== z
            }),
        })),
    currentTool: "Axe_Diamond",
    currentBlock: "Block_Grass",
    tools: [
        "Axe_Diamond", "Axe_Gold", "Axe_Stone", "Axe_Wood",
        "Pickaxe_Diamond", "Pickaxe_Gold", "Pickaxe_Stone", "Pickaxe_Wood",
        "Shovel_Diamond", "Shovel_Gold", "Shovel_Stone", "Shovel_Wood",
        "Sword_Diamond", "Sword_Gold", "Sword_Stone", "Sword_Wood"
    ],
    blocks: [
        "Block_Blank", "Block_Brick", "Block_Cheese", "Block_Coal", "Block_Crate",
        "Block_Crystal", "Block_Diamond", "Block_Dirt", "Block_Grass", "Block_GreyBricks",
        "Block_Ice", "Block_Metal", "Block_Snow", "Block_Stone", "Block_WoodPlanks"
    ],
    setTool: (tool) => set({ currentTool: tool }),
    setBlock: (block) => set({ currentBlock: block }),
}))
