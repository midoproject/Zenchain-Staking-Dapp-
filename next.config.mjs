/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    tsconfigPaths: true   // <— tambahkan ini
  }
};
export default nextConfig;
