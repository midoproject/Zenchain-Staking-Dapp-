"use client";

import Image from "next/image";
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

function useTx(hash?: `0x${string}`) {
  const { data: receipt, isLoading } = useWaitForTransactionReceipt({ hash, confirmations: 1 });
  return { mined: Boolean(receipt), isLoading };
}

export default function Page() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address, query: { enabled: !!address } });

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

  const { writeContractAsync } = useWriteContract();
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>();
  const { mined, isLoading: waiting } = useTx(pendingHash);
  useEffect(() => { if (mined) setPendingHash(undefined); }, [mined]);

  // inputs
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

  // parsed amounts (tanpa 0n)
  const bondAmtWei = useMemo(() => (bondAmt ? parseUnits(bondAmt, 18) : BigInt(0)), [bondAmt]);
  const extraAmtWei = useMemo(() => (extra ? parseUnits(extra, 18) : BigInt(0)), [extra]);
  const unbondWei  = useMemo(() => (unbondAmt ? parseUnits(unbondAmt, 18) : BigInt(0)), [unbondAmt]);

  // helpers
  function pctToPerbill(pct: number) { return BigInt(Math.round(pct * 1e7)); }
  async function callNative(functionName: string, args?: readonly unknown[]) {
    const cfg: any = { address: NATIVE_STAKING, abi: nativeStakingAbi, functionName: functionName as any };
    if (args && args.length > 0) cfg.args = args as any;
    const hash = await writeContractAsync(cfg); setPendingHash(hash);
  }
  async function callFast(functionName: string, args?: readonly unknown[]) {
    const cfg: any = { address: FAST_UNSTAKE, abi: fastUnstakeAbi, functionName: functionName as any };
    if (args && args.length > 0) cfg.args = args as any;
    const hash = await writeContractAsync(cfg); setPendingHash(hash);
  }

  return (
    <main className="container">
      {/* header */}
      <div className="header">
        <div className="brand">
          <Image src="/zenchain logo.png" alt="ZenChain" width={36} height={36} priority />
          <div>
            <div className="title">ZenChain Staking dApp</div>
            <div className="subtitle">Stake ZTC on ZenChain Testnet via precompiles.</div>
          </div>
        </div>
        <div className="by">BY <strong>MIDO</strong></div>
      </div>

      {/* info */}
      <div className="infobar">
        <ConnectButton />
        <div className="stats">
          <div className="stat">Chain ID<br/><b>{chainId ?? "—"}</b></div>
          <div className="stat">Address<br/><b>{address ?? "—"}</b></div>
          <div className="stat">Balance<br/><b>{balance ? `${balance.formatted} ${balance.symbol}` : "—"}</b></div>
        </div>
        <div className="stats">
          <div className="stat">currentEra<br/><b>{currentEra !== undefined ? Number(currentEra) : "—"}</b></div>
          <div className="stat">historyDepth<br/><b>{historyDepth !== undefined ? Number(historyDepth) : "—"}</b></div>
          <div className="stat">Precompile<br/><b>0x…0800 / 0x…0801</b></div>
        </div>
      </div>

      {pendingHash && (
        <>
          <hr className="sep"/>
          <div className="tx">
            Tx:{" "}
            <a href={`https://zentrace.io/tx/${pendingHash}`} target="_blank" rel="noreferrer">
              {pendingHash}
            </a>{" "}
            {waiting ? "(waiting…)" : "(mined ✓)"}
          </div>
        </>
      )}

      {/* rows */}
      <div className="grid two">
        <div className="card">
          <h3>Bond (stake) with destination</h3>
          <label>Amount (ZTC)</label>
          <input value={bondAmt} onChange={(e)=>setBondAmt(e.target.value)} placeholder="e.g. 100" />
          <label>Reward destination</label>
          <select value={dest} onChange={(e)=>setDest(e.target.value)}>
            <option value={RewardDestination.Staked}>Restake (compound)</option>
            <option value={RewardDestination.Stash}>Send to me (stash)</option>
            <option value={RewardDestination.None}>No rewards</option>
          </select>
          <div className="actions">
            <button className="btn primary" disabled={!isConnected || bondAmtWei===BigInt(0)}
              onClick={async()=>{ await callNative("bondWithRewardDestination", [bondAmtWei, Number(dest)]); }}>
              Bond + set destination
            </button>
          </div>
          <p className="meta">Calls <code>bondWithRewardDestination(value,dest)</code>. Precompile: {NATIVE_STAKING}</p>
        </div>

        <div className="card">
          <h3>Bond to custom payee</h3>
          <label>Amount (ZTC)</label>
          <input value={bondAmt} onChange={(e)=>setBondAmt(e.target.value)} placeholder="e.g. 50" />
          <label>Payee address</label>
          <input value={payee} onChange={(e)=>setPayee(e.target.value)} placeholder="0x..." />
          <div className="actions">
            <button className="btn" disabled={!isConnected || !bondAmt}
              onClick={async()=>{ await callNative("bondWithPayeeAddress", [parseUnits(bondAmt||"0",18), payee as Address]); }}>
              Bond to payee
            </button>
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Validate</h3>
          <label>Commission (%)</label>
          <input value={commissionPct} onChange={(e)=>setCommissionPct(e.target.value)} placeholder="e.g. 10" />
          <label>Block nominations?</label>
          <select value={blocked} onChange={(e)=>setBlocked(e.target.value)}>
            <option value="false">No</option><option value="true">Yes</option>
          </select>
          <div className="actions">
            <button className="btn" disabled={!isConnected}
              onClick={async()=>{const pct=parseFloat(commissionPct||"0"); const perbill=pctToPerbill(isFinite(pct)?pct:0); await callNative("validate",[perbill, blocked==="true"]);}}>
              validate()
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Nominate</h3>
          <label>Validator addresses (comma separated)</label>
          <input value={nominees} onChange={(e)=>setNominees(e.target.value)} placeholder="0xabc...,0xdef..." />
          <div className="actions">
            <button className="btn" disabled={!isConnected}
              onClick={async()=>{const targets=nominees.split(",").map(s=>s.trim()).filter(Boolean) as Address[]; await callNative("nominate",[targets]);}}>
              nominate()
            </button>
          </div>
          <p className="meta">Tip: batasi jumlah validator sesuai limit chain per panggilan.</p>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Bond Extra</h3>
          <label>Additional amount (ZTC)</label>
          <input value={extra} onChange={(e)=>setExtra(e.target.value)} placeholder="e.g. 25" />
          <div className="actions">
            <button className="btn" disabled={!isConnected || extraAmtWei===BigInt(0)}
              onClick={async()=>{ await callNative("bondExtra",[extraAmtWei]); }}>
              bondExtra()
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Unstake (regular)</h3>
          <label>Amount to unbond (ZTC)</label>
          <input value={unbondAmt} onChange={(e)=>setUnbondAmt(e.target.value)} placeholder="e.g. 100" />
          <div className="actions">
            <button className="btn" disabled={!isConnected} onClick={async()=>{ await callNative("chill"); }}>chill()</button>
            <button className="btn" disabled={!isConnected || unbondWei===BigInt(0)}
              onClick={async()=>{ await callNative("unbond",[unbondWei]); }}>
              unbond()
            </button>
          </div>
          <p className="meta">Unbonding butuh beberapa era sebelum bisa withdrawal.</p>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Withdraw Unbonded</h3>
          <div className="actions">
            <button className="btn" disabled={!isConnected}
              onClick={async()=>{ const spans=Number(historyDepth ?? 84); await callNative("withdrawUnbonded",[spans]); }}>
              withdrawUnbonded()
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Fast Unstake</h3>
          <div className="actions">
            <button className="btn" disabled={!isConnected} onClick={async()=>{ await callFast("registerFastUnstake"); }}>registerFastUnstake()</button>
            <button className="btn" disabled={!isConnected} onClick={async()=>{ await callFast("deregister"); }}>deregister()</button>
          </div>
          <p className="meta">Syarat: tidak terekspos selama 2 era; deposit kecil direfund saat sukses.</p>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Payout Rewards (by page)</h3>
          <label>Validator stash</label>
          <input value={payoutStash} onChange={(e)=>setPayoutStash(e.target.value)} placeholder="0x..." />
          <label>Era</label>
          <input value={payoutEra} onChange={(e)=>setPayoutEra(e.target.value)} placeholder="e.g. 42" />
          <label>Page</label>
          <input value={payoutPage} onChange={(e)=>setPayoutPage(e.target.value)} placeholder="0" />
          <div className="actions">
            <button className="btn" disabled={!isConnected}
              onClick={async()=>{ const era=Number(payoutEra||"0"); const page=Number(payoutPage||"0"); await callNative("payoutStakersByPage",[payoutStash as Address, era, page]); }}>
              payoutStakersByPage()
            </button>
          </div>
          <p className="meta">Satu page biasanya memuat puluhan nominators (mis. 64).</p>
        </div>
      </div>
    </main>
  );
                                                                                                               }
