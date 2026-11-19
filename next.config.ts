import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
   // Self-contained server for hermes: built on the Mac, copied to a release dir.
   output: 'standalone',
   poweredByHeader: false,
   // Recipe photos come through our own /media proxy as plain <img>; no optimiser route.
   images: { unoptimized: true },
   devIndicators: false,
};

export default nextConfig;
