# Cloudflare Chat Worker 通路

TOKRACE 默认仍走 Vercel `/api/chat`。当后台「运行通路」切到 Cloudflare 后，浏览器会先向 Vercel 申请短期 ticket，再直接连接 Cloudflare Worker `/chat` 承载长 SSE。

## 为什么不是 Vercel 代理 Worker

如果长响应仍从 Vercel 流回浏览器，Vercel 函数仍可能命中 300 秒执行限制。Cloudflare 通路必须让浏览器直接连 Worker；Vercel 只做短请求：运行通路配置、ticket 签发、共享额度扣减和共享 Key 注入。

## Supabase

执行一次：

```sql
\i supabase/migrations/004_app_settings.sql
```

或把文件内容复制到 Supabase SQL Editor 执行。

## Vercel 环境变量

```bash
CHAT_WORKER_TOKEN=<long-random-secret>
CHAT_WORKER_SIGNING_SECRET=<another-long-random-secret>
```

`CHAT_WORKER_TOKEN` 用于 Worker 调 Vercel `/api/chat/worker-ticket`。`CHAT_WORKER_SIGNING_SECRET` 用于 Vercel 签发和校验短期 ticket。

## Cloudflare Worker

```bash
cd cloudflare/chat-worker
cp wrangler.toml.example wrangler.toml
npx wrangler secret put TOKRACE_APP_ORIGIN
npx wrangler secret put TOKRACE_WORKER_TOKEN
npx wrangler deploy
```

Secret 值：

```text
TOKRACE_APP_ORIGIN=https://www.tokrace.com
TOKRACE_WORKER_TOKEN=<same as Vercel CHAT_WORKER_TOKEN>
```

部署后把 Worker 根地址填到 `/admin/runtime`，例如：

```text
https://tokrace-chat-worker.<account>.workers.dev
```

## 回滚

打开 `/admin/runtime`，切回 `Vercel` 并保存。新请求会立即走 Vercel；已经开始的 Cloudflare 请求不受影响。
