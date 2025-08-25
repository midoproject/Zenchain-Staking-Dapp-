"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { Address } from "viem";
import { parseUnits } from "viem";
import { NATIVE_STAKING, FAST_UNSTAKE, nativeStakingAbi, fastUnstakeAbi, RewardDestination } from "@/lib/stakingAbi";
import { useEffect, useMemo, useState } from "react";

function useTxHash(txHash?: `0x${string}`) {
  const { data: receipt, isLoading } = useWaitForTransactionReceipt({ hash: txHash, confirmations: 1 });
  return { mined: !!receipt, isLoading };
}

export default function Page() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { data: balance } = useBalance({ address, query: { enabled: !!address } });
  const { data: currentEra } = useReadContract({ address: NATIVE_STAKING, abi: nativeStakingAbi, functionName: "currentEra" });

  const { writeContractAsync } = useWriteContract();

  // simple tx state
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>();
  const { mined, isLoading: waiting } = useTxHash(pendingHash);
  useEffect(() => { if (mined) setPendingHash(undefined); }, [mined]);

  const [amount, setAmount] = useState("");
  const amountWei = useMemo(() => amount ? parseUnits(amount, 18) : 0n, [amount]);

  async function callNative(fn: any, args: any[] = []) {
    const hash = await writeContractAsync({ address: NATIVE_STAKING, abi: nativeStakingAbi, functionName: fn, args });
    setPendingHash(hash);
  }
  async function callFast(fn: any, args: any[] = []) {
    const hash = await writeContractAsync({ address: FAST_UNSTAKE, abi: fastUnstakeAbi, functionName: fn, args });
    setPendingHash(hash);
  }

  // helpers
  function percentToPerbill(pct: number) {
    // perbill = pct * 1e9 / 100
    return BigInt(Math.round(pct * 1e7));
  }

  return (
    <main className="container">
      <h1>ZenChain Staking dApp</h1>
      <p className="muted small">Connect wallet, stake ZTC, nominate/validate, unbond & withdraw on <b>ZenChain Testnet</b>.</p>

      <div className="card">
        <div className="row" style={{justifyContent:"space-between"}}>
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
            <div className="small">Tx sent: <a href={`https://zentrace.io/tx/${pendingHash}`} target="_blank" rel="noreferrer">{pendingHash}</a> {waiting ? "(waiting…)" : "(mined ✓)"} </div>
          </>
        )}
      </div>

      {/* BOND (stake) */}
      <div className="grid">
        <div className="card">
          <h3>Bond (stake) with Reward Destination</h3>
          <label>Amount (ZTC)</label>
          <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="e.g. 100" />
          <label>Reward destination</label>
          <select id="dest">
            <option value={RewardDestination.Staked}>Restake (compound)</option>
            <option value={RewardDestination.Stash}>Send to me (stash)</option>
            <option value={RewardDestination.None}>No rewards</option>
          </select>
          <div className="row" style={{marginTop:".6rem"}}>
            <button disabled={!isConnected || !amountWei} onClick={async ()=>{
              const dest = Number((document.getElementById("dest") as HTMLSelectElement).value);
              await callNative("bondWithRewardDestination", [amountWei, dest]);
            }}>Bond + set dest</button>
          </div>
          <p className="muted small">Uses <code>bondWithRewardDestination(value,dest)</code>.</p>
        </div>

        <div className="card">
          <h3>Bond to Custom Payee</h3>
          <label>Amount (ZTC)</label>
          <input id="bondAmt2" placeholder="e.g. 50" />
          <label>Payee address</label>
          <input id="payee" placeholder="0x..." />
          <div className="row" style={{marginTop:".6rem"}}>
            <button disabled={!isConnected} onClick={async ()=>{
              const amt = (document.getElementById("bondAmt2") as HTMLInputElement).value;
              const payee = (document.getElementById("payee") as HTMLInputElement).value as Address;
              await callNative("bondWithPayeeAddress", [parseUnits(amt || "0", 18), payee]);
            }}>Bond to payee</button>
          </div>
          <p className="muted small">Uses <code>bondWithPayeeAddress(value,payee)</code>.</p>
        </div>
      </div>

      {/* VALIDATE / NOMINATE */}
      <div className="grid">
        <div className="card">
          <h3>Validate</h3>
          <label>Commission (%)</label>
          <input id="commission" placeholder="e.g. 10" />
          <label>Block nominations?</label>
          <select id="blocked">
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
          <div className="row" style={{marginTop:".6rem"}}>
            <button disabled={!isConnected} onClick={async ()=>{
              const pct = parseFloat((document.getElementById("commission") as HTMLInputElement).value || "0");
              const perbill = percentToPerbill(isFinite(pct) ? pct : 0);
              const blocked = (document.getElementById("blocked") as HTMLSelectElement).value === "true";
              await callNative("validate", [perbill, blocked]);
            }}>Submit validate()</button>
          </div>
        </div>

        <div className="card">
          <h3>Nominate</h3>
          <label>Validator addresses (comma separated)</label>
          <input id="targets" placeholder="0xabc...,0xdef..." />
          <div className="row" style={{marginTop:".6rem"}}>
            <button disabled={!isConnected} onClick={async ()=>{
              const raw = (document.getElementById("targets") as HTMLInputElement).value;
              const targets = raw.split(",").map(s=>s.trim()).filter(Boolean) as Address[];
              await callNative("nominate", [targets]);
            }}>Submit nominate()</button>
          </div>
          <p className="muted small">Max 16 targets per call.</p>
        </div>
      </div>

      {/* INCREASE / CHANGE */}
      <div className="grid">
        <div className="card">
          <h3>Bond Extra</h3>
          <label>Additional amount (ZTC)</label>
          <input id="extra" placeholder="e.g. 25" />
          <div className="row" style={{marginTop:".6rem"}}>
            <button disabled={!isConnected} onClick={async ()=>{
              const amt = (document.getElementById("extra") as HTMLInputElement).value;
              await callNative("bondExtra", [parseUnits(amt || "0", 18)]);
            }}>bondExtra()</button>
          </div>
        </div>

        <div className="card">
          <h3>Reward Destination / Payee</h3>
          <label>Reward destination</label>
          <select id="setdest">
            <option value={RewardDestination.Staked}>Restake</option>
            <option value={RewardDestination.Stash}>Send to me</option>
            <option value={RewardDestination.None}>No rewards</option>
          </select>
          <div className="row" style={{marginTop:".6rem"}}>
            <button disabled={!isConnected} onClick={async ()=>{
              const d = Number((document.getElementById("setdest") as HTMLSelectElement).value);
              await callNative("setRewardDestination", [d]);
            }}>setRewardDestination()</button>
          </div>
          <hr />
          <label>Payee address</label>
          <input id="setpayee" placeholder="0x..." />
          <div className="row" style={{marginTop:".6rem"}}>
            <button disabled={!isConnected} onClick={async ()=>{
              const p = (document.getElementById("setpayee") as HTMLInputElement).value as Address;
              await callNative("setPayee", [p]);
            }}>setPayee()</button>
          </div>
        </div>
      </div>

      {/* UNSTAKE / WITHDRAW */}
      <div className="grid">
        <div className="card">
          <h3>Unstake (regular)</h3>
          <label>Amount to unbond (ZTC)</label>
          <input id="unbondAmt" placeholder="e.g. 100" />
          <div className="row" style={{marginTop:".6rem"}}>
            <button disabled={!isConnected} onClick={async ()=>{ await callNative("chill"); }}>chill()</button>
            <button disabled={!isConnected} onClick={async ()=>{
              const amt = (document.getElementById("unbondAmt") as HTMLInputElement).value;
              await callNative("unbond", [parseUnits(amt || "0", 18)]);
            }}>unbond()</button>
          </div>
          <p className="muted small">Unbonding lasts for <code>bondingDuration</code> eras before withdraw.</p>
        </div>

        <div className="card">
          <h3>Withdraw unbonded</h3>
          <p className="muted small">Will auto-read <code>historyDepth()</code> for the argument.</p>
          <div className="row" style={{marginTop:".6rem"}}>
            <button disabled={!isConnected} onClick={async ()=>{
              // read historyDepth then call withdrawUnbonded
              const hd = await (window as any).wagmi?.config.getClient().readContract({
                address: NATIVE_STAKING, abi: nativeStakingAbi, functionName: "historyDepth"
              }) as bigint;
              await callNative("withdrawUnbonded", [Number(hd ?? 84)]);
            }}>withdrawUnbonded()</button>
          </div>
        </div>
      </div>

      {/* FAST UNSTAKE & PAYOUT */}
      <div className="grid">
        <div className="card">
          <h3>Fast Unstake</h3>
          <div className="row" style={{marginTop:".6rem"}}>
            <button disabled={!isConnected} onClick={async ()=>{ await callFast("registerFastUnstake"); }}>
              registerFastUnstake()
            </button>
            <button disabled={!isConnected} onClick={async ()=>{ await callFast("deregister"); }}>
              deregister()
            </button>
          </div>
          <p className="muted small">Requires not exposed for 2 eras; small deposit is refunded on success.</p>
        </div>

        <div className="card">
          <h3>Claim Rewards (payout by page)</h3>
          <label>Validator stash</label>
          <input id="valstash" placeholder="0x..." />
          <label>Era</label>
          <input id="era" placeholder="e.g. 42" />
          <label>Page</label>
          <input id="page" placeholder="e.g. 0" />
          <div className="row" style={{marginTop:".6rem"}}>
            <button disabled={!isConnected} onClick={async ()=>{
              const vs = (document.getElementById("valstash") as HTMLInputElement).value as Address;
              const era = BigInt((document.getElementById("era") as HTMLInputElement).value || "0");
              const page = BigInt((document.getElementById("page") as HTMLInputElement).value || "0");
              await callNative("payoutStakersByPage", [vs, Number(era), Number(page)]);
            }}>payoutStakersByPage()</button>
          </div>
          <p className="muted small">Each page includes up to 64 nominators.</p>
        </div>
      </div>

      <div className="card">
        <h3>Helpful</h3>
        <ul>
          <li><a href="https://docs.zenchain.io" target="_blank" rel="noreferrer">Docs</a></li>
          <li><a href="https://zentrace.io" target="_blank" rel="noreferrer">Explorer</a></li>
          <li><a href="https://faucet.zenchain.io" target="_blank" rel="noreferrer">Faucet</a></li>
          <li><a href="https://chainlist.org/chain/8408" target="_blank" rel="noreferrer">Chain settings (8408)</a></li>
        </ul>
        <p className="muted small">
          Calls use precompiled contracts: NativeStaking <code>0x…0800</code>, FastUnstake <code>0x…0801</code>.
        </p>
      </div>
    </main>
  );
                  }
