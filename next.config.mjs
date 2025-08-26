/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  webpack: (config) => {
    // Silence optional deps warnings from MetaMask/WalletConnect in browser bundles
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      encoding: false,
      "pino-pretty": false,
    };
    return config;
  },
};
export default nextConfig;
