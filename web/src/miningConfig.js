export const miningConfig = {
    "Block_Stone": {
        "Pickaxe": 3,
        "Axe": 10,
        "Shovel": 15,
        "hand": 20
    },
    "Block_GreyBricks": {
        "Pickaxe": 3,
        "Axe": 10,
        "hand": 20
    },
    "Block_Diamond": {
        "Pickaxe": 5,
        "hand": 30
    },
    "Block_Crystal": {
        "Pickaxe": 4,
        "hand": 25
    },
    "Block_Dirt": {
        "Shovel": 1,
        "hand": 5
    },
    "Block_Grass": {
        "Shovel": 1,
        "hand": 4
    },
    "Block_Snow": {
        "Shovel": 1,
        "hand": 3
    },
    "Block_Ice": {
        "Pickaxe": 2,
        "Shovel": 2,
        "hand": 8
    },
    "Block_WoodPlanks": {
        "Axe": 2,
        "hand": 10
    },
    "Block_Crate": {
        "Axe": 1,
        "hand": 5
    }
}

export const getRequiredClicks = (blockType, toolName) => {
    const config = miningConfig[blockType] || { hand: 5 }

    if (!toolName) return config.hand || 5

    const toolType = toolName.split('_')[0] // Get "Pickaxe", "Axe", etc.
    return config[toolType] || config.hand || 5
}
