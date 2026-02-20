/**
 * ============================================================
 *  ANIMATION CONFIGURATION
 *  Manage all entity animations from here.
 *
 *  For each entity type, define:
 *    - animations: map of action -> exact animation clip name
 *    - speed:      movement speed multiplier
 *    - runSpeed:   run speed multiplier (hostile chase)
 *    - attackRange: distance at which entity starts attacking
 *    - attackCooldown: seconds between attacks
 *    - attackDamage: damage per hit to player
 *    - chaseRange: distance at which hostile animals start chasing
 * ============================================================
 */

// -----------------------------------------------------------
//  ANIMALS
// -----------------------------------------------------------
export const ANIMAL_CONFIG = {
    Chick: {
        animations: {
            walk: 'Run',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            eat: 'Idle_Peck',
            death: 'Death',
        },
        speed: 2,
        runSpeed: 4,
        attackRange: 1.8,
        attackCooldown: 2.0,
        attackDamage: 2,
        chaseRange: 0, // 0 = passive (never chases)
        scale: 0.5,
    },
    Chicken: {
        animations: {
            walk: 'Run',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            eat: 'Idle_Peck',
            death: 'Death',
        },
        speed: 2.5,
        runSpeed: 4,
        attackRange: 1.8,
        attackCooldown: 2.0,
        attackDamage: 3,
        chaseRange: 0,
        scale: 0.5,
    },
    Pig: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Headbutt',
            eat: 'Idle_Eating',
            death: 'Death',
        },
        speed: 2,
        runSpeed: 4.5,
        attackRange: 1.8,
        attackCooldown: 2.0,
        attackDamage: 4,
        chaseRange: 0,
        scale: 0.5,
    },
    Sheep: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Headbutt',
            eat: 'Idle_Eating',
            death: 'Death',
        },
        speed: 2,
        runSpeed: 4,
        attackRange: 1.8,
        attackCooldown: 2.5,
        attackDamage: 3,
        chaseRange: 0,
        scale: 0.5,
    },
    Horse: {
        animations: {
            walk: 'Walk',
            run: 'Gallop',
            idle: 'Idle',
            attack: 'Kick',
            eat: 'Idle',
            death: 'Death',
        },
        speed: 4,
        runSpeed: 8,
        attackRange: 2.0,
        attackCooldown: 2.0,
        attackDamage: 5,
        chaseRange: 0,
        scale: 0.5,
    },
    Wolf: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            eat: 'Idle',
            death: 'Death',
        },
        speed: 3,
        runSpeed: 6,
        attackRange: 1.8,
        attackCooldown: 1.5,
        attackDamage: 10,
        chaseRange: 15, // hostile: chases when within this range
        scale: 0.5,
    },
    Dog: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            eat: 'Idle',
            death: 'Death',
        },
        speed: 3,
        runSpeed: 5,
        attackRange: 1.8,
        attackCooldown: 1.5,
        attackDamage: 8,
        chaseRange: 15,
        scale: 0.5,
    },
    Cat: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            eat: 'Idle',
            death: 'Death',
        },
        speed: 2,
        runSpeed: 4,
        attackRange: 1.5,
        attackCooldown: 2.0,
        attackDamage: 5,
        chaseRange: 0,
        scale: 0.5,
    },
    Raccoon: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            eat: 'Idle',
            death: 'Death',
        },
        speed: 2.5,
        runSpeed: 5,
        attackRange: 1.8,
        attackCooldown: 1.5,
        attackDamage: 8,
        chaseRange: 15,
        scale: 0.5,
    },
}

// Fallback config used when animal type is not in ANIMAL_CONFIG
export const DEFAULT_ANIMAL_CONFIG = {
    animations: {
        walk: 'Walk',
        run: 'Run',
        idle: 'Idle',
        attack: 'Attack',
        eat: 'Idle',
        death: 'Death',
    },
    speed: 2,
    runSpeed: 4,
    attackRange: 1.8,
    attackCooldown: 2.0,
    attackDamage: 5,
    chaseRange: 0,
    scale: 0.5,
}

