import { PublicKey } from "@solana/web3.js";

/**
 * NFT Mint Addresses for Entities
 * 
 * Replace these placeholder strings with actual character-specific mint addresses.
 * The program will use these to mint NFTs on settlement.
 */
export const ENTITY_MINTS = {
    // Animals
    Chick: new PublicKey("HZTtHpcpEVgKft2SBgszyCg77VgDkk2a2EgBgaadw14T"),
    Chicken: new PublicKey("3JB7qTsdowpwwZBTNap54WxWVPVUpUJy8H3gukug95mT"),
    Pig: new PublicKey("9e18USgCkVRWcv7EUBry7qtKrCNFepJSUXbhzWMB5dpg"),
    Sheep: new PublicKey("DG5AoobZzUqYNaAC1WG5wHiNAZ7FyvJ8x6ofSdn2xsWe"),
    Horse: new PublicKey("3J122qJyaNKgBxfaDRCLUbKqNWhtsY5PZU2TdR4Uekaw"),
    Wolf: new PublicKey("8sKuhPtBFoee2WuRar3w33zR4SrXewa1mDyacrzi49zz"),
    Dog: new PublicKey("7YPvPEa2t6n1fVve2L9zApvtYbJnMgSNQZgxS8Si8JFG"),
    Cat: new PublicKey("9gVKcxV91q31zhUTabw7KUpDQmtRsgg5FTAfFHBKFaL7"),
    Raccoon: new PublicKey("CeBhYoS8beZijBH9nMUWdcsgvP69fFQTZHJWphrZwcoW"),

    // Enemies / Bosses (Placeholders)
    Skeleton: new PublicKey("11111111111111111111111111111111"),
    Skeleton_Armor: new PublicKey("11111111111111111111111111111111"),
    Hedgehog: new PublicKey("11111111111111111111111111111111"),
    Giant: new PublicKey("11111111111111111111111111111111"),
    Zombie: new PublicKey("11111111111111111111111111111111"),
    Demon: new PublicKey("11111111111111111111111111111111"),
    Goblin: new PublicKey("11111111111111111111111111111111"),
    Yeti: new PublicKey("11111111111111111111111111111111"),
    Wizard: new PublicKey("11111111111111111111111111111111"),
};
