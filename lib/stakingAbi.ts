import type { Abi } from "viem";

export const NATIVE_STAKING = "0x0000000000000000000000000000000000000800";

export const nativeStakingAbi = [
  {
    type: "function",
    name: "currentEra",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint32" }]
  }
] as const satisfies Abi;
