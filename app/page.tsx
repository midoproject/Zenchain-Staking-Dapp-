"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import type { Address } from "viem";
import { parseUnits } from "viem";
import {
  NATIVE_STAKING,
  FAST_UNSTAKE,
  nativeStakingAbi,
  fastUnstakeAbi,
  RewardDestination,
} from "../lib/stakingAbi";

/** Helper: track tx mining */
function useTx(hash?: `0x${string}`) {
  const { data: receipt, isLoading } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
  });
  return { mined: Boolean(receipt), isLoading };
}

export default function Page() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address,
    query: { enabled: !!address },
  });

  // --- reads from precompile
  const { data: currentEra } = useReadContract({
    address: NATIVE_STAKING,
    abi: nativeStakingAbi,
    functionName: "currentEra",
  });

  const { data: historyDepth } = useReadContract({
    address: NATIVE_STAKING,
    abi: nativeStakingAbi,
    functionName: "historyDepth",
  });

  // --- write
  const { writeContractAsync } = useWriteContract();

  // --- tx state
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>();
  const { mined, isLoading: waiting } = useTx(pendingHash);
  useEffect(() => {
    if (mined) setPendingHash(undefined);
  }, [mined]);

  // --- inputs
  const [bondAmt, setBondAmt] = useState("");
  const [payee, setPayee] = useState("");
  const [extra, setExtra] = useState("");
  const [unbondAmt, setUnbondAmt] = useState("");
  const [commissionPct, setCommissionPct] = useState("");
  const [blocked, setBlocked] = useState("false");
  const [nominees, setNominees] = useState("");
  const [payoutStash, setPayoutStash] = useState("");
  const [payoutEra, setPayoutEra] = useState("");
  const [payoutPage, setPayoutPage] = useState("0");
  const [dest, setDest] = useState(String(RewardDestination.Staked));

  // --- parsed amounts (tanpa BigInt literal 0n -> pakai BigInt(0))
  const bondAmtWei = useMemo(
    () => (bondAmt ? parseUnits(bondAmt, 18) : BigInt(0)),
    [bondAmt]
  );
  const extraAmtWei = useMemo(
    () => (extra ? parseUnits(extra, 18) : BigInt(0)),
    [extra]
  );
  const unbondWei = useMemo(
    () => (unbondAmt ? parseUnits(unbondAmt, 18) : BigInt(0)),
    [unbondAmt]
  );

  // --- helpers
  async function callNative(functionName         
