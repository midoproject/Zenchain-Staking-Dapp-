import type { Abi } from "viem";

/** Precompiled contracts on ZenChain */
export const NATIVE_STAKING = "0x0000000000000000000000000000000000000800";
export const FAST_UNSTAKE  = "0x0000000000000000000000000000000000000801";

/**
 * Subset ABI methods used by the UI.
 * Types use uint256/bool/address/uint32 for safety on EVM side.
 */
export const nativeStakingAbi = [
  // views
  { type: "function", stateMutability: "view",  name: "currentEra",    inputs: [], outputs: [{ type: "uint32" }] },
  { type: "function", stateMutability: "view",  name: "historyDepth",  inputs: [], outputs: [{ type: "uint32" }] },

  // staking
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

  // payout
  { type: "function", stateMutability: "nonpayable", name: "payoutStakersByPage", inputs: [
    { name: "validatorStash", type: "address" },
    { name: "era",            type: "uint32"  },
    { name: "page",           type: "uint32"  }
  ], outputs: [] },

  // (opsional) set destinations jika tersedia di precompile kamu:
  // { type: "function", stateMutability: "nonpayable", name: "setRewardDestination", inputs: [{ name: "dest", type: "uint8" }], outputs: [] },
  // { type: "function", stateMutability: "nonpayable", name: "setPayee", inputs: [{ name: "payee", type: "address" }], outputs: [] },
] as const satisfies Abi;

export const fastUnstakeAbi = [
  { type: "function", stateMutability: "nonpayable", name: "registerFastUnstake", inputs: [], outputs: [] },
  { type: "function", stateMutability: "nonpayable", name: "deregister",          inputs: [], outputs: [] }
] as const satisfies Abi;

export enum RewardDestination {
  Staked = 0, // restake rewards (compound)
  Stash  = 1, // send rewards to stash
  None   = 2  // drop rewards
  }
