import create from "zustand"

export const REALM_CONFIG = {
    Jungle: {
        blocks: ["Block_Grass", "Block_WoodPlanks", "Block_Brick", "Block_Crate", "Block_Cheese", "Block_Blank"],
        tools: [
            "Axe_Wood", "Pickaxe_Wood", "Shovel_Wood", "Sword_Wood",
            "Axe_Gold", "Pickaxe_Gold", "Shovel_Gold", "Sword_Gold"
        ],
        animals: ["Cat", "Chick", "Chicken", "Pig"],
        enemies: ["Skeleton", "Hedgehog", "Giant"],
        groundColor: "#2d5a27",
        groundTexture: "grass.jpg",
        preview: "/assets/jungle.jpg"
    },
    Desert: {
        blocks: ["Block_Dirt", "Block_Stone", "Block_GreyBricks", "Block_Coal", "Block_Metal"],
        tools: ["Axe_Stone", "Pickaxe_Stone", "Shovel_Stone", "Sword_Stone"],
        animals: ["Horse", "Sheep"],
        enemies: ["Skeleton_Armor", "Zombie", "Demon"],
        groundColor: "#d2b48c",
        groundTexture: "dirt.jpg",
        preview: "/assets/desert.png"
    },
    Snow: {
        blocks: ["Block_Snow", "Block_Ice", "Block_Crystal", "Block_Diamond"],
        tools: ["Axe_Diamond", "Pickaxe_Diamond", "Shovel_Diamond", "Sword_Diamond"],
        animals: ["Wolf", "Dog", "Raccoon"],
        enemies: ["Goblin", "Yeti", "Wizard"],
        groundColor: "#ffffff",
        groundTexture: null,
        preview: "/assets/snow.jpg"
    }
}

export const useCubeStore = create((set) => ({
    gameStarted: false,
    realm: "Jungle",
    playerHealth: 100,
    isGameOver: false,
    invincible: false,
    cubes: [],
    addCube: (x, y, z, type) => set((state) => ({
        cubes: [...state.cubes, { pos: [x, y, z], type: type || state.currentBlock, realm: state.realm }]
    })),
    removeCube: (x, y, z) =>
        set((state) => ({
            cubes: state.cubes.filter((cube) => {
                const [cx, cy, cz] = cube.pos
                return cx !== x || cy !== y || cz !== z
            }),
        })),
    currentTool: "Axe_Wood",
    currentBlock: "Block_Grass",
    tools: [],
    blocks: [],
    animals: [],
    enemies: [],

    startGame: (realm) => {
        const config = REALM_CONFIG[realm]
        set({
            gameStarted: true,
            realm: realm,
            blocks: config.blocks,
            tools: config.tools,
            animals: config.animals,
            enemies: config.enemies,
            currentBlock: config.blocks[0],
            currentTool: config.tools[0],
            playerHealth: 100,
            isGameOver: false,
            invincible: true
        })
        setTimeout(() => {
            set({ invincible: false })
            console.log("Invincibility ended")
        }, 3000)
    },

    damagePlayer: (amount) => set((state) => {
        if (state.invincible || state.isGameOver) return {}
        const newHealth = Math.max(0, state.playerHealth - amount)
        return {
            playerHealth: newHealth,
            isGameOver: newHealth <= 0
        }
    }),
    healPlayer: (amount) => set((state) => ({ playerHealth: Math.min(100, state.playerHealth + amount) })),
    restartGame: () => {
        set({ gameStarted: false, isGameOver: false, playerHealth: 100, invincible: true })
        setTimeout(() => set({ invincible: false }), 3000)
    },

    setTool: (tool) => set({ currentTool: tool }),
    setBlock: (block) => set({ currentBlock: block }),
    dialogue: { isOpen: false, npcType: null, npcResponse: "", isLoading: false },
    openDialogue: (npcType) => set((state) => {
        const realmGreetings = {
            Jungle: "Welcome to the lush Jungle! Watch out for the giant and those tricky skeletons hiding in the trees.",
            Desert: "Greetings, traveler. This desert is harsh, filled with demons and armored skeletons. Be careful!",
            Snow: "Brrr! It's freezing here. Beware of the yetis and goblins that roam these snowy peaks."
        }
        return {
            dialogue: {
                isOpen: true,
                npcType,
                npcResponse: realmGreetings[state.realm] || "Hello! How can I help you today?",
                isLoading: false
            }
        }
    }),
    closeDialogue: () => set({ dialogue: { isOpen: false, npcType: null, npcResponse: "", isLoading: false } }),
    setNPCResponse: (response) => set((state) => ({ dialogue: { ...state.dialogue, npcResponse: response, isLoading: false } })),
    setDialogueLoading: (loading) => set((state) => ({ dialogue: { ...state.dialogue, isLoading: loading } })),

    // Global helper for river checks (used in spawning)
    isInRiver: (x, z) => {
        const state = useCubeStore.getState()
        if (state.realm !== 'Jungle') return false
        const riverZ = 30.0 * Math.sin(x * 0.02)
        return Math.abs(z - riverZ) < 15 // Increased buffer for large assets
    }
}))
