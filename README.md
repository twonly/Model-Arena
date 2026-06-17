# 百模竞速 · TOKRACE

> 面向 AI 测评作者、开发者和模型选型团队的大模型测速工具。用同一个 Prompt 并发测试多个 LLM，实时记录首 Token 时延（TTFT）、输出速度（TPS / tokens per second）、峰值速度、token 消耗、速度曲线和完整对比证据。

<p align="center">
  <a href="https://www.tokrace.com"><b>立即免费体验 → www.tokrace.com</b></a>
</p>

**不用注册、不用 API Key，也能先跑样例。** TOKRACE 预置 DeepSeek、Kimi、Step、智谱、通义、豆包等模型接口，匿名用户每天可免费跑 5 次，登录后每天 15 次。要长期评测或接入私有模型，填自己的 API Key 即可，Key 只保存在你的浏览器本地。

出品：[AI拯救打工人](https://www.xiaohongshu.com/user/profile/6467b1210000000010027a51)（小红书 ai_love_worker）

---

## 适合谁

- **AI 测评博主 / 自媒体作者**：用同一套 Prompt 横评 DeepSeek、Kimi、GPT、Claude、Gemini、通义、豆包等模型，导出长图、速度曲线和 Markdown 指标表，方便写小红书、公众号、X、博客。
- **开发者 / API 使用者**：比较不同模型和不同供应商在真实任务里的首响、吞吐、稳定性和 token 用量，辅助判断接入哪一个模型。
- **产品和团队选型**：用可复查的分享页沉淀模型对比证据，把“感觉哪个模型快”变成可讨论的数据。
- **本地模型玩家**：本地运行后可接 Ollama 或任意 OpenAI 兼容接口，把云端模型和本地模型放在同一张测速表里比较。

## 你可能正在搜索这些问题

如果你在找 **大模型测速工具、AI 模型评测工具、LLM benchmark 中文、模型响应速度对比、首 Token 延迟测试、tokens per second 测试、token 消耗统计、模型输出速度曲线、AI 博主模型横评工具、DeepSeek Kimi GPT Claude 速度对比、LLM 速度排行榜、OpenAI compatible benchmark**，TOKRACE 解决的是同一个问题：让同一任务下的多模型速度和输出结果可以并排比较、保存、分享和复查。

## 核心能力

**实时测速与指标**

- 同一个 Prompt 同时发送到多个模型，减少顺序测试带来的网络和时段偏差。
- 记录首 Token 时延（TTFT）、思考阶段 TPS、正文输出 TPS、平均 TPS、峰值 TPS、总耗时、token 数和官方 usage 状态。
- 每个模型都有实时速度曲线，支持放大查看、悬停读数和下载 PNG。
- 峰值 TPS 使用 2 秒滑动窗口，并按官方 token 总量校准，避免只看单点主观体感。

**模型与接口**

- 支持 DeepSeek / Kimi / 智谱 / 通义 / 豆包 / 阶跃 / MiniMax / OpenAI / Claude / Gemini / Grok / Groq / OpenRouter / 硅基流动 / Ollama 等常见模型供应商。
- 支持任意 OpenAI 兼容接口，也支持 Anthropic 原生协议。
- 每个模型可配置额外 JSON 参数，用于 think / no-think、temperature、max_tokens 等私有开关。
- 提供连通性测试和模型列表拉取，适合快速验证一个新接口能不能用。

**创作与分享**

- 一键导出长图，支持标题、备注、水印、截图模式和紧凑模式。
- 一键复制 Markdown 指标表，适合放进文章、评测帖或 README。
- 分享页支持“复制这次评测”和“用同样 Prompt 跑一轮”，读者可以复查你的评测设置。
- 支持 HTML 沙箱预览、SVG 自动渲染、图片输入对比和字数核对。

**数据沉淀**

- [实测速度排行榜](https://www.tokrace.com/stats)：匿名汇总输出 TPS、首 Token、峰值速度和样本数，并展示样本可信度标签。
- [模型人气榜](https://www.tokrace.com/board)：基于用户投票和评论沉淀模型口碑。
- 模型详情页和对比页用于沉淀长期趋势。
- 账号体系支持跨设备加密同步；邀请好友完成首次对比后可获得额外免费体验次数。

> 指标定义和公平性说明见 [测速方法论](https://www.tokrace.com/method)。

## 快速开始

### 在线体验

1. 打开 [www.tokrace.com](https://www.tokrace.com)。
2. 点“立即跑样例”，无需注册即可用预置模型跑一轮。
3. 想用自己的模型配置，进入专业模式，填入供应商、模型 ID 和 API Key。
4. 跑完后可导出长图、复制 Markdown、生成分享页或匿名贡献指标到排行榜。

### 本地运行

```bash
npm install
npm run dev
```

默认打开 `http://localhost:3000`。`/` 是首页，`/arena` 是模型对比工具。数据后端（排行榜、分享、账号同步、免费额度、邀请奖励）都是可选能力；不配置 Supabase 时，这些功能会自动降级，纯本地填自己的 Key 也能完整测速。

## 指标口径

| 指标 | 含义 |
| --- | --- |
| 首 Token / TTFT | 请求发出到收到第一个 token，包含网络往返和模型排队 |
| 思考 TPS | 推理模型 reasoning / thinking 阶段的 tokens per second |
| 输出 TPS | 正文输出阶段的 tokens per second |
| 平均 TPS | 从首 token 到末 token 的整体活跃输出速度 |
| 峰值 TPS | 2 秒滑动窗口里的最高瞬时速度，按官方 token 总量校准 |
| 总 Tokens | 优先使用厂商官方 usage；缺失时使用统一估算并明确标记 |

计时在浏览器端逐 token 测量，并结合服务端时间戳校准，避免浏览器渲染卡顿污染结果。所有模型在同一轮里并发开跑，方便横向比较。

## 免费额度、自带 Key 与隐私

- 免费体验模式使用站点维护的共享 Key，客户端拿不到这些密钥。
- 匿名用户每天 5 次免费对比，登录用户每天 15 次；邀请好友注册并完成首次对比后，双方可获得额外体验次数。
- 你自己的 API Key 只存在浏览器 localStorage；请求经同源轻量代理转发到厂商，服务端不记录、不落盘密钥和对话内容。
- 匿名指标共享默认关闭。只有你明确同意后，才会上报供应商、模型名、速度、token、成功状态等数字指标；不会上传 Prompt、模型输出、图片或 API Key。
- 公网部署有 SSRF 防护，禁止把代理请求打向本机、内网或云元数据地址。

## 常见问题

**TOKRACE 能统计 token 消耗吗？**
可以。优先读取厂商官方 usage，包括输入 tokens、输出 tokens、reasoning tokens；没有官方数据时会用统一估算，并在界面中标明。

**它适合 AI 博主做模型横评吗？**
适合。TOKRACE 的核心场景就是“同一 Prompt、多模型并发、速度曲线、token 消耗、输出内容、长图和分享页”这一整套评测证据链。

**样例模式和专业模式有什么区别？**
样例模式用预置模型和免费额度，适合新用户快速理解产品；专业模式使用你自己的模型配置和 API Key，适合长期评测和接入私有接口。

**分享出去后别人能复跑吗？**
可以。分享页可以复制完整评测配置，也可以只复制 Prompt，用自己的模型或免费样例重新跑一轮。

**能自部署吗？**
可以。项目是 Next.js 16 App Router + Tailwind v4；Supabase 只负责可选的排行榜、分享、账号同步、免费额度和邀请奖励。

## 项目结构

- `app/api/chat/route.ts`：流式代理，把 OpenAI 兼容协议和 Anthropic 原生协议统一成 SSE 事件流。
- `lib/runner.ts`：浏览器端计时和指标计算，包含 TTFT、分段 TPS、峰值 TPS 和 token 口径处理。
- `lib/providers.ts`：模型供应商预设和默认示例配置。
- `lib/telemetry.ts`：用户同意后才启用的匿名指标共享。
- `supabase/migrations/`：可选后端能力的数据库迁移脚本。

---

<p align="center">
  <a href="https://www.tokrace.com"><b>去 www.tokrace.com 跑一轮模型测速</b></a><br/>
  <sub>大模型测速工具 · AI 模型评测工具 · LLM benchmark · TTFT · TPS · tokens per second · token 消耗统计</sub>
</p>
