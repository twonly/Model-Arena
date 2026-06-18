import type { Locale } from "./i18n";

export const zhMessages = {
  common: {
    home: "首页",
    arena: "竞速场",
    stats: "速度榜",
    board: "人气榜",
    templates: "评测模板",
    invite: "邀请奖励",
    method: "测速方法",
    github: "GitHub",
    me: "我的分享",
    runSample: "立即跑样例",
    professionalMode: "进入专业模式",
    startRace: "进入竞速场",
    testNow: "我也来测",
    copy: "复制",
    copied: "已复制",
    cancel: "取消",
    save: "保存",
    delete: "删除",
    close: "关闭",
    retry: "重试",
    loading: "加载中…",
    noData: "暂无数据",
    view: "查看",
    edit: "编辑",
    share: "分享",
    generate: "生成",
    refresh: "刷新",
    language: "语言",
  },
  brand: {
    tagline: "开发者与 AI 测评作者的实时模型测速台",
    description:
      "TOKRACE 是面向开发者和 AI 测评作者的大模型测速工具：同一个 Prompt 并发对比多个 LLM 的首 Token 时延、输出 TPS、峰值速度与稳定性，支持免费样例、分享快照和速度榜。",
  },
  metadata: {
    home: {
      title: "大模型测速工具 - 实时对比 LLM 速度与首 Token 时延",
      description:
        "TOKRACE 帮开发者和 AI 测评作者用同一个 Prompt 并发测试多个大模型，实时对比首 Token 时延、输出 TPS、峰值速度和稳定性，可免费跑样例、生成分享快照和上榜。",
    },
    arena: {
      title: "竞速场 - 并发测试多个大模型",
      description:
        "在 TOKRACE 竞速场用同一个 Prompt 并发测试多个大模型，实时比较首 Token 时延、输出 TPS、峰值速度和稳定性。",
    },
    stats: {
      title: "大模型实测速度排行榜",
      description:
        "全网用户匿名贡献的大模型真实速度排行：输出 TPS、首 Token 时延、峰值速度。数据持续更新。",
    },
    board: {
      title: "最受好评模型排行榜",
      description:
        "TOKRACE 人气榜聚合公开分享页里的模型点赞、点踩和评论，按好评置信度展示最受读者认可的大模型。",
    },
    templates: {
      title: "AI 模型评测模板 - LLM Benchmark Prompt 与模型对比任务",
      description:
        "TOKRACE AI 模型评测模板提供速度、推理、代码、指令遵循、知识问答、写作和长文本等固定 Prompt，帮助开发者与测评作者用同一任务快速对比多个大模型。",
    },
    invite: {
      title: "邀请奖励 - 免费增加模型测试额度",
      description:
        "邀请朋友使用 TOKRACE 完成首次模型对比，邀请人和被邀请人都可以获得额外免费体验额度。",
    },
    method: {
      title: "测速方法论：指标定义与测量方式",
      description:
        "百模竞速如何测量大模型速度：首 Token 时延（TTFT）、思考 / 输出 tokens per second、峰值速度的精确定义，以及计时方式、token 口径与公平性保证。开源可复现。",
    },
    me: {
      title: "我的分享 - TOKRACE",
      description: "查看、复制、关闭或删除你在 TOKRACE 生成过的模型竞速分享页。",
    },
    share: {
      missingTitle: "分享不存在",
      disabledTitle: "分享已关闭",
      fallbackTitle: "模型竞速分享",
      description: "查看一份 TOKRACE 模型竞速分享快照，复查 Prompt、速度指标和模型输出。",
    },
    model: {
      fallbackTitle: "模型速度实测",
      description:
        "查看指定大模型在 TOKRACE 上的真实速度实测：首 Token 时延、输出 tokens/s、峰值速度，全网用户匿名汇总。",
    },
    compare: {
      fallbackTitle: "大模型速度对比",
      description:
        "对比两个大模型在 TOKRACE 上的真实速度表现，包括首 Token 时延、输出 TPS、峰值速度和样本量。",
    },
  },
  home: {
    navBrand: "百模竞速",
    badge: "免费跑样例 · 实时测速 · 分享可复查结果",
    titlePrefix: "开发者与 AI 测评作者的",
    titleAccent: "实时模型测速台",
    leadPrefix: "用同一个 Prompt 并发测试多个 LLM，实时比较",
    leadMetrics: " 首 Token 时延 · 输出 TPS · 峰值速度 · 稳定性",
    leadSuffix: "。先跑免费样例，再换成你的真实任务和模型配置。",
    demoPrompt: "写一篇 5000 字短文，主题是「为什么速度本身就是一种能力」",
    live: "● LIVE",
    lanes: ["模型 A", "模型 B", "模型 C"],
    metrics: ["首Token", "思考TPS", "输出TPS", "峰值 tok/s"],
    featuresTitle: "为什么用 TOKRACE 测速度",
    stepsTitle: "三步跑出可复查结果",
    faqTitle: "常见问题",
    finalCtaTitle: "用真实任务测一次，而不是只看主观体感",
    finalCtaDesc:
      "样例适合快速体验；真正选型时，建议换成你的生产 Prompt、真实模型接入点和多轮重复测试。",
    features: [
      {
        icon: "🏁",
        title: "同 Prompt 并发测速",
        desc: "同一个 Prompt 同时打向多个模型，减少先后顺序带来的网络与时段偏差。",
      },
      {
        icon: "⏱",
        title: "TTFT / TPS 实时对比",
        desc: "首 Token 时延、思考 TPS、输出 TPS、峰值速度和 token 数同步呈现。",
      },
      {
        icon: "📈",
        title: "速度曲线 · 可放大下载",
        desc: "2 秒滑动窗口的实时 tok/s 曲线，点击放大看峰值与任意时刻速度，一键导出 PNG。",
      },
      {
        icon: "🔌",
        title: "免费样例 + 自带 Key",
        desc: "新用户可直接跑预置模型；专业用户可接入自己的 OpenAI 兼容接口或原生 Anthropic 接口。",
      },
      {
        icon: "🔐",
        title: "Key 只存本地，绝不留存",
        desc: "API Key 只存在你本机 localStorage（加密）。每次请求经同源服务器中转一次，用完即弃，不记录、不落库。",
      },
      {
        icon: "📷",
        title: "为发文而生",
        desc: "可编辑标题备注、截图模式、自定义水印、指标表一键复制成 Markdown，截图即配图。",
      },
      {
        icon: "🧪",
        title: "接入即验证",
        desc: "一键拉取厂商模型列表、测试连通性；think / no-think 等私有参数每个模型单独配置。",
      },
      {
        icon: "🖼",
        title: "SVG 自动渲染",
        desc: "输出里的 SVG 代码自动渲染成图，沙箱隔离脚本不执行。",
      },
    ],
    steps: [
      {
        n: "01",
        title: "先跑样例",
        desc: "不用配置 Key，直接用预置模型体验一次真实并发测速。",
      },
      {
        n: "02",
        title: "换成你的 Prompt",
        desc: "用自己的任务、长文、代码或视觉输入，比较模型在真实场景里的速度。",
      },
      {
        n: "03",
        title: "分享证据",
        desc: "生成快照、投票页和长图，让读者能复查你的测速结果。",
      },
    ],
  },
  confidence: {
    sampleHigh: {
      label: "样本较稳",
      description: "50+ 次实测，受单次网络抖动影响较小。",
    },
    sampleMedium: {
      label: "可参考",
      description: "10+ 次实测，适合初步比较。",
    },
    sampleLow: {
      label: "样本偏少",
      description: "样本不足 10 次，建议继续贡献实测。",
    },
    voteHigh: {
      label: "投票较稳",
      description: "30+ 次投票，Wilson 排名更可靠。",
    },
    voteMedium: {
      label: "可参考",
      description: "8+ 次投票，仍会被 Wilson 自动折扣。",
    },
    voteLow: {
      label: "票数偏少",
      description: "投票不足 8 次，排名波动会比较大。",
    },
  },
  apiErrors: {
    sharePayloadTooLarge: "内容过大无法分享。可减少模型数量或缩短输出后重试。",
    shareInvalidCompressedPayload: "压缩内容解析失败",
    shareEmptySnapshot: "无可分享的结果",
    shareSaveTimeout: "保存超时，数据库无响应，请稍后重试",
    shareSaveFailed: "保存失败",
    shareLoadFailed: "加载失败",
    shareForbidden: "无权操作或分享不存在",
    badJson: "请求 JSON 格式不正确",
    invalidClient: "缺少有效 clientId",
    incompleteParams: "参数不完整",
    operationFailed: "操作失败",
  },
} as const;

