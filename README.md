# 百模竞速 · Model Arena

同一个 Prompt 并发打到多个大模型，流式对比**首 Token 时延、思考 TPS、输出 TPS、峰值速度、总 Tokens、总用时**，为 AI 测评创作而生——截图即可发文。

**在线版**：https://arena.amaletter.com （API Key 只存你的浏览器，服务端不记录任何密钥与内容）

出品：[AI拯救打工人](https://www.xiaohongshu.com/user/profile/6467b1210000000010027a51)（小红书 ai_love_worker）

## 本地运行

```bash
npm install
npm run dev
```

打开 http://localhost:3000 —— `/` 是介绍页，`/arena` 是对比工具。本地运行可直连 Ollama 等本机模型（公网版出于安全禁止访问内网地址）。

## 使用流程

1. **⚙ 模型接入** — 选厂商预设（DeepSeek / Kimi / 智谱 / 通义 / 豆包 / 阶跃 / MiniMax / 硅基流动 / OpenAI / Claude / Gemini / Grok / Groq / OpenRouter / Ollama 本地 / 任意 OpenAI 兼容接口），填 API Key 和模型 ID
2. 顶部点击输入**标题和备注**（如「XX 模型实测 + 结论」），截图时直接成为文章配图的标题
3. 输入 Prompt（或用 ⚡ 预设测速 Prompt），点**开始对比** — 所有勾选的模型同时起跑
4. 跑完后：🥇🥈🥉 按完成先后排名；**⧉ 复制指标表**可把全部指标导出为 Markdown 表格直接贴进文章；**📷 截图模式**隐藏所有操作按钮，画面干净

## 指标口径

| 指标 | 含义 |
| --- | --- |
| 首Token | 请求发出 → 收到第一个 token（思考或正文），含网络往返 |
| 思考TPS | 推理模型思考阶段的 tokens/秒（思考过程单独折叠展示） |
| 输出TPS | 正文阶段的 tokens/秒 |
| 平均TPS | 输出总 tokens ÷（首 token 到结束的时间） |
| 总Tokens | 优先采用厂商官方 usage（标「官方」）；缺失时按字符估算（标「估算」） |

每张卡片还有实时速度曲线（sparkline）、运行中实时 tok/s、单模型「重跑」。

- **速度曲线可点击放大**：峰值/平均参考线、悬停查看任意时刻的 tok/s、一键下载 PNG
- **SVG 自动预览**：模型输出里包含 `<svg>` 代码时自动渲染缩略图（img 沙箱，脚本不执行），适配「画鹈鹕骑自行车」类测评
- **模型接入页**支持「⇩ 拉取模型列表」（调厂商 /models 接口）和「⚡ 测试连接」（最小补全请求验证 URL/Key/模型）
- **每个模型可配「额外请求参数」(JSON)**：原样合并进请求体，用于 think/no-think 等厂商私有开关（内置 Qwen/GLM/豆包/vLLM/Claude 常用快捷芯片）；同一模型用「复制」建 think 和 no-think 两份即可同场竞速
- **水印**：💧 按钮设置你的小红书/Twitter ID，显示在页头信息行 + 右下角徽标（可选平铺防盗水印），复制的 Markdown 也带署名
- 思考区与正文区各自独立自动滚动（向上翻则停住，新一轮自动恢复）
- **「思考统计」开关**：关闭后不拆分思考/输出——首Token 按首个正文 token 计（思考时间计入等待），速度只按正文 token 计算，指标栏 4 列变 3 列，导出表同步简化
- 部分厂商（如阶跃）官方 usage 的 reasoning_tokens 恒为 0，此时思考 token 按字符比例从官方总量中拆分估算
- **🕹 HTML 沙箱预览**：输出包含完整 HTML 文档（如单文件贪吃蛇）时，跑完后在 sandbox iframe 里直接可玩——脚本运行但与页面完全隔离
- **🖼 图片输入对比**：上传一张图随 Prompt 发给所有模型，对比各家视觉模型的识图速度与质量（浏览器端自动压缩，OpenAI 兼容与 Anthropic 协议都支持）
- **📊 历史趋势**：同一模型在历次对比中的输出 TPS 走势图，跟踪厂商高峰变慢/版本提速
- **🌙 暗色主题**：一键切换，记忆偏好，刷新无闪烁

## 安全与隐私

- API Key 只存在**你浏览器的 localStorage**，请求经站点同源的轻量代理（`/api/chat`，仅为解决浏览器跨域）直连各厂商，服务端不记录、不落盘任何密钥与对话内容
- 公网部署版内置 SSRF 防护（`lib/upstream-guard.ts`）：禁止把代理请求打向本机/内网/云元数据地址
- 介意密钥经过任何服务器？克隆本仓库本地运行即可，功能完全一致

### 可选的匿名指标共享（默认关闭）

首次跑完对比后会询问一次，**明确同意后**才会把评测指标匿名上报用于分析，且可随时在工具条关闭：

- **会保存**：模型供应商（仅接口域名）、模型名、各阶段时延与 TPS、峰值、输入/输出的 token 数与字符**长度**、时间、是否成功、匿名设备 ID（随机 UUID，非浏览器指纹，清空浏览器数据即重置）
- **永不保存**：API Key、Prompt 内容、模型输出/思考内容、上传的图片
- 同意/拒绝记录本身也会留痕（匿名 ID + 声明版本 + 时间 + UA），便于合规审计

自部署启用方式：在 [Supabase](https://supabase.com) 建项目 → SQL Editor 执行 `supabase/schema.sql` → 给部署环境配置 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 两个环境变量。未配置时遥测整体禁用，不影响任何功能。

## 架构

- `app/api/chat/route.ts` — 流式代理：把 OpenAI 兼容协议与 Anthropic 原生协议统一成一种 SSE 事件流（`delta / usage / done / error`），顺带解决浏览器 CORS
- `lib/runner.ts` — 浏览器端计时与指标计算（TTFT、思考/输出分段、滑动窗口瞬时速度）
- `lib/providers.ts` — 厂商预设与预设 Prompt，自行加新厂商只需加一条记录
- 历史记录、标题备注、参数全部 localStorage 持久化
