"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { zenchainTestnet } from "../chains/zenchain";

// WalletConnect Project ID (hardcode sesuai permintaan)
const WALLETCONNECT_PROJECT_ID = "3fd3eb008240501f6fe4a55a8ec1300c";

const config = getDefaultConfig({
  appName: "ZenChain Staking dApp",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [zenchainTestnet],
  transports: {
    [zenchainTestnet.id]: http(zenchainTestnet.rpcUrls.default.http[0]!),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
