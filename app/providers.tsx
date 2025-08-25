"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { zenchainTestnet } from "../chains/zenchain.ts";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "3fd3eb008240501f6fe4a55a8ec1300c";

const config = getDefaultConfig({
  appName: "ZenChain Staking dApp",
  projectId,
  chains: [zenchainTestnet],
  transports: {
    [zenchainTestnet.id]: http(process.env.NEXT_PUBLIC_ZENCHAIN_RPC_HTTP || "https://zenchain-testnet.api.onfinality.io/public")
  },
  ssr: true
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
