import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server accept requests forwarded through an ngrok tunnel
  // (used to share a locally-running instance for a quick demo).
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app", "*.ngrok.io"],
  images: {
    // The auth background is rendered at quality 100; Next 16 requires every
    // quality value used by <Image> to be allow-listed explicitly.
    qualities: [75, 100],
  },
};

export default nextConfig;
