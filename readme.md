# ZenChain Staking dApp

A full-featured decentralized application (dApp) to **stake ZTC on the ZenChain Testnet**, built with **Next.js 14**, **RainbowKit**, and **wagmi**.

---

## 🚀 Features

- 🔗 Connect wallet (RainbowKit + WalletConnect)  
- 💳 Display user address, ZTC balance, and Chain ID  
- 📜 Show staking precompile contract address  
- 📈 Staking Actions:  
  - Bond (stake) with reward destination or custom payee  
  - Bond Extra (increase stake)  
  - Validate (set commission & block flag)  
  - Nominate validators  
  - Chill (stop validating/nominating)  
  - Unbond stake  
  - Withdraw Unbonded  
  - Fast Unstake (register/deregister)  
  - Claim Rewards via `payoutStakersByPage`

---

## ⚡ Deployment

1. **Fork or clone** this repository  
2. **Push** it to your GitHub repo  
3. Deploy on [Vercel](https://vercel.com/new)  
   - Framework preset: **Next.js** (auto-detected)  
   - Root Directory: `./`  
   - WalletConnect Project ID already **hardcoded** → no environment variable required  
   - (Optional) add `NEXT_PUBLIC_ZENCHAIN_RPC_HTTP` to override RPC endpoint  
4. Click **Deploy** 🎉  

---

## 🔗 ZenChain Testnet Info

- **Chain ID**: `8408`  
- **RPC HTTP**: `https://zenchain-testnet.api.onfinality.io/public`  
- **RPC WS**: `wss://zenchain-testnet.api.onfinality.io/public-ws`  
- **Explorer**: [ZenTrace](https://zentrace.io)  
- **Faucet**: [ZenChain Faucet](https://faucet.zenchain.io)  

---

## 🏗 Project Structure
```
zenchain-staking-dapp/
├── app/
│   ├── globals.css         # Global CSS styles
│   ├── layout.tsx          # Root layout with Providers
│   ├── page.tsx            # Main staking UI (connect, stake, bond, unbond, etc.)
│   └── providers.tsx       # RainbowKit + wagmi + React Query setup
│
├── chains/
│   └── zenchain.ts         # ZenChain Testnet chain configuration
│
├── lib/
│   └── stakingAbi.ts       # Precompile ABIs (staking + fast-unstake)
│
├── .env.example            # Example environment variables
├── .gitignore              # Ignore build / env / cache files
├── next-env.d.ts           # Next.js type definitions
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```
