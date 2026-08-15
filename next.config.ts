import type { NextConfig } from "next";

// @ts-expect-error - next-pwa doesn't have types
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  customWorkerDir: "worker",
});

const nextConfig: NextConfig = {
  turbopack: {},
  allowedDevOrigins: ['192.168.1.11'],
};

export default withPWA(nextConfig);
