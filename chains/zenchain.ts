import { defineChain } from "viem";

/** ZenChain Testnet network info (docs list Chain ID 8408 & OnFinality RPC) */
export const zenchainTestnet = defineChain({
  id: 8408,
  name: "ZenChain Testnet",
  nativeCurrency: { name: "ZTC", symbol: "ZTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ZENCHAIN_RPC_HTTP || "https://zenchain-testnet.api.onfinality.io/public"],
      webSocket: ["wss://zenchain-testnet.api.onfinality.io/public-ws"]
    },
    public: {
      http: [process.env.NEXT_PUBLIC_ZENCHAIN_RPC_HTTP || "https://zenchain-testnet.api.onfinality.io/public"],
      webSocket: ["wss://zenchain-testnet.api.onfinality.io/public-ws"]
    }
  },
  blockExplorers: {
    default: { name: "ZenTrace", url: "https://zentrace.io" }
  },
  testnet: true
});
