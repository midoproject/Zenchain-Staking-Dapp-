import type { Chain } from "wagmi/chains";

export const zenchainTestnet: Chain = {
  id: 8408,
  name: "ZenChain Testnet",
  nativeCurrency: { name: "ZenChain Token", symbol: "ZTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ZENCHAIN_RPC_HTTP || "https://zenchain-testnet.api.onfinality.io/public"],
      webSocket: ["wss://zenchain-testnet.api.onfinality.io/public-ws"],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_ZENCHAIN_RPC_HTTP || "https://zenchain-testnet.api.onfinality.io/public"],
      webSocket: ["wss://zenchain-testnet.api.onfinality.io/public-ws"],
    },
  },
  blockExplorers: {
    default: { name: "ZenTrace", url: "https://zentrace.io" },
  },
  testnet: true,
};
