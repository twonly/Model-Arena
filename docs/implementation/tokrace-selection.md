# TOKRACE 选型体验实施记录

本次实现位于 `codex/tokrace-selection`。主站代码 `a910806` 已于 2026-09-26 发布到 https://www.tokrace.com，Vercel 状态为 Ready。生产数据库增量迁移和供应商目录检查已完成；自动化配置已接通，首次健康检查与标准测量由 GitHub Actions 执行。下方本地验证使用合成数据和拦截后的模型请求，与生产真实测量分别记录。

## 已交付

- 可靠性：移除综合分；截断、停止、错误不参与完整结果评奖；任务校验使用明确题目 ID、版本和原始 Prompt。价格使用精确模型 ID 和接入点，免费路由、未知费用、订阅接口及普通/高速版本分别处理。已过期预览不进入体验池和首页推荐，模型页保留到期说明。
- 体验：首页收敛为开始对比/最新实测；首访三个模型；任务、模型、开始、结果顺序；手机摘要优先，输出按需展开，导出设置后置。失败不丢成功结果；单模型重试、历史和分享使用该轮固定的任务、参数与接入点。
- 测试集：JSON 抽取、指令约束、给定材料问答，各五个案例。支持保存本地自定义测试集、批量运行、JSON/CSV 导出。标准集不代表通用智能或视觉质量。
- 自动实测：香港服务端测量；每模型十五题、两个相隔至少六小时的时段；最多六模型。任务去重、租约结算、数据库原子预算预留；失败和中断保留证据；不自动重发结果不明的付费请求。
- 报告：不可变题目/模型/参数/价格/输出快照、按任务给出确定性结论、双语页面、原始证据 JSON、专属 OG 图和 Badge、准确复测入口。已发布报告列表使用预计算摘要，避免反复下载全量输出。未知成本不冒充零费用，少量样本不显示 P95。
- SEO：保留历史 URL、冻结模型 slug、旧顺序对比地址永久跳转；无同条件证据的社区对比 noindex，移出 sitemap；只收录已发布报告、有来源的模型资料和精选对比。新报告发布后仅提交相关新增/更新 URL 到 IndexNow。
- 衡量：报告浏览/复测、开始、完成、错误、有效对比、保存、分享、测试集保存/导出和七日回访事件。社区榜单明确十四天窗口，与标准测量分开。

## 本地验证

- `npm test`：143 项 `node:test`，覆盖价格/别名、截断、版本化校验、流解析、报告数字和证据、任务去重、发现到发布流程、调度补跑与 IndexNow。
- `npx tsc --noEmit`；`npm run build`：通过。
- `node automation/verify-ui.mjs`：对本地 Next 服务验证手机三模型流程、单模型重试、修改任务后评分失效、测试集 CSV 导出、缺失接入点、跨日 hydration、过期说明、价格链接和鉴权。所有模型调用均被拦截。
- `node automation/verify-reports.mjs`：使用生产构建和本地只读数据库替身，验证双语报告、canonical/hreflang/结构化数据、手机布局、证据 API、OG/Badge、模型/对比页及准确复测。替身数据不进入线上数据库。
- `PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node automation/verify-budget.mjs`：在临时 PostgreSQL 运行时验证迁移可重入、预算边界、并发去重、租约、权限、结算、稳定 slug、历史数据保留。PGlite 仅测试时临时安装，未添加产品依赖。

浏览器截图存放于忽略提交的 `output/playwright/`。构建仍报告原有作品集查询超过 Next 数据缓存 2MB 的告警，以及部分独立布局的 metadataBase 告警；两者不阻止构建，新报告的实际 metadata/图片路由另有浏览器验证。

## 上线步骤

1. 备份现有 Supabase schema 与数据，应用 `supabase/migrations/005_benchmarks.sql`。迁移新增六张 benchmark 表、服务端 RPC 和模型稳定 slug；不修改历史分享内容。不把社区遥测转换成标准证据。
2. Vercel 使用当前项目与香港区域。配置 `BENCHMARK_SECRET`（随机至少 32 字符）、`BENCHMARK_MODEL_IDS`（首批明确模型 ID，最多六个）、对应的 `SHARED_KEY_*`。保留既有 Supabase 服务端配置。先保持 `BENCHMARK_ENABLED=false`。
3. 预算默认为 `BENCHMARK_DAILY_CNY=20`、`BENCHMARK_MONTHLY_CNY=500`；按北京时间日/月计算，人民币/美元转换为估算汇率 7.2。缺少官方计费用量时保留全部预留额度。价格超过三十天未核实会暂停；可用 `BENCHMARK_PRICES_JSON` 提供明确接入点 ID 的已核实价格。示例结构：

