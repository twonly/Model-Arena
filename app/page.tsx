import Link from "next/link";

export const metadata = {
  title: "Model Arena · 大模型竞速对比台",
  description:
    "同一个 Prompt 并发打到多个大模型，实时对比首 Token 时延、思考/输出 TPS、峰值速度。开源、免费、API Key 不出你的浏览器。",
};

const GITHUB = "https://github.com/twonly/Model-Arena";

/* 赛道演示数据：纯 CSS 动画，三条赛道不同速度 */
const LANES = [
  { name: "模型 A", tps: "312 tok/s", medal: "🥇", dur: "4.2s", w: "94%" },
  { name: "模型 B", tps: "187 tok/s", medal: "🥈", dur: "5.6s", w: "78%" },
  { name: "模型 C", tps: "96 tok/s", medal: "🥉", dur: "7.0s", w: "55%" },
];

const FEATURES: { icon: string; title: string; desc: string }[] = [
  {
    icon: "🏁",
    title: "并发竞速 · 完成排名",
    desc: "同一个 Prompt 同时打向所有模型，流式输出实时赛跑，先完成的挂 🥇🥈🥉。",
  },
  {
    icon: "⏱",
    title: "思考与输出分开统计",
    desc: "推理模型的思考阶段独立计时计速，思考TPS / 输出TPS / 峰值各算各的，互不污染。",
  },
  {
    icon: "📈",
    title: "速度曲线 · 可放大下载",
    desc: "2 秒滑动窗口的实时 tok/s 曲线，点击放大看峰值与任意时刻速度，一键导出 PNG。",
  },
  {
    icon: "🔌",
    title: "16 家厂商开箱即用",
    desc: "DeepSeek、Kimi、智谱、通义、豆包、阶跃、MiniMax、OpenAI、Claude、Gemini……任何 OpenAI 兼容接口都能接。",
  },
  {
    icon: "🔐",
    title: "Key 不出你的浏览器",
    desc: "API Key 只存在你本机 localStorage，请求经页面同源服务直连厂商，永不落库。",
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
    desc: "「画一只鹈鹕骑自行车」？输出里的 SVG 代码自动渲染成图，沙箱隔离脚本不执行。",
  },
];

