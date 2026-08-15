import type { NextConfig } from "next";

// @ts-expect-error - next-pwa doesn't have types
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false, // Enabled in dev to allow testing push notifications
  register: true,
  skipWaiting: true,
  customWorkerDir: "worker",
});

const nextConfig: NextConfig = {
  turbopack: {},
  allowedDevOrigins: ['192.168.1.11'],
};

export default withPWA(nextConfig);