```json
{"deepseek-flash":{"input":0.3,"output":1.2,"currency":"USD","cnyPerUsd":7.2,"source":"https://api-docs.deepseek.com/quick_start/pricing","verifiedAt":"2026-09-26","basis":"upper-bound"}}
```

上述仅为当前已核实的高峰价上限示例，部署时重新检查日期与官方价格。DeepSeek 的固定 API 标识可能由厂商切换底层版本；报告保存本站当时核实的版本和来源，不保证提供商永不重定向。OrcaRouter 的 `orcarouter/free` 自动路由不进入标准模型报告，固定 free 路由作为不同接入产品展示。

4. 部署后先用受保护的 `POST /api/benchmarks` 的 `discover`、`plan` 检查目录、价格和模型名单，再启用 `BENCHMARK_ENABLED=true`。API Bearer secret 仅供服务端调度，不放入浏览器。`GET /api/benchmarks` 可由调度密钥或 `ADMIN_USER_IDS` 中的 Supabase 用户读取；`/zh-CN/operations` 复用已登录管理员会话。
5. 将 `.github/workflows/benchmarks.yml` 合入默认分支，为 Actions 配置同一 `BENCHMARK_SECRET` 和可选的站点 `INDEXNOW_KEY`。目标地址使用 **`https://www.tokrace.com`**，避免 apex 跨主机跳转丢失鉴权。全部配置完成后将仓库变量 `BENCHMARK_AUTOMATION_ENABLED` 设为 `true`，手动 `health` 验证，再 `standard`。缺少迁移或密钥时工作流保持关闭。
6. Actions 每六小时发现变化，并补跑当日健康检查/当周缺失测量；两个标准时段由服务端强制至少相隔六小时。基线目录不会全量自动进测试池；后续新出现且身份/价格满足条件的候选加入下一批，首期最多六个。未核实的付费价格、缺失凭据、失效目录或错误区域都会暂停。
7. 发布检查全部通过才写入报告。不同语言引用同一不可变证据；网络测量异常进入待处理事件。重复执行不会重复收费或改写旧报告。任务中断且上游是否收费不明时保持 `running/interrupted` 和预算预留，核对厂商账单后人工处理，不删除证据来“重试”。

### 运行与告警边界

Actions 的失败结果区分目录/凭据/预算/测量/发布问题；管理员页面展示失败原因与最近完成/成功时间。超过八小时没有 discovery 心跳会显示调度延迟。**GitHub 自身完全漏跑时不会产生失败通知**；独立的 `benchmark-watchdog.yml` 每小时读取真实心跳，超时会以单独的工作流失败通知。若 GitHub 调度整体中断，这个检查也会延迟；要求平台外告警时，将同一受鉴权状态接口接入现有外部监控。本次实现没有创建外部监控服务、个人账户通知或 Codex 定时任务。

生产已配置 benchmark 调度密钥、首批五模型名单和 ¥20/日、¥500/月上限；已有供应商密钥保持不变。Supabase 六张新表与 RPC 已创建，受保护的状态接口返回 200。GitHub 已配置同一调度密钥和 IndexNow key；启用服务端与 Actions 两处开关后运行。首份报告必须等待两时段测量及发布检查完成，不能把部署成功等同于报告已发布。

### 2026-09-26 生产验收

- Vercel 构建日志确认从 `main` 的 `a910806` 构建，部署 `dpl_CCjSZ4WNEegZj5eUnTz3bYUUGaFw` 已绑定正式域名，运行函数位于香港。
- 中英文首页、竞速场、模型列表、报告列表、方法、价格、省钱榜、过期模型详情、sitemap 与已有分享抽样均返回 200；apex 正确跳转到 www。未鉴权的自动测试请求返回 401。
- 线上手机页面无横向溢出，首访默认三个模型；直接打开样例和跨日加载未出现浏览器错误。此验收拦截模型请求，没有产生 API 测试费用。
- 已将现有模型、配置、分享和测速数据、公开 schema 的字段/约束/索引/触发器与函数定义备份到本机忽略提交的 `.vercel/release-backup-2026-09-26/`。迁移在事务内完成；前后内容校验确认 41 份分享、967 条测速、配置与模型资料保持一致。模型仅新增 stable_slug，并由原有触发器刷新 updated_at。
- 已核实三个供应商目录均返回成功，首批五模型的健康检查计划全部为 pending，未因未知价格或缺失密钥跳过。

## 上线后验收

- 连续七天都有明确执行结果，调度漏跑、模型失败和预算暂停可辨认。
- 真实新模型从发现、两时段测量到双语报告上线；验证新增/更新 URL 与不可变旧快照。
- 两周记录访问/有效对比基线，四周后以同口径比较转化；20% 是验证目标而非承诺。
- 使用现有 Vercel Analytics/Speed Insights 观察真实用户 P75 LCP、INP、CLS；本地 Playwright 不替代真实用户性能。
