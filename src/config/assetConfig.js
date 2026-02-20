/**
 * ============================================================
 *  ASSET CONFIGURATION
 *  Manage all world assets, realm definitions, and spawning
 *  rules from here.
 * ============================================================
 */

// -----------------------------------------------------------
//  REALM ENVIRONMENT ASSETS
//  Define which 3D environment models spawn in each realm.
//  Add/remove asset names to change what appears in the world.
// -----------------------------------------------------------
export const REALM_ASSETS = {
    Jungle: {
        items: [
            'Tree_1', 'Tree_2', 'Tree_3',
            'Bamboo', 'Bamboo_Mid', 'Bamboo_Small',
            'Plant_2', 'Plant_3', 'Bush',
            'Flowers_1', 'Flowers_2',
            'Grass_Big', 'Grass_Small',
        ],
        count: 2000,        // how many items to try to spawn
        minDistance: 3,     // min distance between items (dense jungle)
        safeRadius: 25,     // no spawns within this radius of player spawn
    },
    Desert: {
        items: [
            'DeadTree_1', 'DeadTree_2', 'DeadTree_3',
            'Rock1', 'Rock2',
        ],
        count: 800,
        minDistance: 6,
        safeRadius: 25,
    },
    Snow: {
        items: [
            'Crystal_Big', 'Crystal_Small',
            'Rock1', 'Rock2',
        ],
        count: 800,
        minDistance: 6,
        safeRadius: 25,
    },
}

// -----------------------------------------------------------
//  ASSET SCALE OVERRIDES
//  Tweak how large specific asset types appear in the world.
// -----------------------------------------------------------
export const ASSET_SCALE_CONFIG = {
    default: { min: 0.8, max: 1.5 },    // random scale range applied to most assets
    overrides: {
        Crystal_Big: { scale: 5.5 },     // imposing snow crystals
        Crystal_Small: { scale: 3.5 },
        Tree_1: { min: 1.0, max: 1.8 },
        Tree_2: { min: 1.0, max: 2.0 },
        Tree_3: { min: 1.0, max: 1.6 },
    },
}

// -----------------------------------------------------------
//  MOUNTAIN / LANDMARK SPAWNING
//  Large decorative elements at the world edges.
// -----------------------------------------------------------
export const MOUNTAIN_CONFIG = {
    Desert: {
        enabled: true,
        count: 15,
        minDist: 120,
        maxDist: 200,
        minScale: 2,
        maxScale: 5,
        types: ['Rock1', 'Rock2'],
    },
    Snow: {
        enabled: true,
        count: 15,
        minDist: 120,
        maxDist: 200,
        minScale: 2,
        maxScale: 5,
        types: ['Rock1', 'Rock2'],
    },
    Jungle: {
        enabled: false,
    },
}

// -----------------------------------------------------------
//  RIVER CONFIG  (Jungle only)
// -----------------------------------------------------------
export const RIVER_CONFIG = {
    enabled: true,              // show river in Jungle
    width: 15,                  // visual width of the river mesh
    exclusionZone: 15,          // no entity/asset spawns within this distance of river center
    amplitude: 30.0,            // sine wave amplitude (how wide the river curves)
    frequency: 0.02,            // sine wave frequency (how quickly it curves)
}

// -----------------------------------------------------------
//  REALM DEFINITIONS
//  This is the single source of truth for realm data,
//  including blocks, tools, animals, enemies, and appearance.
// -----------------------------------------------------------
export const REALM_CONFIG = {
    Jungle: {
        blocks: [
            'Block_Grass', 'Block_WoodPlanks', 'Block_Brick',
            'Block_Crate', 'Block_Cheese', 'Block_Blank',
        ],
        tools: [
            'Axe_Wood', 'Pickaxe_Wood', 'Shovel_Wood', 'Sword_Wood',
            'Axe_Gold', 'Pickaxe_Gold', 'Shovel_Gold', 'Sword_Gold',
        ],
        animals: ['Cat', 'Chick', 'Chicken', 'Pig'],
        enemies: ['Skeleton', 'Hedgehog', 'Giant'],
        groundColor: '#2d5a27',
        groundTexture: 'grass.jpg',
        fog: { color: '#2d4a1e', density: 0.015 },
        preview: '/assets/jungle.jpg',
    },
    Desert: {
        blocks: [
            'Block_Dirt', 'Block_Stone', 'Block_GreyBricks',
            'Block_Coal', 'Block_Metal',
        ],
        tools: [
            'Axe_Stone', 'Pickaxe_Stone', 'Shovel_Stone', 'Sword_Stone',
        ],
        animals: ['Horse', 'Sheep'],
        enemies: ['Skeleton_Armor', 'Zombie', 'Demon'],
        groundColor: '#d2b48c',
        groundTexture: 'dirt.jpg',
        fog: { color: '#c8a96e', density: 0.012 },
        preview: '/assets/desert.png',
    },
    Snow: {
        blocks: [
            'Block_Snow', 'Block_Ice', 'Block_Crystal', 'Block_Diamond',
        ],
        tools: [
            'Axe_Diamond', 'Pickaxe_Diamond', 'Shovel_Diamond', 'Sword_Diamond',
        ],
        animals: ['Wolf', 'Dog', 'Raccoon'],
        enemies: ['Goblin', 'Yeti', 'Wizard'],
        groundColor: '#ffffff',
        groundTexture: null,
        fog: { color: '#d0eaf5', density: 0.018 },
        preview: '/assets/snow.jpg',
    },
}

// -----------------------------------------------------------
//  ENTITY SPAWN CONFIG
//  Controls how many entities spawn and where.
// -----------------------------------------------------------
export const SPAWN_CONFIG = {
    animals: {
        countPerRealm: 8,       // number of animal instances per realm
        minDistFromSpawn: 20,   // can't spawn too close to the player
        spawnRange: 120,        // random position within this range
        maxAttempts: 10,        // max retries to find a valid position
    },
    enemies: {
        countPerRealm: 12,
        minDistFromSpawn: 20,
        spawnRange: 120,
        maxAttempts: 10,
    },
}

// -----------------------------------------------------------
//  PLAYER CONFIG
// -----------------------------------------------------------
export const PLAYER_CONFIG = {
    speed: 5,
    jumpForce: 7.5,
    maxHealth: 100,
    invincibilityDuration: 3000, // ms of invincibility on spawn/restart
    spawnHeight: 10,
}
