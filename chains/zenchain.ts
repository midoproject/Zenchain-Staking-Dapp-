import { defineChain } from "viem";

export const zenchainTestnet = defineChain({
  id: 8408,
  name: "ZenChain Testnet",
  nativeCurrency: { name: "ZTC", symbol: "ZTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://zenchain-testnet.api.onfinality.io/public"],
      webSocket: ["wss://zenchain-testnet.api.onfinality.io/public-ws"]
    },
    public: {
      http: ["https://zenchain-testnet.api.onfinality.io/public"],
      webSocket: ["wss://zenchain-testnet.api.onfinality.io/public-ws"]
    }
  },
  blockExplorers: {
    default: { name: "ZenTrace", url: "https://zentrace.io" }
  },
  testnet: true
});
