import { useMemo, type ReactNode } from "react";
import {
    ConnectionProvider,
    WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

// Devnet RPC endpoint
const DEVNET_ENDPOINT = "https://devnet.helius-rpc.com/?api-key=9ca29b35-645b-47ec-8787-af25bc43be2c";

interface WalletProviderProps {
    children: ReactNode;
}

/**
 * Wallet Provider that wraps the Solana wallet adapter providers.
 * Configured for Devnet by default.
 */
export function WalletProvider({ children }: WalletProviderProps) {
    // Use a stable public WebSocket endpoint for Devnet
    const DEVNET_WS_ENDPOINT = "wss://api.devnet.solana.com";

    const config = useMemo(
        () => ({
            wsEndpoint: DEVNET_WS_ENDPOINT,
            commitment: "confirmed" as const,
        }),
        []
    );

    return (
        <ConnectionProvider endpoint={DEVNET_ENDPOINT} config={config}>
            <SolanaWalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </SolanaWalletProvider>
        </ConnectionProvider>
    );
}
