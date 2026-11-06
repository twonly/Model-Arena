import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const creativeAssetBase = "https://ymgfejbgkctriczbcvxc.supabase.co/storage/v1/object/public/tokrace-creative-evaluations-20261027/a5b5eb398e25b0ed";
const creativeAudioRevisionBase = "https://ymgfejbgkctriczbcvxc.supabase.co/storage/v1/object/public/tokrace-creative-evaluations-20261027/8596eb229007a1a1";

const openTopicAssetBase = "https://ymgfejbgkctriczbcvxc.supabase.co/storage/v1/object/public/tokrace-creative-evaluations-20261027/kimi-vs-minimax-open-topic-763c1736f1691f0e";

const longcatClaudeAssetBase = "https://ymgfejbgkctriczbcvxc.supabase.co/storage/v1/object/public/tokrace-creative-evaluations-20261027/longcat-cc-c71b6a28ffbe0219";
const longcatReleaseAssetBase = "https://ymgfejbgkctriczbcvxc.supabase.co/storage/v1/object/public/tokrace-creative-evaluations-20261027/longcat-2-5-release-4c80a2f2643e65d6";
const longcatCreationAssetBase = "https://ymgfejbgkctriczbcvxc.supabase.co/storage/v1/object/public/tokrace-creative-evaluations-20261027/longcat-2-5-creation-20261102-9362e9a5161ace9d";

const croutonCreativeAssetBase = "https://ymgfejbgkctriczbcvxc.supabase.co/storage/v1/object/public/tokrace-creative-evaluations-20261027/crouton-alpha-creative-614d2140e5885e87";
const hy4CreativeAssetBase = "https://ymgfejbgkctriczbcvxc.supabase.co/storage/v1/object/public/tokrace-creative-evaluations-20261027/tencent-hy4-creative-660311fa174eb286";

const nextConfig: NextConfig = {
  async rewrites() {
    // Local public files win; deployment omits this large, verified media snapshot.
    const creativeAssets = [{
      source: "/evaluations/kimi-vs-minimax-open-topic/:path*",
      destination: `${openTopicAssetBase}/:path*`,
    }, {
      source: "/evaluations/gemini-4-argon-creative/:path*",
      destination: "https://ymgfejbgkctriczbcvxc.supabase.co/storage/v1/object/public/tokrace-creative-evaluations-20261027/gemini-4-argon-creative-f13780dc0b37b855/:path*",
    }, {
      source: "/evaluations/gemini-3-8-flash-creative/:path*",
      destination: "https://ymgfejbgkctriczbcvxc.supabase.co/storage/v1/object/public/tokrace-creative-evaluations-20261027/gemini-3-8-flash-creative-a66f12b279c84ad3/:path*",
    }, {
      source: "/evaluations/tencent-hy4-creative/:path*",
      destination: `${hy4CreativeAssetBase}/:path*`,
    }, {
      source: "/evaluations/crouton-alpha-creative/:path*",
      destination: `${croutonCreativeAssetBase}/:path*`,
    }, {
      source: "/articles/tencent-hy4-release/:path*",
      destination: "https://ymgfejbgkctriczbcvxc.supabase.co/storage/v1/object/public/tokrace-creative-evaluations-20261027/hy4-release-1b7ce796d77b1e94/:path*",
    }, {
      source: "/articles/tencent-hy4/hy4-official-teaser.mp4",
      destination: "https://ymgfejbgkctriczbcvxc.supabase.co/storage/v1/object/public/tokrace-creative-evaluations-20261027/hy4-teaser-166b7c9dd6d67f86/hy4-official-teaser.mp4",
    }, {
      source: "/evaluations/kimi-k3-1-pro/official-examples/:path*",
      destination: "https://ymgfejbgkctriczbcvxc.supabase.co/storage/v1/object/public/tokrace-creative-evaluations-20261027/kimi-pro-official-video-c531fc7fb6dcbc2e/:path*",
    }, {
      source: "/evaluations/longcat-2-5-creation-20261102/:path*",
      destination: `${longcatCreationAssetBase}/:path*`,
    }, {
      source: "/evaluations/longcat-2-5-release/:path*",
      destination: `${longcatReleaseAssetBase}/:path*`,
    }, {
      source: "/evaluations/longcat-2-5-claude-code/:path*",
      destination: `${longcatClaudeAssetBase}/:path*`,
    }, {
      source: "/evaluations/kimi-k3-1-pro-creative/audio-policy-v3/:path*",
      destination: `${creativeAudioRevisionBase}/audio-policy-v3/:path*`,
    }, {
      source: "/evaluations/kimi-k3-1-pro-creative/assets.json",
      destination: `${creativeAudioRevisionBase}/assets.json`,
    }, {
      source: "/evaluations/kimi-k3-1-pro-creative/:path*",
      destination: `${creativeAssetBase}/:path*`,
    }, {
      source: "/articles/kimi-k3-1-teaser/kimi-k3-1-official-teaser.mp4",
      destination: `${creativeAssetBase}/legacy/kimi-k3-1-official-teaser.mp4`,
    }];
    // Railway serves the app; the original Vercel project collects analytics.
    if (process.env.VERCEL === "1") return creativeAssets;
    return [...creativeAssets, ...["insights", "speed-insights"].map((service) => ({
      source: `/_vercel/${service}/:path*`,
      destination: `https://model-arena-azure.vercel.app/_vercel/${service}/:path*`,
    }))];
  },
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
