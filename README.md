# 百模竞速 · TOKRACE

> 同一个 Prompt，并发打到多个大模型，**实时对比首 Token 时延、思考 / 输出速度（tokens/s）、峰值速度、token 数与总用时**。为 AI 测评创作而生——截图即可发文。

<p align="center">
  <a href="https://www.tokrace.com"><b>🚀 立即免费试用 → www.tokrace.com</b></a>
</p>

**🎁 无需注册、无需 API Key，打开就能跑。** 站点预置了 DeepSeek V4、Kimi、小米 MiMo、智谱 GLM-5、阶跃 Step 等热门国产大模型，**每天免费对比 5 次**（登录后 15 次）。想无限使用？填你自己的 API Key 即可——**Key 只存你本地浏览器**。

出品：[AI拯救打工人](https://www.xiaohongshu.com/user/profile/6467b1210000000010027a51)（小红书 ai_love_worker）

---

## 它能帮你做什么

- **横评测速**：DeepSeek vs Kimi vs GPT vs Claude vs 通义 vs 豆包……同一道题、同一时刻并发起跑，谁快谁慢一目了然。
- **看清"快"在哪**：首 Token 时延（TTFT）、思考阶段 TPS、正文输出 TPS、峰值速度——而不是只有一个笼统的"快/慢"。
- **为发文而生**：可编辑标题/备注、一键导出长图、指标表复制成 Markdown、截图模式、自定义水印——测完直接出图发小红书 / X / 公众号。
- **沉淀数据**：全网用户匿名贡献的[实测速度排行榜](https://www.tokrace.com/stats)、模型口碑[人气榜](https://www.tokrace.com/board)、每个模型的[速度永久页](https://www.tokrace.com/model)。

## ✨ 功能亮点

**测速核心**
- 16+ 厂商开箱即用：DeepSeek / Kimi / 智谱 / 通义 / 豆包 / 阶跃 / 小米 MiMo / MiniMax / 硅基流动 / OpenAI / Claude / Gemini / Grok / Groq / OpenRouter / Ollama 本地，以及**任意 OpenAI 兼容接口**；同时支持 Anthropic 原生协议。
- 每张卡片：实时速度曲线、运行中实时 tok/s、单模型「重跑」；曲线可点击放大（峰值/平均参考线 + 悬停读数 + 下载 PNG）。
- **峰值 TPS**（2s 滑动窗口、按官方 token 校准）——和厂商宣传口径可比。
- 每个模型可配「额外请求参数」(JSON)，think / no-think 等私有开关一键切换、同场竞速。

**创作 / 发文**
- 🖼 一键导出长图（标题/备注/水印/卡片 2x PNG）、⧉ 指标表复制成 Markdown、📷 截图模式、💧 自定义水印。
- 🕹 HTML 沙箱预览（贪吃蛇等单文件 HTML 跑完即玩）、SVG 自动渲染（"鹈鹕骑车"类题）、🖼 图片输入对比（识图速度横评）。
- 字数核对（揭穿"5000 字"谎报）、📊 紧凑模式、🌙 暗色主题。

**数据 / 社区**
- 🏆 [实测速度排行榜 /stats](https://www.tokrace.com/stats)：匿名汇总的中位/平均 TPS、首响、峰值、样本数。
- 🔗 **只读分享链接**：把一次对比（含速度曲线）生成网页分享给别人，可点赞/评论；历史记录也能分享。
- 📈 历史趋势：同一模型在你历次对比中的速度走势。

**账号 / 同步（可选）**
- GitHub / Google / 邮箱登录；跨设备**端到端加密**云同步（同步密码只在你本地，服务器只存密文）。
- 同步支持「合并 / 覆盖」两种模式。

> 📐 各项指标如何测量、为什么公平，见[测速方法论](https://www.tokrace.com/method)。

## 指标口径

| 指标 | 含义 |
| --- | --- |
| 首Token（TTFT） | 请求发出 → 收到第一个 token（思考或正文） |
| 思考TPS | 推理模型思考阶段的 tokens/秒（思考过程单独折叠展示） |
| 输出TPS | 正文阶段的 tokens/秒 |
| 峰值TPS | 2 秒滑动窗口的瞬时最高速度，按官方 token 校准 |
| 总Tokens | 优先采用厂商官方 usage（标「官方」）；缺失时按字符估算（标「估算」） |

计时在浏览器端逐 token 测量，并用服务端时间戳校准（排除浏览器渲染卡顿）；所有模型并发同测，保证横向对比公平。

## 本地运行

```bash
npm install
npm run dev      # 默认 http://localhost:3000
```

`/` 是介绍页，`/arena` 是对比工具。本地运行可直连 Ollama 等本机模型（公网版出于安全禁止访问内网地址）。

数据后端（排行榜 / 分享 / 账号同步 / 免费体验额度）均为**可选**：不配 Supabase 时这些功能自动禁用，纯本地填自己的 Key 也能完整测速。自部署详见 `supabase/schema.sql`、`supabase/migrations/`。

## 安全与隐私

- **你自己的 API Key 只存在你浏览器的 localStorage**；请求经站点同源的轻量代理（`/api/chat`，仅为解决浏览器跨域）**转发**到各厂商，服务端不记录、不落盘任何密钥与对话内容。
- **免费体验额度**用的是站点维护的共享 key——它只存在服务端环境变量，由服务端注入，**客户端永远拿不到**。
- 公网部署内置 SSRF 防护（`lib/upstream-guard.ts`）：禁止把代理请求打向本机/内网/云元数据地址。
- 介意请求经过任何服务器？克隆本仓库本地运行即可，功能完全一致。

### 匿名指标共享（默认关闭）

首次跑完会询问一次，**明确同意后**才会匿名上报评测指标用于排行榜，随时可关。**只上报数字指标**（供应商域名、模型名、各阶段时延/TPS、token 数与字符长度、是否成功、随机匿名 ID）；**永不上报** API Key、Prompt 内容、模型输出、图片。匿名 ID 是随机 UUID，**不做浏览器指纹**，清空浏览器数据即重置。

## 架构

- `app/api/chat/route.ts` — 流式代理：OpenAI 兼容协议与 Anthropic 原生协议统一成一种 SSE 事件流（`delta / usage / done / error`），并处理浏览器 CORS。
- `lib/runner.ts` — 浏览器端计时与指标计算（TTFT、思考/输出分段、滑动窗口瞬时速度）。
- `lib/providers.ts` — 厂商预设；加新厂商只需加一条记录。
- Next.js 16（App Router）+ Tailwind v4；排行榜/分享/账号走 Supabase（可选）。

---

<p align="center">
  <a href="https://www.tokrace.com"><b>👉 去 www.tokrace.com 免费试一轮</b></a><br/>
  <sub>大模型速度对比 · LLM speed benchmark · 首 Token 时延 / tokens per second 实测</sub>
</p>
