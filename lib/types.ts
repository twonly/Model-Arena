export type ProviderKind = "openai" | "anthropic";

/** 一个已配置的模型接入点 */
export interface ModelEndpoint {
  id: string;
  name: string; // 展示名，如 "DeepSeek V3"
  kind: ProviderKind;
  baseUrl: string;
  apiKey: string;
  model: string; // 模型 ID，如 "deepseek-chat"
  enabled: boolean;
  /**
   * 额外请求参数（JSON 字符串），原样合并进请求体。
   * 用于厂商私有开关，如 Qwen 的 enable_thinking、GLM/豆包的 thinking.type 等。
   */
  extraBody?: string;
}

export interface RunParams {
  systemPrompt: string;
  temperature: string; // 留空 = 不传
  maxTokens: string; // 留空 = 默认
}

export type RunStatus =
  | "idle"
  | "connecting"
  | "thinking"
  | "streaming"
  | "done"
  | "error"
  | "stopped";

export interface SpeedSample {
  /** 距请求开始的毫秒数 */
  t: number;
  /** 该时刻的瞬时 token/s（滑动窗口） */
  tps: number;
}

export interface RunMetrics {
  ttftMs?: number; // 首个 token（含思考）时延
  firstContentMs?: number; // 首个正文 token 时延
  thinkingMs?: number; // 思考阶段用时（该阶段首末 delta 的活跃窗口）
  contentMs?: number; // 正文阶段用时（同上，不含收尾等待）
  totalMs?: number; // 总用时（完整墙钟）
  promptTokens?: number;
  outputTokens?: number; // 输出总 tokens（官方优先）
  reasoningTokens?: number;
  contentTokens?: number;
  official: boolean; // 总 tokens 是否来自厂商官方 usage
  /** 思考/输出的 token 拆分是否为估算（厂商未给 reasoning_tokens 时） */
  phaseSplitEstimated?: boolean;
  thinkingTps?: number;
  contentTps?: number;
  avgTps?: number;
  /** 瞬时峰值速度（2s 滑动窗口，已按官方 token 总量校准） */
  peakTps?: number;
}

export interface RunState {
  status: RunStatus;
  reasoning: string;
  text: string;
  error?: string;
  metrics: RunMetrics | null;
  samples: SpeedSample[];
  liveTokens: number;
  liveTps: number;
  /** 运行中实时显示的首 token 时延 */
  liveTtftMs?: number;
  /** 本次运行开始的墙钟时间（驱动用时计时器） */
  startedAt?: number;
  rank?: number;
}

export const emptyRun = (): RunState => ({
  status: "idle",
  reasoning: "",
  text: "",
  metrics: null,
  samples: [],
  liveTokens: 0,
  liveTps: 0,
});

/** 历史记录条目 */
export interface HistoryResult {
  name: string;
  model: string;
  status: RunStatus;
  rank?: number;
  metrics: RunMetrics | null;
  text: string;
  reasoning: string;
  error?: string;
}

export interface HistoryEntry {
  id: string;
  at: number;
  title: string;
  notes: string;
  prompt: string;
  results: HistoryResult[];
}

/** 服务端代理输出的统一流事件 */
export type StreamEvent =
  /** ts = 代理收到该 delta 时距请求开始的毫秒数（服务端时钟，不受浏览器渲染卡顿影响） */
  | { type: "delta"; text?: string; reasoning?: string; ts?: number }
  | {
      type: "usage";
      promptTokens?: number;
      outputTokens?: number;
      reasoningTokens?: number;
    }
  | { type: "done"; finishReason?: string }
  | { type: "error"; message: string };