// -----------------------------------------------------------
//  ENEMIES
// -----------------------------------------------------------
export const ENEMY_CONFIG = {
    Skeleton: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            death: 'Death',
        },
        speed: 3,
        runSpeed: 5,
        attackRange: 2.0,
        attackCooldown: 1.5,
        attackDamage: 10,
        chaseRange: 20,
        maxHealth: 5,
        scale: 0.8,
    },
    Skeleton_Armor: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            death: 'Death',
        },
        speed: 2.5,
        runSpeed: 4,
        attackRange: 2.0,
        attackCooldown: 2.0,
        attackDamage: 15,
        chaseRange: 20,
        maxHealth: 10,
        scale: 0.85,
    },
    Hedgehog: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            death: 'Death',
        },
        speed: 3,
        runSpeed: 5,
        attackRange: 1.5,
        attackCooldown: 1.0,
        attackDamage: 8,
        chaseRange: 15,
        maxHealth: 3,
        scale: 0.6,
    },
    Giant: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            death: 'Death',
        },
        speed: 2,
        runSpeed: 3.5,
        attackRange: 3.0,     // Giants have longer reach
        attackCooldown: 2.5,
        attackDamage: 25,
        chaseRange: 25,
        maxHealth: 20,
        scale: 1.5,
    },
    Zombie: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            death: 'Death',
        },
        speed: 1.5,
        runSpeed: 2.5,
        attackRange: 2.0,
        attackCooldown: 2.0,
        attackDamage: 12,
        chaseRange: 20,
        maxHealth: 7,
        scale: 0.8,
    },
    Demon: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            death: 'Death',
        },
        speed: 4,
        runSpeed: 7,
        attackRange: 2.5,
        attackCooldown: 1.0,
        attackDamage: 20,
        chaseRange: 25,
        maxHealth: 10,
        scale: 1.0,
    },
    Goblin: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            death: 'Death',
        },
        speed: 4,
        runSpeed: 6,
        attackRange: 1.8,
        attackCooldown: 1.0,
        attackDamage: 8,
        chaseRange: 20,
        maxHealth: 5,
        scale: 0.6,
    },
    Yeti: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            death: 'Death',
        },
        speed: 2.5,
        runSpeed: 4,
        attackRange: 3.0,
        attackCooldown: 2.5,
        attackDamage: 30,
        chaseRange: 25,
        maxHealth: 20,
        scale: 1.3,
    },
    Wizard: {
        animations: {
            walk: 'Walk',
            run: 'Run',
            idle: 'Idle',
            attack: 'Attack',
            death: 'Death',
        },
        speed: 2,
        runSpeed: 3.5,
        attackRange: 8.0,  // Wizard attacks from distance
        attackCooldown: 2.0,
        attackDamage: 18,
        chaseRange: 30,
        maxHealth: 6,
        scale: 0.9,
    },
}

// Fallback config used when enemy type is not in ENEMY_CONFIG
export const DEFAULT_ENEMY_CONFIG = {
    animations: {
        walk: 'Walk',
        run: 'Run',
        idle: 'Idle',
        attack: 'Attack',
        death: 'Death',
    },
    speed: 3,
    runSpeed: 5,
    attackRange: 2.0,
    attackCooldown: 1.5,
    attackDamage: 10,
    chaseRange: 20,
    maxHealth: 5,
    scale: 0.8,
}

/**
 * Resolve an animation name for an entity, with fallback.
 * Usage: getAnimation(ANIMAL_CONFIG, 'Wolf', 'walk')
 */
export const getAnimation = (config, type, action) => {
    const entityConfig = config[type]
    if (!entityConfig) return action // fallback to action name directly
    return entityConfig.animations[action] || action
}
