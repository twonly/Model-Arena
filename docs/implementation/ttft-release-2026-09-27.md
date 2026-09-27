# TTFT 诊断发布及首次慢请求回执

2026-09-27，按用户“上线吧”的指令发布。先同步主分支 `548095b`，保留后台报告审批更新；诊断代码提交 `994aec5` 已推送到 `origin/main`。

- Vercel 首次诊断发布：`dpl_DTQx5vgiHcs4EjxfQgAgCN7HWRf2`，Ready，已绑定 `www.tokrace.com`。
- Cloudflare Worker：`c7f9bd61-b35c-4d0c-9903-2c9c399ad353`，已绑定 `chat.tokrace.com`。
- 发布前 Vercel：`dpl_3CAperPb3aUYWJUBmRKSX9JYEdwH`；Worker：`17921584-0669-4ef7-a922-ebb745f135bc`。
- 没有改变全站模型通路配置，没有数据库迁移。

## 真正捕获到 UltraSpeed 长等待

上线后在真实浏览器使用原分享提示，执行六模型并发。六请求全部完成，四条 Vercel、两条 Cloudflare 通路均有分阶段计时、尝试次数和厂商 completion ID。UltraSpeed 此次首 Token 为 **71.652 秒**。

| 回执字段 | 数值 |
| --- | ---: |
| 本站代理准备 | 4 ms |
| 上游响应头 | 5383 ms |
| 上游首字节 | 5384 ms |
| 上游首 Token | 71652 ms |
| 客户端实际首 Token 等待 | 72577.6 ms |
| 上游尝试次数 | 1 |
| HTTP 状态 | 200 |
| 小米 `compute_wait_ms` | 70685.3 |
| 小米 `recv_ms` | 204.1 |
| 小米 `inject_ms` | 46 |
| 小米 `slot_in_use_at_alloc` | 2 |

上游计时均从发起上游请求开始累计，不能相加；厂商字段也不能直接与本地分段相加。

**该请求强烈指向小米侧计算等待，而不是本站建立连接或浏览器连接数上限。** 本站准备只需 4 ms；5.384 秒时已经收到小米首字节，之后仍等待约 66.268 秒才有有效 token；小米自己回传的 `compute_wait_ms` 数值约为 70.69 秒，与整次首响高度一致。同轮其余五模型首 Token 为 0.466–1.913 秒。

`compute_wait_ms` 与 `slot_in_use_at_alloc` 的精确定义尚未取得厂商确认，因此不能进一步断言是哪一种内部队列、账号并发配额，或把 slot 数值直接解释成账号并发数。也不能把此请求直接当作此前两个分享的内部追踪证据。此次结果已足以排除“主要耗时是本站准备/浏览器建连”对该请求的解释。

厂商 completion ID：`4d7eb6dc-8dd5-45c5-a711-f1503f91821c-804df5d39515400da5ec4df5`。

上游开始时间：`2026-09-27T01:21:48.865Z`（北京时间 09:21:48.865）。慢请求的 `chat_timing` 日志已在 Vercel 上查到；没有记录 Key、Prompt 或模型输出。

真实回执：`output/ttft-release-verification-2026-09-27T01-21-43.677Z.json`。该文件是六次真实请求，不是布局 fixture。

## 验收与手机布局

149 项自动化测试和生产构建通过。主页面、方法说明、原分享、Worker 健康检查 HTTP 200；本地管理路由线上仍为 404。真实六模型验收通过诊断字段、请求 ID、尝试次数和通路断言。

验收发现六卡片在 390 px 窄屏下的隐式网格列被内容撑到 415 px。补充 `grid-cols-1`，让移动端使用可收缩的单列，原有桌面响应式列数不变。相同六模型布局 fixture 修复后文档宽度为 390 px；数据表仍保留其自身的横向滚动。此样式修复不涉及模型请求。

布局检查文件以 `ttft-layout-fixture-` 命名，并标记 `fixture: true`；其中的模拟时延不作为模型性能证据。最终部署 ID 与验收状态保存在本地 `.vercel/ttft-release-2026-09-27.json`。
