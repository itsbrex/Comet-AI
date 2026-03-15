import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';
console.log(`[NextConfig] isDev: ${isDev}, NODE_ENV: ${process.env.NODE_ENV}`);

const nextConfig: NextConfig = {
  // Static export only for production
  output: isDev ? undefined : 'export',
  // Relative prefix only for production (to support file:// in Electron)
  // Empty string in dev to force absolute paths (fixes 404s)
  assetPrefix: isDev ? '' : './',
  // Disable trailing slashes in dev to avoid path resolution issues
  trailingSlash: isDev ? false : true,
  images: {
    unoptimized: true
  },
  reactStrictMode: false,
  transpilePackages: ['framer-motion', 'motion-dom']
};

export default nextConfig;
