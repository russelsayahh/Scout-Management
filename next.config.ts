import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server accept requests forwarded through an ngrok tunnel
  // (used to share a locally-running instance for a quick demo).
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app", "*.ngrok.io"],
};

export default nextConfig;
