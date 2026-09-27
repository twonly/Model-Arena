# 首 Token 等待诊断与修复（2026-09-26）

## 结论

分享 `jB0kJUn5KJ` 中 UltraSpeed 的 19.605 秒是代理侧首次有效 token 等待，并非单独的建连时间。此前 12 次串行复测，以及本次两轮六模型并发复测，都没有复现它。不能据此确认小米内部排队，也不能宣称已经消除厂商偶发延迟。

两轮生产并发复测使用原提示和同一组六个模型，沿用当前路由计划：MiMo/DeepSeek 走 Vercel，GLM 走 Cloudflare。12 个请求均完成。UltraSpeed 的代理侧首 token 分别为 1.836 秒、0.850 秒。测试使用本地已配置的 Key；无法确认与历史请求是同一个账号，GLM 使用当前配置的 Coding 接口，因此不是原请求环境的完全重现。

证据：`output/ttft-concurrent-production.json`。此前串行复测见 `output/ttft-diagnosis-2026-09-26.md`。

## 已修复的本站问题

- “连接中”改为“等待首Token”，避免把上游计算、排队或缓冲等待都解释为建连。
- 保留原有代理侧 TTFT 和速度口径，另显示客户端实际等待。计时详情列出客户端准备、代理准备、上游响应头、首字节、首有效 token、重试次数；诊断记录保存客户端收到响应头及首正文时间。
- 首个诊断事件在请求上游前发出，尽早打开 SSE。诊断、空角色事件、心跳不计为首 token。
- 原先任何 HTTP 400/422 都重试一次；现在只对明确提及 `stream_options` 或 `include_usage` 的参数拒绝做一次兼容重试，其他错误直接返回。
- 保存经过格式和长度检查的请求 ID、completion ID，以及有限的数值型厂商耗时字段；不保存请求头、Key、Prompt 或输出到诊断日志。小米 `usage.pd` 的字段保持原名，不解释成已验证的排队时间。
- 首 token 等待加代理准备达到 10 秒时写入 `chat_timing` 运行日志，便于按时间和上游 ID 追查。平台调度到路由执行前的耗时仍不可由应用时钟直接测得。
- 诊断随已有 metrics 一起保存在历史和分享快照；失败时也保留已获得的诊断。旧记录不补造数据，不需要数据库迁移。
- Cloudflare 复用与 Vercel 相同的流解析逻辑，保留原有 ticket、CORS、额度和上游 User-Agent 行为。

## 时钟边界

`client*Ms` 从客户端调用开始累计计时。`proxyPrepareMs` 是代理进入处理函数后到开始请求上游前的准备耗时。`upstream*Ms` 从开始请求上游起累计计时，包括可能的兼容重试；不是独立阶段时长，不能相加。

上游计时仍包含网络、服务端调度、计算和流式缓冲。没有厂商明确的队列时长或请求追踪回执，无法进一步确认“排队”。外部时延不能被标注为纯 GPU 推理耗时。

## 验证

- 整合图标更新后的主工作目录：149 项测试通过。
- Next.js 默认 Turbopack 生产构建通过；Cloudflare Wrangler dry-run 打包通过。
- 新增回归检查覆盖两种模型协议、Cloudflare 通路、空事件、分阶段时钟、请求 ID/数值白名单、重试边界、分享保存和失败诊断。
- 修复后的本地代理真实调用小米 UltraSpeed 成功：客户端首 token 1434 ms，上游首 token 861 ms，代理准备 0 ms，上游响应头 784 ms、首字节 786 ms，尝试次数 1。此请求不能与历史 19.6 秒视为严格的优化前后对照。
- Playwright 用真实调用结果恢复历史，在桌面和 390 px 手机宽度检查计时详情；无横向溢出，无浏览器错误。截图见 `output/playwright/ttft-desktop.png` 与 `output/playwright/ttft-mobile.png`。

真实调用回执：`output/ttft-live-local-state.json`。

## 发布状态

修复保留并行完成的模型图标更新；已于 2026-09-27 提交、推送并发布 Next.js 应用和 Cloudflare Worker。新旧客户端/代理通过可选诊断事件兼容。上线六模型验收捕获到 UltraSpeed 的 71.652 秒首响及小米回传的 70.685 秒计算等待字段，见 [发布记录](./ttft-release-2026-09-27.md)。

诊断脚本：`node --env-file=.env.local automation/diagnose-ttft.mjs`。只需离线检查时运行 `node automation/diagnose-ttft.mjs --self-test`。
