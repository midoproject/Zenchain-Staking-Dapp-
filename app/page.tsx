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

/** Track tx until mined */
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
  const { data: balance } = useBalance({ address, query: { enabled: !!address } });

  // ----- Reads from precompile
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

  // ----- Writer
  const { writeContractAsync } = useWriteContract();

  // ----- Tx state
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>();
  const { mined, isLoading: waiting } = useTx(pendingHash);
  useEffect(() => {
    if (mined) setPendingHash(undefined);
  }, [mined]);

  // ----- Inputs
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

  // ----- Parsed amounts (tanpa literal 0n)
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

  // ===== Helpers (pastikan di atas return)
  function pctToPerbill(pct: number) {
    // perbill = pct * 1e9 / 100
    return BigInt(Math.round(pct * 1e7));
  }

  // HANYA kirim `args` jika ada — cocok untuk fungsi tanpa argumen (wagmi strict)
  async function callNative(functionName: string, args?: readonly unknown[]) {
    const cfg: any = {
      address: NATIVE_STAKING,
      abi: nativeStakingAbi,
      functionName: functionName as any,
    };
    if (args && args.length > 0) cfg.args = args as any;
    const hash = await writeContractAsync(cfg);
    setPendingHash(hash);
  }

  async function callFast(functionName: string, args?: readonly unknown[]) {
    const cfg: any = {
      address: FAST_UNSTAKE,
      abi: fastUnstakeAbi,
      functionName: functionName as any,
    };
    if (args && args.length > 0) cfg.args = args as any;
    const hash = await writeContractAsync(cfg);
    setPendingHash(hash);
  }
  // ===== End Helpers

  return (
    <main className="container" style={{ padding: "24px", maxWidth: 920, margin: "0 auto" }}>
      <h1>ZenChain Staking dApp</h1>
      <p style={{ color: "#888" }}>Stake ZTC on ZenChain Testnet via precompiles.</p>

      {/* Header / wallet */}
      <div style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16, marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <ConnectButton />
          <div>
            <div style={{ fontSize: 12, color: "#888" }}>Chain ID: {chainId ?? "—"}</div>
            <div style={{ fontSize: 12 }}>Address: {address ?? "—"}</div>
            <div style={{ fontSize: 12 }}>
              Balance: {balance ? `${balance.formatted} ${balance.symbol}` : "—"}
            </div>
            <div style={{ fontSize: 12 }}>
              currentEra: {currentEra !== undefined ? Number(currentEra) : "—"}
            </div>
          </div>
        </div>

        {pendingHash && (
          <>
            <hr style={{ margin: "12px 0", borderColor: "#2a2a2a" }} />
            <div style={{ fontSize: 12 }}>
              Tx:{" "}
              <a href={`https://zentrace.io/tx/${pendingHash}`} target="_blank" rel="noreferrer">
                {pendingHash}
              </a>{" "}
              {waiting ? "(waiting…)" : "(mined ✓)"}
            </div>
          </>
        )}
      </div>

      {/* BOND */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
          <h3>Bond (stake) with destination</h3>
          <label>Amount (ZTC)</label>
          <input
            value={bondAmt}
            onChange={(e) => setBondAmt(e.target.value)}
            placeholder="e.g. 100"
            style={{ width: "100%", marginTop: 6, marginBottom: 8 }}
          />
          <label>Reward destination</label>
          <select
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          >
            <option value={RewardDestination.Staked}>Restake (compound)</option>
            <option value={RewardDestination.Stash}>Send to me (stash)</option>
            <option value={RewardDestination.None}>No rewards</option>
          </select>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              disabled={!isConnected || bondAmtWei === BigInt(0)}
              onClick={async () => {
                await callNative("bondWithRewardDestination", [bondAmtWei, Number(dest)]);
              }}
            >
              Bond + set destination
            </button>
          </div>
          <p style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
            Calls <code>bondWithRewardDestination(value,dest)</code>. Precompile: {NATIVE_STAKING}
          </p>
        </div>

        <div style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
          <h3>Bond to custom payee</h3>
          <label>Amount (ZTC)</label>
          <input
            placeholder="e.g. 50"
            value={bondAmt}
            onChange={(e) => setBondAmt(e.target.value)}
            style={{ width: "100%", marginTop: 6, marginBottom: 8 }}
          />
          <label>Payee address</label>
          <input
            placeholder="0x..."
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              disabled={!isConnected || !bondAmt}
              onClick={async () => {
                await callNative("bondWithPayeeAddress", [
                  parseUnits(bondAmt || "0", 18),
                  payee as Address,
                ]);
              }}
            >
              Bond to payee
            </button>
          </div>
        </div>
      </section>

      {/* VALIDATE / NOMINATE */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
          <h3>Validate</h3>
          <label>Commission (%)</label>
          <input
            placeholder="e.g. 10"
            value={commissionPct}
            onChange={(e) => setCommissionPct(e.target.value)}
            style={{ width: "100%", marginTop: 6, marginBottom: 8 }}
          />
          <label>Block nominations?</label>
          <select
            value={blocked}
            onChange={(e) => setBlocked(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              disabled={!isConnected}
              onClick={async () => {
                const pct = parseFloat(commissionPct || "0");
                const perbill = pctToPerbill(isFinite(pct) ? pct : 0);
                await callNative("validate", [perbill, blocked === "true"]);
              }}
            >
              validate()
            </button>
          </div>
        </div>

        <div style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
          <h3>Nominate</h3>
          <label>Validator addresses (comma separated)</label>
          <input
            placeholder="0xabc...,0xdef..."
            value={nominees}
            onChange={(e) => setNominees(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              disabled={!isConnected}
              onClick={async () => {
                const targets = nominees
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean) as Address[];
                await callNative("nominate", [targets]);
              }}
            >
              nominate()
            </button>
          </div>
          <p style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
            Tip: batasi jumlah validator sesuai limit chain per panggilan.
          </p>
        </div>
      </section>

      {/* INCREASE / UNBOND */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
          <h3>Bond Extra</h3>
          <label>Additional amount (ZTC)</label>
          <input
            placeholder="e.g. 25"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              disabled={!isConnected || extraAmtWei === BigInt(0)}
              onClick={async () => {
                await callNative("bondExtra", [extraAmtWei]);
              }}
            >
              bondExtra()
            </button>
          </div>
        </div>

        <div style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
          <h3>Unstake (regular)</h3>
          <label>Amount to unbond (ZTC)</label>
          <input
            placeholder="e.g. 100"
            value={unbondAmt}
            onChange={(e) => setUnbondAmt(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button
              disabled={!isConnected}
              onClick={async () => {
                await callNative("chill");
              }}
            >
              chill()
            </button>
            <button
              disabled={!isConnected || unbondWei === BigInt(0)}
              onClick={async () => {
                await callNative("unbond", [unbondWei]);
              }}
            >
              unbond()
            </button>
          </div>
          <p style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
            Unbonding butuh beberapa era sebelum bisa withdrawal.
          </p>
        </div>
      </section>

      {/* WITHDRAW / FAST UNSTAKE / PAYOUT */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
          <h3>Withdraw Unbonded</h3>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              disabled={!isConnected}
              onClick={async () => {
                const spans = Number(historyDepth ?? 84);
                await callNative("withdrawUnbonded", [spans]);
              }}
            >
              withdrawUnbonded()
            </button>
          </div>
        </div>

        <div style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
          <h3>Fast Unstake</h3>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button
              disabled={!isConnected}
              onClick={async () => {
                await callFast("registerFastUnstake");
              }}
            >
              registerFastUnstake()
            </button>
            <button
              disabled={!isConnected}
              onClick={async () => {
                await callFast("deregister");
              }}
            >
              deregister()
            </button>
          </div>
          <p style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
            Syarat: tidak terekspos selama 2 era; deposit kecil direfund saat sukses.
          </p>
        </div>
      </section>

      <section style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16, marginTop: 16 }}>
        <h3>Payout Rewards (by page)</h3>
        <label>Validator stash</label>
        <input
          placeholder="0x..."
          value={payoutStash}
          onChange={(e) => setPayoutStash(e.target.value)}
          style={{ width: "100%", marginTop: 6, marginBottom: 8 }}
        />
        <label>Era</label>
        <input
          placeholder="e.g. 42"
          value={payoutEra}
          onChange={(e) => setPayoutEra(e.target.value)}
          style={{ width: "100%", marginTop: 6, marginBottom: 8 }}
        />
        <label>Page</label>
        <input
          placeholder="0"
          value={payoutPage}
          onChange={(e) => setPayoutPage(e.target.value)}
          style={{ width: "100%", marginTop: 6 }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            disabled={!isConnected}
            onClick={async () => {
              const era = Number(payoutEra || "0");
              const page = Number(payoutPage || "0");
              await callNative("payoutStakersByPage", [
                payoutStash as Address,
                era,
                page,
              ]);
            }}
          >
            payoutStakersByPage()
          </button>
        </div>
        <p style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
          Satu page biasanya memuat puluhan nominators (mis. 64).
        </p>
      </section>
    </main>
  );
}
