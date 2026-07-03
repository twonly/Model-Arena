/**
 * SSRF 防护用的「私网/本机/云元数据」主机名正则——单一来源。
 *
 * 两条服务端通路都按用户给的 baseUrl 发请求，必须用同一份规则拦截内网地址：
 *  - Vercel 路由 `lib/upstream-guard.ts`（仅在 VERCEL=1 公网环境启用拦截）
 *  - Cloudflare Worker `cloudflare/chat-worker/src/index.js`（始终拦截）
 *
 * 以前两边各抄一份，改一处忘一处就是安全漏洞，故收敛到此文件。
 * 注意：本规则只做主机名字面匹配，**不解析 DNS**——DNS rebinding、十进制/
 * 十六进制 IP、`127.1` 简写等仍可绕过。彻底的修复需解析后按 IP 段判定，
 * 属于另一项独立工作（见 README「Privacy and Security」承诺）。
 */
export const PRIVATE_HOST_RE =
  /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|metadata\.google\.internal|\[?::1\]?|\[?f[cd][0-9a-f]{2}:.*)$/i;

export function isPrivateHost(hostname: string): boolean {
  return PRIVATE_HOST_RE.test(hostname);
}
