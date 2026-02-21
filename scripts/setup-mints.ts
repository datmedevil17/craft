import * as anchor from "@coral-xyz/anchor";
import {
    createMint,
    setAuthority,
    AuthorityType
} from "@solana/spl-token";
import {
    Connection,
    Keypair,
    PublicKey
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

async function main() {
    // 1. Setup connection and wallet
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const walletPath = path.join(process.env.HOME || "", ".config/solana/id.json");
    const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
    const payer = Keypair.fromSecretKey(new Uint8Array(secretKey));

    console.log("Payer:", payer.publicKey.toBase58());

    // 2. Derive Program PDA for Mint Authority
    const PROGRAM_ID = new PublicKey("A8qoTZrfzgBCPADBwGQJxva9ymsUkYEnSXXtUik7HvoQ");
    const [mintAuthorityPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_authority")],
        PROGRAM_ID
    );
    console.log("Program Mint Authority PDA:", mintAuthorityPDA.toBase58());

    const animals = [
        "Chick", "Chicken", "Pig", "Sheep", "Horse",
        "Wolf", "Dog", "Cat", "Raccoon"
    ];

    const results: Record<string, string> = {};

    for (const animal of animals) {
        console.log(`\nSetting up mint for ${animal}...`);

        // Create Mint
        const mint = await createMint(
            connection,
            payer,
            payer.publicKey, // Temporary mint authority
            payer.publicKey, // Freeze authority
            0 // 0 decimals for NFTs (or tokens)
        );
        console.log(`Mint created: ${mint.toBase58()}`);

        // Transfer Authority to Program PDA
        await setAuthority(
            connection,
            payer,
            mint,
            payer.publicKey,
            AuthorityType.MintTokens,
            mintAuthorityPDA
        );
        console.log(`Mint authority transferred to ${mintAuthorityPDA.toBase58()}`);

        results[animal] = mint.toBase58();
    }

    console.log("\nSetup Complete!");
    console.log("Please update ENTITY_MINTS in web/src/MintConfig.js with these addresses:");
    console.log(JSON.stringify(results, null, 2));

    // Save results to a temporary file for easy reference
    fs.writeFileSync("animal_mints.json", JSON.stringify(results, null, 2));
}

main().catch(console.error);
