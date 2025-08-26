"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from "wagmi";
import type { Address } from "viem";
import { parseUnits } from "viem";
import {
  NATIVE_STAKING,
  FAST_UNSTAKE,
  nativeStakingAbi,
  fastUnstakeAbi,
  RewardDestination
} from "../lib/stakingAbi";
import { useEffect, useMemo, useState } from "react";

function useTx(hash?: `0x${string}`) {
  const { data: receipt, isLoading } = useWaitForTransactionReceipt({ hash, confirmations: 1 });
  return { mined: Boolean(receipt), isLoading };
}

export default function Page() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address, query: { enabled: !!address } });

  // reads
  const { data: currentEra } = useReadContract({
    address: NATIVE_STAKING,
    abi: nativeStakingAbi,
    functionName: "currentEra"
  });

  // writes
  const { writeContractAsync } = useWriteContract();

  // tx state
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

  const bondAmtWei  = useMemo(() => bondAmt  ? parseUnits(bondAmt, 18)  : BigInt(0), [bondAmt]);
  const extraAmtWei = useMemo(() => extra    ? parseUnits(extra, 18)    : BigInt(0), [extra]);
  const unbondWei   = useMemo(() => unbondAmt? parseUnits(unbondAmt,18) : BigInt(0), [unbondAmt]);
  async function callNative(fn: any, args: any[] = []) {
    const hash = await writeContractAsync({ address: NATIVE_STAKING, abi: nativeStakingAbi, functionName: fn, args });
    setPendingHash(hash);
  }
  async function callFast(fn: any, args: any[] = []) {
    const hash = await writeContractAsync({ address: FAST_UNSTAKE, abi: fastUnstakeAbi, functionName: fn, args });
    setPendingHash(hash);
  }

  function pctToPerbill(pct: number) {
    // perbill = pct * 1e9 / 100
    return BigInt(Math.round(pct * 1e7));
  }

  return (
    <main className="container">
      <h1>ZenChain Staking dApp</h1>
      <p className="muted">Stake ZTC on ZenChain Testnet via precompiles.</p>

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <ConnectButton />
          <div>
            <div className="small muted">Chain ID: {chainId ?? "—"}</div>
            <div className="small">Address: {address ?? "—"}</div>
            <div className="small">Balance: {balance ? `${balance.formatted} ${balance.symbol}` : "—"}</div>
            <div className="small">currentEra: {currentEra !== undefined ? Number(currentEra) : "—"}</div>
          </div>
        </div>
        {pendingHash && (
          <>
            <hr />
            <div className="small">
              Tx: <a href={`https://zentrace.io/tx/${pendingHash}`} target="_blank" rel="noreferrer">{pendingHash}</a>
              {" "}{waiting ? "(waiting…)" : "(mined ✓)"}
            </div>
          </>
        )}
      </div>

      {/* BOND */}
      <div className="grid">
        <div className="card">
          <h3>Bond (stake) with destination</h3>
          <label>Amount (ZTC)</label>
          <input value={bondAmt} onChange={e=>setBondAmt(e.target.value)} placeholder="e.g. 100" />
          <label>Reward destination</label>
          <select value={dest} onChange={e=>setDest(e.target.value)}>
            <option value={RewardDestination.Staked}>Restake (compound)</option>
            <option value={RewardDestination.Stash}>Send to me (stash)</option>
            <option value={RewardDestination.None}>No rewards</option>
          </select>
          <div className="row" style={{ marginTop: ".6rem" }}>
            <button disabled={!isConnected || !bondAmtWei} onClick={async () => {
              await callNative("bondWithRewardDestination", [bondAmtWei, Number(dest)]);
            }}>Bond + set destination</button>
          </div>
          <p className="muted small">
            Calls <code>bondWithRewardDestination(value,dest)</code>. Precompile: {NATIVE_STAKING}
          </p>
        </div>

        <div className="card">
          <h3>Bond to custom payee</h3>
          <label>Amount (ZTC)</label>
          <input placeholder="e.g. 50" onChange={(e)=>setBondAmt(e.target.value)} />
          <label>Payee address</label>
          <input placeholder="0x..." value={payee} onChange={(e)=>setPayee(e.target.value)} />
          <div className="row" style={{ marginTop: ".6rem" }}>
            <button disabled={!isConnected || !bondAmt} onClick={async ()=>{
              await callNative("bondWithPayeeAddress", [parseUnits(bondAmt || "0", 18), payee as Address]);
            }}>Bond to payee</button>
          </div>
        </div>
      </div>

      {/* VALIDATE / NOMINATE */}
      <div className="grid">
        <div className="card">
          <h3>Validate</h3>
          <label>Commission (%)</label>
          <input placeholder="e.g. 10" value={commissionPct} onChange={e=>setCommissionPct(e.target.value)} />
          <label>Block nominations?</label>
          <select value={blocked} onChange={e=>setBlocked(e.target.value)}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
          <div className="row" style={{ marginTop: ".6rem" }}>
            <button disabled={!isConnected} onClick={async ()=>{
              const pct = parseFloat(commissionPct || "0");
              const perbill = pctToPerbill(isFinite(pct) ? pct : 0);
              await callNative("validate", [perbill, blocked === "true"]);
            }}>validate()</button>
          </div>
        </div>

        <div className="card">
          <h3>Nominate</h3>
          <label>Validator addresses (comma separated)</label>
          <input placeholder="0xabc...,0xdef..." value={nominees} onChange={e=>setNominees(e.target.value)} />
          <div className="row" style={{ marginTop: ".6rem" }}>
            <button disabled={!isConnected} onClick={async ()=>{
              const targets = nominees.split(",").map(s=>s.trim()).filter(Boolean) as Address[];
              await callNative("nominate", [targets]);
            }}>nominate()</button>
          </div>
          <p className="muted small">Tip: batasi sesuai batas maksimal kandidat per panggilan.</p>
        </div>
      </div>

      {/* INCREASE / UNBOND */}
      <div className="grid">
        <div className="card">
          <h3>Bond Extra</h3>
          <label>Additional amount (ZTC)</label>
          <input placeholder="e.g. 25" value={extra} onChange={e=>setExtra(e.target.value)} />
          <div className="row" style={{ marginTop: ".6rem" }}>
            <button disabled={!isConnected || !extraAmtWei} onClick={async ()=>{
              await callNative("bondExtra", [extraAmtWei]);
            }}>bondExtra()</button>
          </div>
        </div>

        <div className="card">
          <h3>Unstake (regular)</h3>
          <label>Amount to unbond (ZTC)</label>
          <input placeholder="e.g. 100" value={unbondAmt} onChange={e=>setUnbondAmt(e.target.value)} />
          <div className="row" style={{ marginTop: ".6rem" }}>
            <button disabled={!isConnected} onClick={async ()=>{ await callNative("chill"); }}>chill()</button>
            <button disabled={!isConnected || !unbondWei} onClick={async ()=>{
              await callNative("unbond", [unbondWei]);
            }}>unbond()</button>
          </div>
          <p className="muted small">Unbonding butuh beberapa era sebelum bisa withdraw.</p>
        </div>
      </div>

      {/* WITHDRAW / FAST UNSTAKE / PAYOUT */}
      <div className="grid">
        <div className="card">
          <h3>Withdraw Unbonded</h3>
          <div className="row" style={{ marginTop: ".6rem" }}>
            <button disabled={!isConnected} onClick={async ()=>{
              // read historyDepth as required param
              const hd = await (window as any).wagmi?.config.getClient().readContract({
                address: NATIVE_STAKING,
                abi: nativeStakingAbi,
                functionName: "historyDepth"
              }) as bigint;
              const n = Number(hd ?? 84);
              await callNative("withdrawUnbonded", [n]);
            }}>withdrawUnbonded()</button>
          </div>
        </div>

        <div className="card">
          <h3>Fast Unstake</h3>
          <div className="row" style={{ marginTop: ".6rem" }}>
            <button disabled={!isConnected} onClick={async ()=>{ await callFast("registerFastUnstake"); }}>
              registerFastUnstake()
            </button>
            <button disabled={!isConnected} onClick={async ()=>{ await callFast("deregister"); }}>
              deregister()
            </button>
          </div>
          <p className="muted small">Syarat: tidak terekspos selama 2 era; deposit kecil direfund saat sukses.</p>
        </div>
      </div>

      <div className="card">
        <h3>Payout Rewards (by page)</h3>
        <label>Validator stash</label>
        <input placeholder="0x..." value={payoutStash} onChange={e=>setPayoutStash(e.target.value)} />
        <label>Era</label>
        <input placeholder="e.g. 42" value={payoutEra} onChange={e=>setPayoutEra(e.target.value)} />
        <label>Page</label>
        <input placeholder="0" value={payoutPage} onChange={e=>setPayoutPage(e.target.value)} />
        <div className="row" style={{ marginTop: ".6rem" }}>
          <button disabled={!isConnected} onClick={async ()=>{
            const era  = Number(payoutEra || "0");
            const page = Number(payoutPage || "0");
            await callNative("payoutStakersByPage", [payoutStash as Address, era, page]);
          }}>payoutStakersByPage()</button>
        </div>
        <p className="muted small">Satu page biasanya memuat puluhan nominators (mis. 64).</p>
      </div>
    </main>
  );
    }
