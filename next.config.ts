import type { NextConfig } from "next";

import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false, // Enabled in dev to allow testing push notifications
  register: true,
  customWorkerSrc: "worker",
});

const nextConfig: NextConfig = {
  turbopack: {},
  allowedDevOrigins: ['192.168.1.11'],
};

export default withPWA(nextConfig);
