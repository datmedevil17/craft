export const miningConfig = {
    "Block_Stone": {
        "Pickaxe": 2,
        "Axe": 5,
        "Shovel": 8,
        "hand": 12
    },
    "Block_GreyBricks": {
        "Pickaxe": 2,
        "Axe": 5,
        "hand": 12
    },
    "Block_Diamond": {
        "Pickaxe": 3,
        "hand": 15
    },
    "Block_Crystal": {
        "Pickaxe": 2,
        "hand": 12
    },
    "Block_Dirt": {
        "Shovel": 1,
        "hand": 3
    },
    "Block_Grass": {
        "Shovel": 1,
        "hand": 2
    },
    "Block_Snow": {
        "Shovel": 1,
        "hand": 2
    },
    "Block_Ice": {
        "Pickaxe": 1,
        "Shovel": 1,
        "hand": 4
    },
    "Block_WoodPlanks": {
        "Axe": 1,
        "hand": 5
    },
    "Block_Crate": {
        "Axe": 1,
        "hand": 3
    }
}

export const getRequiredClicks = (blockType, toolName) => {
    const config = miningConfig[blockType] || { hand: 3 }

    if (!toolName) return config.hand || 3

    const toolType = toolName.split('_')[0] // Get "Pickaxe", "Axe", etc.
    return config[toolType] || config.hand || 3
}
