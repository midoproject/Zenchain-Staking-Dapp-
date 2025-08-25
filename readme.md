# ZenChain Staking dApp

A decentralized application (dApp) built with **Next.js 14**, **wagmi**, **viem**, and **RainbowKit**,  
to interact with **ZenChain Testnet staking precompiles**.

---

## 🚀 Features

- 🔗 **Connect Wallet** (RainbowKit + wagmi)
- 💰 **Check Balance & Chain Info** (ZTC on chain ID 8408)
- 📈 **Stake (bond)** with reward destination or custom payee
- 🧑‍⚖️ **Validate / Nominate** validators
- ➕ **Bond Extra** (add stake)
- 🔄 **Set Reward Destination or Payee**
- 💤 **Chill & Unbond**
- 💸 **Withdraw Unbonded**
- ⚡ **Fast Unstake** (register/deregister)
- 🎁 **Claim Rewards** (payout by page)

All calls use **precompiled contracts**:  
- `0x0000000000000000000000000000000000000800` → Native Staking  
- `0x0000000000000000000000000000000000000801` → Fast Unstake

---

## 🛠 Prerequisites

- Node.js 18+  
- Wallet (MetaMask, Rabby, OKX, dll)  
- WalletConnect Project ID (get one at https://cloud.walletconnect.com/)  

---

## ⚡ Quick Start

```bash
# install deps
npm install
# or yarn / pnpm

# run local dev
npm run dev
