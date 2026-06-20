<div align="center">

# TOKRACE 百模竞速

**A real-time LLM speed test and model benchmark tool for developers, AI reviewers, and model selection teams.**

**同一个 Prompt，并发横评多个大模型，实时比较首 Token 时延、输出 TPS、峰值速度、token 消耗和完整输出证据。**

[![Website](https://img.shields.io/badge/Website-www.tokrace.com-111111?style=flat-square)](https://www.tokrace.com)
[![GitHub stars](https://img.shields.io/github/stars/twonly/Model-Arena?style=flat-square)](https://github.com/twonly/Model-Arena)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[Live Demo](https://www.tokrace.com) ·
[Speed Board](https://www.tokrace.com/stats) ·
[Audience Board](https://www.tokrace.com/board) ·
[Pricing Table](https://www.tokrace.com/pricing) ·
[Methodology](https://www.tokrace.com/method)

</div>

![TOKRACE social preview](https://www.tokrace.com/opengraph-image)

TOKRACE is an **LLM benchmark** and **AI model speed test** web app. It runs the same prompt across multiple LLMs at the same time, then records TTFT (time to first token), reasoning TPS, output TPS, peak tokens per second, total tokens, latency curves, model output, and shareable evidence pages.

百模竞速 TOKRACE 是面向 AI 测评作者、开发者和模型选型团队的大模型测速工具。它把“哪个模型更快”的主观体感，变成可复查、可分享、可复跑的数据证据链，适合做 DeepSeek、Kimi、GPT、Claude、Gemini、GLM、Qwen、Doubao、StepFun、MiniMax、Ollama 等模型的真实任务横评。

## Why TOKRACE

Most LLM benchmarks focus on answer quality or synthetic scores. TOKRACE focuses on the speed you actually feel when building products or writing model reviews:

- **Same prompt, parallel runs**: reduce noise from sequential tests and changing network conditions.
- **Real streaming metrics**: TTFT, reasoning speed, output speed, peak TPS, total duration, token usage, and official usage status.
- **Shareable evidence**: export long screenshots, copy Markdown tables, create public snapshots, and let readers rerun the same prompt.
- **OpenAI-compatible and Anthropic-native APIs**: compare hosted models, local models, and custom endpoints in one arena.
- **Reviewer-friendly output**: HTML sandbox preview, SVG rendering, image input comparison, word-count checks, and review draft helpers.

## 中文简介

如果你正在找 **大模型测速工具**、**AI 模型评测工具**、**LLM benchmark 中文**、**模型响应速度对比**、**首 Token 延迟测试**、**tokens per second 测试**、**DeepSeek Kimi GPT Claude 速度对比**，TOKRACE 解决的是同一个问题：用同一任务并发测试多个模型，把速度、输出、token 和证据页放到同一张表里比较。

适合这些场景：

| 场景 | TOKRACE 提供什么 |
| --- | --- |
| AI 测评作者 / 自媒体 | 一键生成速度曲线、长图、Markdown 表格和可复查分享页 |
| 开发者 / API 使用者 | 在真实 prompt 下比较首响、吞吐、稳定性、token 用量和成本 |
| 产品 / 团队选型 | 用同一份数据讨论模型选择，而不是凭体感争论 |
| 本地模型玩家 | 将 Ollama 或任意 OpenAI 兼容接口与云端模型放在同一轮里测 |

## Core Features

### Real-Time LLM Speed Benchmark

- Run multiple models concurrently with one prompt.
- Measure TTFT, reasoning TPS, output TPS, average TPS, peak TPS, total time, and token usage.
- Show per-model live speed curves with hover values and PNG export.
- Calibrate peak TPS with official token totals when provider usage is available.

### Model and Provider Support

- Built-in presets for DeepSeek, Kimi, Zhipu GLM, Qwen, Doubao, StepFun, MiniMax, OpenAI, Anthropic Claude, Google Gemini, xAI Grok, Groq, OpenRouter, SiliconFlow, and Ollama.
- Supports both OpenAI-compatible `/chat/completions` APIs and native Anthropic Messages API.
- Per-model extra JSON parameters for thinking switches, `temperature`, `max_tokens`, `thinking.budget_tokens`, vendor-specific options, and vision inputs.
- Connectivity test and model list fetch for quickly validating a new endpoint.

### Evidence, Sharing, and Review Workflow

- Export long comparison screenshots with title, notes, watermark, compact mode, and screenshot mode.
- Copy Markdown metric tables for blog posts, README files, X/Twitter, Xiaohongshu, WeChat, and technical reports.
- Create share pages where readers can inspect model outputs, copy the setup, or rerun with the same prompt.
- Render model-generated HTML/Canvas/3D snippets inside a sandbox, and render SVG outputs as inert image previews.

### Data and SEO Surfaces

- [Speed leaderboard](https://www.tokrace.com/stats): anonymous aggregate TTFT, output TPS, peak speed, token counts, and confidence labels.
- [Audience board](https://www.tokrace.com/board): model voting and comments.
- [Model pages](https://www.tokrace.com/model/deepseek-v4-flash): long-term model detail pages.
- [Model comparison pages](https://www.tokrace.com/compare/deepseek-v4-flash-vs-step-3-7-flash): SEO-friendly pair comparison pages.
- [LLM API pricing table](https://www.tokrace.com/pricing): input, cache-hit, and output prices for mainstream models.

## Quick Start

### Use the Hosted App

1. Open [www.tokrace.com](https://www.tokrace.com).
2. Click the sample run button to test preset models without registration or API keys.
3. Switch to professional mode to add your own provider, model ID, base URL, and API key.
4. Export screenshots, copy Markdown, create a share page, or contribute anonymous metrics.

Preset shared models are server-side only. Anonymous users can run sample comparisons for free; signed-in users get a higher daily quota. Your own API keys stay in your browser local storage and are never written to the TOKRACE database.

### Run Locally

```bash
git clone https://github.com/twonly/Model-Arena.git
cd Model-Arena
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful commands:

```bash
npm test
npm run build
npm start
```

Supabase is optional. Without Supabase, the app still works as a local model speed bench with your own API keys; hosted features such as public share pages, account sync, leaderboards, free quotas, and referral rewards degrade gracefully.

## Metrics

| Metric | Meaning |
| --- | --- |
| TTFT / Time to first token | Time from request start to first streamed token, including network and provider queueing |
| Reasoning TPS | Tokens per second during reasoning / thinking output |
| Output TPS | Tokens per second during final answer output |
| Average TPS | Active streaming speed from first token to last token |
| Peak TPS | Highest 2-second sliding-window speed, calibrated with official token totals when possible |
| Total tokens | Official usage first; unified estimation when official usage is unavailable |

See the full [measurement methodology](https://www.tokrace.com/method) for timing boundaries, token accounting, fairness notes, and confidence labels.

## Architecture

| Layer | Stack |
| --- | --- |
| Web framework | Next.js 16 App Router, React 19 |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |
| Streaming proxy | Route Handler normalizes OpenAI-compatible and Anthropic-native streams into one SSE format |
| Optional backend | Supabase for shares, leaderboards, account sync, quota, referrals, and admin tools |
| Export and analytics | html-to-image, Vercel Analytics, Vercel Speed Insights |
| Tests | `node:test` plus focused mock-SSE and utility tests |

Key files:

| Path | Responsibility |
| --- | --- |
| `app/api/chat/route.ts` | Streaming proxy for OpenAI-compatible and Anthropic-native APIs |
| `lib/runner.ts` | Browser-side timing and metric calculation |
| `lib/shared-models.ts` | Free sample model pool configuration |
| `lib/providers.ts` | Provider presets and prompt examples |
| `lib/svg.ts` | SVG and HTML sandbox extraction for model-generated visual output |
| `lib/pricing.ts` | Model price matching and cost estimation |
| `supabase/migrations/` | Optional database schema |

## Privacy and Security

- User-provided API keys are stored locally in the browser, not in the database.
- The server-side proxy exists to avoid browser CORS issues and normalize streaming formats.
- Shared sample model keys are injected on the server and never sent to the client.
- Anonymous telemetry is opt-in and excludes prompts, model outputs, images, and API keys.
- Upstream URL validation blocks localhost, private networks, and cloud metadata addresses to reduce SSRF risk.

## GitHub SEO Notes

Maintaining this README is the foundation, but it is not the whole GitHub SEO strategy. For best discovery, also keep the repository metadata aligned:

- **Description**: `Real-time LLM speed test and AI model benchmark tool for TTFT, TPS, token usage, and shareable model comparison evidence.`
- **Website**: `https://www.tokrace.com`
- **Topics**: `llm`, `llm-benchmark`, `ai-models`, `model-evaluation`, `openai`, `anthropic`, `nextjs`, `typescript`, `tokrace`, `ttft`, `tokens-per-second`
- **Pinned links**: homepage, speed board, pricing table, model comparison pages, and methodology.
- **Release notes**: publish short releases when adding providers, pricing pages, benchmarks, or sharing improvements.

README maintenance helps GitHub search and Google index the repository page, while the strongest SEO comes from the full loop: repository topics, stars, releases, backlinks, public comparison pages, and consistent anchor text from articles and social posts.

## FAQ

### Is TOKRACE a quality benchmark or a speed benchmark?

TOKRACE is primarily a speed and evidence benchmark. It measures streaming latency, throughput, token usage, and output evidence for the same prompt across models. It can support quality reviews, but it does not replace task-specific human evaluation.

### Can I benchmark my own private model?

Yes. Add any OpenAI-compatible endpoint, Anthropic-native endpoint, or local Ollama-compatible endpoint in professional mode.

### Does TOKRACE upload my prompt or output?

No by default. Prompts, outputs, images, and API keys are not included in anonymous telemetry. Public share pages are created only when you explicitly generate a share snapshot.

### Can readers rerun my benchmark?

Yes. Share pages preserve the prompt, selected model IDs, notes, metrics, and outputs. Readers can copy the setup or rerun the same prompt with their own API keys or the free sample models.

### Does the hosted app require registration?

No. New users can run free samples without registration. Signing in increases daily quota and enables account sync.

## Contributing

Contributions are welcome for provider presets, prompt templates, pricing data, UI improvements, bug fixes, and documentation.

1. Fork the repository.
2. Create a focused branch.
3. Run `npm test` and `npm run build` before opening a pull request.
4. Describe what changed and how it was verified.

Repository: [github.com/twonly/Model-Arena](https://github.com/twonly/Model-Arena)

## Contact

- Website: [www.tokrace.com](https://www.tokrace.com)
- Xiaohongshu: [ai_love_worker / AI拯救打工人](https://www.xiaohongshu.com/user/profile/6467b1210000000010027a51)
- Speed board: [tokrace.com/stats](https://www.tokrace.com/stats)
- Pricing table: [tokrace.com/pricing](https://www.tokrace.com/pricing)

If TOKRACE helps your model review, product evaluation, or API selection workflow, consider starring the repository and linking back to a relevant share page or model comparison page.

---

<div align="center">

**Run a real LLM speed benchmark at [www.tokrace.com](https://www.tokrace.com).**

大模型测速工具 · AI 模型评测工具 · LLM benchmark · LLM speed test · model comparison · TTFT · tokens per second · TPS · DeepSeek Kimi GPT Claude Gemini speed comparison · OpenAI compatible benchmark

</div>
