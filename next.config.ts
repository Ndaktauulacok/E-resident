import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
      // Tambah domain Codespaces/production jika menggunakan proxy (lihat README)
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",").filter(Boolean),
    },
  },
};
export default nextConfig;
