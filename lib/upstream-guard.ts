/**
 * 公网部署时的 SSRF 防护：/api/chat、/api/models、/api/test 会按用户
 * 提供的 baseUrl 发起服务端请求，部署到公网后必须禁止把请求打向
 * 内网/本机/云元数据地址。
 *
 * 仅在 Vercel 等托管环境（VERCEL=1）启用拦截——本机自部署时仍可
 * 直连 localhost 的 Ollama 等本地模型。
 */

const PRIVATE_HOST_RE =
  /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|metadata\.google\.internal|\[?::1\]?|\[?f[cd][0-9a-f]{2}:.*)$/i;

export function checkUpstreamUrl(baseUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(baseUrl);
  } catch {
    return "Base URL 不是合法的 URL";
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    return "Base URL 仅支持 http/https";
  }
  if (process.env.VERCEL && PRIVATE_HOST_RE.test(u.hostname)) {
    return "公网部署版不允许访问本机/内网地址（本地模型请在自己电脑上运行本项目）";
  }
  return null;
}
