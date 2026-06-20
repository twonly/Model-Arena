export interface ProviderBrand {
  key: string;
  label: string;
  icon: string;
  color: string;
  sourceDomain: string;
}

export const PROVIDER_BRANDS: ProviderBrand[] = [
  {
    key: "anthropic",
    label: "Anthropic",
    icon: "/provider-icons/anthropic.png",
    color: "#d97757",
    sourceDomain: "anthropic.com",
  },
  {
    key: "deepseek",
    label: "DeepSeek",
    icon: "/provider-icons/deepseek.png",
    color: "#4f6cff",
    sourceDomain: "deepseek.com",
  },
  {
    key: "google",
    label: "Google",
    icon: "/provider-icons/google.png",
    color: "#4285f4",
    sourceDomain: "ai.google.dev",
  },
  {
    key: "minimax",
    label: "MiniMax",
    icon: "/provider-icons/minimax.png",
    color: "#ff4f8f",
    sourceDomain: "minimaxi.com",
  },
  {
    key: "moonshot-kimi",
    label: "Moonshot Kimi",
    icon: "/provider-icons/moonshot-kimi.png",
    color: "#111111",
    sourceDomain: "kimi.com",
  },
  {
    key: "openai",
    label: "OpenAI",
    icon: "/provider-icons/openai.png",
    color: "#111111",
    sourceDomain: "openai.com",
  },
  {
    key: "xai",
    label: "xAI",
    icon: "/provider-icons/xai.png",
    color: "#111111",
    sourceDomain: "x.ai",
  },
  {
    key: "bytedance-doubao",
    label: "Doubao",
    icon: "/provider-icons/bytedance-doubao.png",
    color: "#1f8cff",
    sourceDomain: "volcengine.com",
  },
  {
    key: "xiaomi-mimo",
    label: "Xiaomi MiMo",
    icon: "/provider-icons/xiaomi-mimo.png",
    color: "#ff6900",
    sourceDomain: "platform.xiaomimimo.com",
  },
  {
    key: "zhipu",
    label: "Zhipu",
    icon: "/provider-icons/zhipu.png",
    color: "#4b5563",
    sourceDomain: "z.ai",
  },
  {
    key: "qwen",
    label: "Qwen",
    icon: "/provider-icons/qwen.png",
    color: "#6b5cff",
    sourceDomain: "qwen.ai",
  },
  {
    key: "stepfun",
    label: "StepFun",
    icon: "/provider-icons/stepfun.png",
    color: "#111111",
    sourceDomain: "stepfun.com",
  },
] as const;

const byKey = new Map(PROVIDER_BRANDS.map((brand) => [brand.key, brand]));

function normalizeProviderName(provider: string): string {
  return provider.toLowerCase().replace(/[\s._-]+/g, "");
}

export function providerBrandFor(provider: string | null | undefined): ProviderBrand | null {
  if (!provider?.trim()) return null;
  const name = normalizeProviderName(provider);
  const key =
    name.includes("anthropic") || name.includes("claude")
      ? "anthropic"
      : name.includes("deepseek")
        ? "deepseek"
        : name.includes("google") || name.includes("gemini")
          ? "google"
          : name.includes("minimax")
            ? "minimax"
            : name.includes("moonshot") || name.includes("kimi")
              ? "moonshot-kimi"
              : name.includes("openai") || name.includes("gpt")
                ? "openai"
                : name.includes("xai") || name.includes("grok")
                  ? "xai"
                  : name.includes("字节") ||
                      name.includes("豆包") ||
                      name.includes("doubao") ||
                      name.includes("volc")
                    ? "bytedance-doubao"
                    : name.includes("xiaomi") ||
                        name.includes("小米") ||
                        name.includes("mimo")
                      ? "xiaomi-mimo"
                      : name.includes("zhipu") ||
                          name.includes("智谱") ||
                          name.includes("glm") ||
                          name === "zai"
                        ? "zhipu"
                        : name.includes("qwen") ||
                            name.includes("通义") ||
                            name.includes("千问") ||
                            name.includes("alibaba")
                          ? "qwen"
                          : name.includes("stepfun") ||
                              name.includes("阶跃") ||
                              name.includes("step")
                            ? "stepfun"
                            : "";
  return key ? byKey.get(key) ?? null : null;
}

export function providerInitials(provider: string | null | undefined): string {
  const trimmed = provider?.trim();
  if (!trimmed) return "?";
  const asciiWords = trimmed.match(/[A-Za-z0-9]+/g);
  if (asciiWords?.length) {
    const first = asciiWords[0]?.[0] ?? "";
    const second = asciiWords.length > 1 ? asciiWords[1]?.[0] : asciiWords[0]?.[1];
    return `${first}${second ?? ""}`.toUpperCase();
  }
  return Array.from(trimmed).slice(0, 2).join("");
}
