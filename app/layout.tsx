import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "ZenChain Staking dApp",
  description: "Stake ZTC on ZenChain Testnet via precompiles"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
