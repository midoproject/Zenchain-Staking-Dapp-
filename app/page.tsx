"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useChainId } from "wagmi";
// ✅ pakai path relatif
import { NATIVE_STAKING } from "../lib/stakingAbi";

export default function Page() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });

  return (
    <main className="container">
      <h1>ZenChain Staking dApp</h1>
      <ConnectButton />

      <div style={{ marginTop: "2rem" }}>
        <p>Connected: {address ?? "—"}</p>
        <p>Chain ID: {chainId}</p>
        <p>Balance: {balance ? `${balance.formatted} ${balance.symbol}` : "—"}</p>
        <p>Staking precompile: {NATIVE_STAKING}</p>
      </div>
    </main>
  );
}
