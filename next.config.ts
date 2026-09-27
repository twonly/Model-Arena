import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "tokrace.com" }],
      destination: "https://www.tokrace.com/:path*",
      permanent: true,
    }];
  },
  async headers() {
    return process.env.TOKRACE_BETA === "1"
      ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
      : [];
  },
  turbopack: {
    root: projectRoot,
  },
  // 允许用 127.0.0.1 访问 dev server（Next 16 默认只放行 localhost，
  // 否则 JS/HMR 被拦截，页面只剩静态 HTML、按钮全部失效）。
  // 如需手机/局域网访问，把你的内网 IP 加进来，如 "192.168.1.100"。
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