const STEPS = [
  {
    n: "01",
    title: "接入模型",
    desc: "选厂商预设，填入你自己的 API Key 和模型 ID，测试连通。",
  },
  {
    n: "02",
    title: "输入 Prompt 开跑",
    desc: "一个问题同时发给所有模型，看它们实时竞速。",
  },
  {
    n: "03",
    title: "截图 / 导出发文",
    desc: "排名、指标、速度曲线尽收一屏，加上水印直接进文章。",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* 导航 */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[20px] font-black"
            style={{ fontFamily: "var(--font-title)" }}
          >
            Model Arena
          </span>
          <span className="num text-[11px] text-faint">竞速对比台</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-line bg-card px-3.5 py-1.5 text-[13px] text-faint hover:text-ink"
          >
            GitHub
          </a>
          <Link
            href="/arena"
            className="rounded-md bg-ink px-4 py-1.5 text-[13px] font-bold text-paper"
          >
            进入竞速场 ▶
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-6xl px-6 pt-14 pb-10 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1 text-[12px] text-faint">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          开源 · 免费 · API Key 不出你的浏览器
        </div>
        <h1
          className="mx-auto max-w-3xl text-[44px] font-black leading-[1.15] sm:text-[56px]"
          style={{ fontFamily: "var(--font-title)" }}
        >
          让模型用速度
          <span style={{ color: "var(--accent)" }}>说话</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-faint">
          同一个 Prompt 并发打到多个大模型，实时对比
          <span className="num text-ink"> 首Token时延 · 思考TPS · 输出TPS · 峰值速度</span>
          。给 AI 测评博主的竞速仪器，截图即发文。
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/arena"
            className="rounded-lg bg-ink px-7 py-3 text-[15px] font-bold text-paper shadow-sm hover:opacity-90"
          >
            开始对比 ▶
          </Link>
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line bg-card px-7 py-3 text-[15px] font-semibold text-ink hover:border-ink/40"
          >
            ⭐ Star on GitHub
          </a>
        </div>
      </header>

      {/* 赛道演示（纯 CSS 动画） */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="text-[13px] font-bold">
              写一篇 5000 字短文，主题是「为什么速度本身就是一种能力」
            </span>
            <span className="num text-[11px]" style={{ color: "var(--accent)" }}>
              ● LIVE
            </span>
          </div>
          <div className="space-y-4 px-5 py-6">
            {LANES.map((lane, i) => (
              <div key={lane.name}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] font-semibold">
                    {lane.name}{" "}
                    <span
                      className="race-medal text-[13px]"
                      style={{ animationDelay: lane.dur }}
                    >
                      {lane.medal}
                    </span>
                  </span>
                  <span className="num text-[12px] text-faint">{lane.tps}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-paper">
                  <div
                    className="race-bar h-full rounded-full"
                    style={{
                      animationDuration: lane.dur,
                      animationDelay: `${i * 0.15}s`,
                      // @ts-expect-error CSS 自定义属性
                      "--lane-w": lane.w,
                      background:
                        i === 0
                          ? "var(--accent)"
                          : i === 1
                            ? "var(--ink)"
                            : "var(--faint)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* 指标栏（仿真实卡片） */}
          <div className="grid grid-cols-4 divide-x divide-line border-t border-line bg-paper/50">
            {[
              ["0.68", "s", "首Token"],
              ["102", "", "思考TPS"],
              ["312", "", "输出TPS"],
              ["387", "", "峰值 tok/s"],
            ].map(([v, unit, label]) => (
              <div key={label} className="flex flex-col items-center gap-1 py-4">
                <div className="num text-[26px] font-bold leading-none">
                  {v}
                  {unit && (
                    <span className="ml-0.5 text-[12px] font-medium text-faint">
                      {unit}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-faint">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-[11.5px] text-faint/80">
          ↑ 演示动画 · 真实数据来自你接入的模型
        </p>
      </section>

      {/* 三步上手 */}
      <section className="border-y border-line bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <div
                className="num text-[36px] font-bold leading-none"
                style={{ color: "var(--accent)", opacity: 0.85 }}
              >
                {s.n}
              </div>
              <div className="mt-2 text-[16px] font-bold">{s.title}</div>
              <div className="mt-1.5 text-[13px] leading-relaxed text-faint">
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 功能特性 */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2
          className="text-center text-[28px] font-black"
          style={{ fontFamily: "var(--font-title)" }}
        >
          为「测评发文」打磨的每一处细节
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-line bg-card p-5 transition-colors hover:border-ink/30"
            >
              <div className="text-[22px]">{f.icon}</div>
              <div className="mt-2.5 text-[14px] font-bold">{f.title}</div>
              <div className="mt-1.5 text-[12.5px] leading-relaxed text-faint">
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 隐私与架构 */}
      <section className="border-t border-line bg-card/60">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center">
          <h2
            className="text-[24px] font-black"
            style={{ fontFamily: "var(--font-title)" }}
          >
            你的 Key，只属于你
          </h2>
          <p className="mt-4 text-[13.5px] leading-relaxed text-faint">
            API Key 仅保存在<span className="text-ink">你浏览器的 localStorage</span>
            ，请求经页面同源的轻量代理直连各厂商（仅为解决浏览器跨域），
            服务端<span className="text-ink">不记录、不落盘</span>任何密钥与对话内容。
            介意经过任何服务器？项目完全开源——
            <code className="num rounded bg-paper px-1.5 py-0.5 text-[12px]">
              git clone && npm run dev
            </code>
            ，两分钟跑在自己电脑上。
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link
              href="/arena"
              className="rounded-lg bg-ink px-6 py-2.5 text-[14px] font-bold text-paper hover:opacity-90"
            >
              立即开始 ▶
            </Link>
            <a
              href={GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-line bg-card px-6 py-2.5 text-[14px] font-semibold hover:border-ink/40"
            >
              查看源码
            </a>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-8 text-[12px] text-faint">
        <span>
          Model Arena ·{" "}
          <a href="https://amaletter.com" className="hover:text-ink">
            amaletter.com
          </a>
        </span>
        <span className="num">
          首Token 含网络往返 · TPS 按阶段活跃窗口独立计算 · tokens 官方 usage 优先
        </span>
      </footer>
    </div>
  );
}
