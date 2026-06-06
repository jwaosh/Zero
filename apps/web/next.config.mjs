/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @zero/shared ships TypeScript source; let Next transpile it.
  transpilePackages: ["@zero/shared"],
};

export default nextConfig;
