import type { Abi } from "viem";

export const NATIVE_STAKING = "0x0000000000000000000000000000000000000800";
export const FAST_UNSTAKE  = "0x0000000000000000000000000000000000000801";

export const nativeStakingAbi = [
  { type: "function", stateMutability: "view",  name: "currentEra",   inputs: [], outputs: [{ type: "uint32" }] },
  { type: "function", stateMutability: "view",  name: "historyDepth", inputs: [], outputs: [{ type: "uint32" }] },

  { type: "function", stateMutability: "nonpayable", name: "bondWithRewardDestination", inputs: [
    { name: "value", type: "uint256" }, { name: "dest", type: "uint8" }
  ], outputs: [] },

  { type: "function", stateMutability: "nonpayable", name: "bondWithPayeeAddress", inputs: [
    { name: "value", type: "uint256" }, { name: "payee", type: "address" }
  ], outputs: [] },

  { type: "function", stateMutability: "nonpayable", name: "bondExtra", inputs: [
    { name: "value", type: "uint256" }
  ], outputs: [] },

  { type: "function", stateMutability: "nonpayable", name: "validate", inputs: [
    { name: "commission", type: "uint32" }, { name: "blocked", type: "bool" }
  ], outputs: [] },

  { type: "function", stateMutability: "nonpayable", name: "nominate", inputs: [
    { name: "targets", type: "address[]" }
  ], outputs: [] },

  { type: "function", stateMutability: "nonpayable", name: "chill", inputs: [], outputs: [] },

  { type: "function", stateMutability: "nonpayable", name: "unbond", inputs: [
    { name: "value", type: "uint256" }
  ], outputs: [] },

  { type: "function", stateMutability: "nonpayable", name: "rebond", inputs: [
    { name: "value", type: "uint256" }
  ], outputs: [] },

  { type: "function", stateMutability: "nonpayable", name: "withdrawUnbonded", inputs: [
    { name: "numSlashingSpans", type: "uint32" }
  ], outputs: [] },

  { type: "function", stateMutability: "nonpayable", name: "payoutStakersByPage", inputs: [
    { name: "validatorStash", type: "address" },
    { name: "era",            type: "uint32"  },
    { name: "page",           type: "uint32"  }
  ], outputs: [] },
] as const satisfies Abi;

export const fastUnstakeAbi = [
  { type: "function", stateMutability: "nonpayable", name: "registerFastUnstake", inputs: [], outputs: [] },
  { type: "function", stateMutability: "nonpayable", name: "deregister",          inputs: [], outputs: [] }
] as const satisfies Abi;

export enum RewardDestination {
  Staked = 0,
  Stash  = 1,
  None   = 2
}
