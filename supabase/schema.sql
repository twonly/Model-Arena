-- 百模竞速 · Model Arena 遥测表结构
-- 在 Supabase SQL Editor 里执行一次即可。
-- 之后在 Vercel 项目设置里配置环境变量：
--   SUPABASE_URL              = https://<project-ref>.supabase.co
--   SUPABASE_SERVICE_ROLE_KEY = <service_role key>（仅服务端使用，勿暴露给前端）

-- 用户同意/拒绝记录（合规留痕）
create table if not exists consents (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  client_id   text not null,          -- 匿名设备 ID（随机 UUID，非指纹）
  choice      text not null check (choice in ('granted', 'denied')),
  consent_version int not null,
  user_agent  text
);
create index if not exists consents_client_idx on consents (client_id, created_at desc);

-- 每次对比中每个模型的指标（不含 API Key 与输入输出内容）
create table if not exists run_metrics (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  client_id        text not null,
  run_id           text not null,     -- 同一轮对比的多个模型共享
  provider         text not null,     -- 接口域名，如 api.deepseek.com
  kind             text,              -- openai / anthropic
  model            text not null,
  status           text,
  has_error        boolean,
  has_image        boolean,
  prompt_chars     int,
  output_chars     int,
  reasoning_chars  int,
  ttft_ms          double precision,
  thinking_ms      double precision,
  content_ms       double precision,
  total_ms         double precision,
  thinking_tps     double precision,
  content_tps      double precision,
  avg_tps          double precision,
  peak_tps         double precision,
  prompt_tokens    int,
  output_tokens    int,
  reasoning_tokens int,
  content_tokens   int,
  tokens_official  boolean,
  rank             int
);
create index if not exists run_metrics_model_idx on run_metrics (model, created_at desc);
create index if not exists run_metrics_provider_idx on run_metrics (provider, created_at desc);
create index if not exists run_metrics_client_idx on run_metrics (client_id, created_at desc);

-- 分享快照：用户主动分享的对比结果（含 Prompt 与模型输出，不含 API Key/baseUrl）
-- 读取走服务端 service_role，页面再渲染，故同样不开放匿名直读
create table if not exists shares (
  id          text primary key,        -- 短 ID，URL 用
  created_at  timestamptz not null default now(),
  payload     jsonb not null,          -- 快照：标题/备注/prompt/各模型结果
  views       int not null default 0
);
create index if not exists shares_created_idx on shares (created_at desc);

-- 云同步：每个登录用户一行，payload 是「客户端加密后的密文」
-- 服务器无法解密（密钥由用户的同步密码在浏览器派生）。RLS 限定本人可读写。
create table if not exists user_sync (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  payload     jsonb not null,         -- {v, salt, iv, data} 密文
  updated_at  timestamptz not null default now()
);
alter table user_sync enable row level security;

-- 仅本人可读写自己的同步行
drop policy if exists "own sync select" on user_sync;
create policy "own sync select" on user_sync
  for select using (auth.uid() = user_id);
drop policy if exists "own sync upsert" on user_sync;
create policy "own sync insert" on user_sync
  for insert with check (auth.uid() = user_id);
drop policy if exists "own sync update" on user_sync;
create policy "own sync update" on user_sync
  for update using (auth.uid() = user_id);

-- 分享页投票/打榜：每设备每分享 1 票（可改票），登录票单独计可加权
create table if not exists share_votes (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  share_id    text not null,
  client_id   text not null,           -- 匿名设备 ID
  user_id     uuid,                     -- 登录用户(可空)，用于加权/可信票
  pick        int not null,             -- 选最佳：快照 results 的下标
  scores      jsonb,                    -- 多维星级 {维度: 1..5}
  comment     text,                     -- 文字评论 ≤500
  unique (share_id, client_id)          -- 每设备每分享 1 票（upsert 改票）
);
create index if not exists share_votes_share_idx on share_votes (share_id);
alter table share_votes enable row level security;

-- 前面这些表都不开放匿名读写（服务端用 service_role key 操作，绕过 RLS）
alter table consents enable row level security;
alter table run_metrics enable row level security;
alter table shares enable row level security;