type DeepWiden<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer Item)[]
        ? readonly DeepWiden<Item>[]
        : { [Key in keyof T]: DeepWiden<T[Key]> };

export type Messages = DeepWiden<typeof zhMessages>;

export const enMessages = {
  common: {
    home: "Home",
    arena: "Arena",
    stats: "Speed Board",
    board: "Audience Board",
    templates: "Templates",
    invite: "Invite Rewards",
    method: "Method",
    github: "GitHub",
    me: "My Shares",
    runSample: "Run Sample",
    professionalMode: "Professional Mode",
    startRace: "Enter Arena",
    testNow: "Run My Test",
    copy: "Copy",
    copied: "Copied",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    close: "Close",
    retry: "Retry",
    loading: "Loading...",
    noData: "No data",
    view: "View",
    edit: "Edit",
    share: "Share",
    generate: "Generate",
    refresh: "Refresh",
    language: "Language",
  },
  brand: {
    tagline: "Real-time LLM speed test bench for developers and AI reviewers",
    description:
      "TOKRACE is an LLM speed testing bench for developers and AI reviewers. Run one prompt across many models and compare TTFT, output TPS, peak speed and stability with shareable snapshots and live leaderboards.",
  },
  metadata: {
    home: {
      title: "LLM speed testing tool - compare TTFT and output TPS in real time",
      description:
        "TOKRACE helps developers and AI reviewers run one prompt across multiple LLMs and compare TTFT, output TPS, peak speed and stability with free samples, shareable snapshots and leaderboards.",
    },
    arena: {
      title: "Arena - test multiple LLMs concurrently",
      description:
        "Use the TOKRACE arena to run one prompt across multiple LLMs and compare TTFT, output TPS, peak speed and stability in real time.",
    },
    stats: {
      title: "Real-world LLM speed leaderboard",
      description:
        "A live leaderboard of real-world LLM speed results contributed anonymously by users: output TPS, TTFT and peak speed.",
    },
    board: {
      title: "Most liked LLM leaderboard",
      description:
        "TOKRACE audience board aggregates likes, dislikes and comments from public share pages, ranking models by confidence-adjusted approval.",
    },
    templates: {
      title: "AI model evaluation templates - LLM benchmark prompts and comparison tasks",
      description:
        "TOKRACE evaluation templates provide fixed prompts for speed, reasoning, coding, instruction following, knowledge, writing and long-context tests so developers and reviewers can compare LLMs on the same task.",
    },
    invite: {
      title: "Invite rewards - earn extra free model test quota",
      description:
        "Invite friends to complete their first TOKRACE model comparison. Both the inviter and invitee can receive extra free test quota.",
    },
    method: {
      title: "Speed testing methodology: metrics and measurement",
      description:
        "How TOKRACE measures LLM speed: precise definitions for TTFT, thinking/output tokens per second and peak speed, plus timing, token accounting and fairness guarantees.",
    },
    me: {
      title: "My Shares - TOKRACE",
      description: "View, copy, disable or delete model race share pages you generated in TOKRACE.",
    },
    share: {
      missingTitle: "Share not found",
      disabledTitle: "Share disabled",
      fallbackTitle: "Model race share",
      description:
        "View a TOKRACE model race snapshot and inspect the prompt, speed metrics and model outputs.",
    },
    model: {
      fallbackTitle: "Model speed results",
      description:
        "View real-world speed results for this model on TOKRACE: TTFT, output tokens/s, peak speed and anonymous user samples.",
    },
    compare: {
      fallbackTitle: "LLM speed comparison",
      description:
        "Compare two LLMs on TOKRACE by TTFT, output TPS, peak speed and sample count.",
    },
  },
  home: {
    navBrand: "TOKRACE",
    badge: "Free samples · Real-time speed tests · Shareable evidence",
    titlePrefix: "A real-time model speed bench",
    titleAccent: "for developers and AI reviewers",
    leadPrefix: "Run one prompt across multiple LLMs and compare",
    leadMetrics: " TTFT · output TPS · peak speed · stability",
    leadSuffix: ". Start with a free sample, then switch to your real task and model setup.",
    demoPrompt: "Write a 5,000-word essay on why speed itself is a capability",
    live: "● LIVE",
    lanes: ["Model A", "Model B", "Model C"],
    metrics: ["TTFT", "Thinking TPS", "Output TPS", "Peak tok/s"],
    featuresTitle: "Why test speed with TOKRACE",
    stepsTitle: "Three steps to reproducible evidence",
    faqTitle: "FAQ",
    finalCtaTitle: "Test with your real task, not just a subjective impression",
    finalCtaDesc:
      "Samples are useful for a quick look. For model selection, use your production prompt, real model endpoints and repeated runs.",
    features: [
      {
        icon: "🏁",
        title: "Concurrent tests with the same prompt",
        desc: "Send the same prompt to multiple models at the same time to reduce ordering, network and time-of-day bias.",
      },
      {
        icon: "⏱",
        title: "Real-time TTFT / TPS comparison",
        desc: "Track TTFT, thinking TPS, output TPS, peak speed and token counts side by side.",
      },
      {
        icon: "📈",
        title: "Zoomable speed curves",
        desc: "Inspect 2-second sliding-window tok/s curves, zoom into peak moments and export PNG evidence.",
      },
      {
        icon: "🔌",
        title: "Free samples + bring your own key",
        desc: "New users can run preset models immediately; advanced users can connect OpenAI-compatible or native Anthropic endpoints.",
      },
      {
        icon: "🔐",
        title: "Keys stay local",
        desc: "API keys stay in encrypted localStorage. Requests pass through the same-origin server once and are not stored.",
      },
      {
        icon: "📷",
        title: "Built for publishing",
        desc: "Edit titles and notes, use screenshot mode, customize watermarks and copy metrics as Markdown.",
      },
      {
        icon: "🧪",
        title: "Validate as you connect",
        desc: "Fetch provider model lists, test connectivity and configure private parameters per model.",
      },
      {
        icon: "🖼",
        title: "Automatic SVG rendering",
        desc: "SVG code in model output is rendered as an image in a sandbox with scripts disabled.",
      },
    ],
    steps: [
      {
        n: "01",
        title: "Run a sample",
        desc: "Try a real concurrent speed test with preset models without configuring keys.",
      },
      {
        n: "02",
        title: "Use your prompt",
        desc: "Test your real task, long-form input, code task or visual prompt against configured models.",
      },
      {
        n: "03",
        title: "Share evidence",
        desc: "Generate snapshots, voting pages and long images so readers can inspect the result.",
      },
    ],
  },
  confidence: {
    sampleHigh: {
      label: "Stable sample",
      description: "50+ runs, less sensitive to one-off network jitter.",
    },
    sampleMedium: {
      label: "Usable signal",
      description: "10+ runs, suitable for early comparison.",
    },
    sampleLow: {
      label: "Low sample",
      description: "Fewer than 10 runs; contribute more tests before drawing conclusions.",
    },
    voteHigh: {
      label: "Stable vote",
      description: "30+ votes make Wilson ranking more reliable.",
    },
    voteMedium: {
      label: "Usable signal",
      description: "8+ votes; Wilson ranking still discounts uncertainty.",
    },
    voteLow: {
      label: "Low votes",
      description: "Fewer than 8 votes; ranking may move significantly.",
    },
  },
  apiErrors: {
    sharePayloadTooLarge: "The share is too large. Reduce model count or shorten outputs and try again.",
    shareInvalidCompressedPayload: "Failed to parse compressed content",
    shareEmptySnapshot: "No results to share",
    shareSaveTimeout: "Saving timed out. The database did not respond; try again later.",
    shareSaveFailed: "Failed to save",
    shareLoadFailed: "Failed to load",
    shareForbidden: "You do not have permission or the share does not exist",
    badJson: "Invalid JSON request",
    invalidClient: "Missing a valid clientId",
    incompleteParams: "Incomplete parameters",
    operationFailed: "Operation failed",
  },
} satisfies Messages;

const MESSAGE_MAP: Record<Locale, Messages> = {
  "zh-CN": zhMessages,
  en: enMessages,
};

export function getMessages(locale: Locale): Messages {
  return MESSAGE_MAP[locale];
}
