import os from "os";

import type { NextConfig } from "next";

function getLocalLanOrigins(port = 3000): string[] {
  const origins = new Set<string>();

  if (process.env.DEV_LAN_ORIGIN) {
    origins.add(process.env.DEV_LAN_ORIGIN);
  }

  try {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
      for (const address of iface ?? []) {
        if (address.family === "IPv4" && !address.internal) {
          origins.add(`${address.address}:${port}`);
        }
      }
    }
  } catch {
    // 一部環境では networkInterfaces が失敗するため無視
  }

  return [...origins];
}

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === "development"
    ? { allowedDevOrigins: getLocalLanOrigins() }
    : {}),
  // Firebase signInWithPopup が opener と通信できるよう許可
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
