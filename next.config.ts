import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许用 127.0.0.1 访问 dev server（Next 16 默认只放行 localhost，
  // 否则 JS/HMR 被拦截，页面只剩静态 HTML、按钮全部失效）。
  // 如需手机/局域网访问，把你的内网 IP 加进来，如 "192.168.1.100"。
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
