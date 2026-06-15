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

-- 「我的中心」所需：分享归属 + 软关闭 + 列表用的冗余列（旧分享这些列为 NULL，不影响打开）
alter table shares add column if not exists owner_client_id text;     -- 创建者设备 ID
alter table shares add column if not exists owner_user_id   uuid;     -- 创建者登录账号(可空)
alter table shares add column if not exists disabled        boolean not null default false; -- 软关闭：链接失效但保留数据
alter table shares add column if not exists title           text;     -- 冗余，列表展示用
alter table shares add column if not exists model_count     int;      -- 冗余，列表展示用
create index if not exists shares_owner_idx on shares (owner_client_id, created_at desc);
create index if not exists shares_owner_user_idx on shares (owner_user_id, created_at desc);

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

-- 分享页投票（简化版）：每个模型卡片直接 👍/👎 + 评论。
-- 数据粒度 = 每设备每分享每模型一行（可独立赞/踩不同模型，可改）。
-- 注意：本表结构与早期版本不同，若你之前建过旧 share_votes，先 drop 再建。
drop table if exists share_votes;
create table share_votes (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  share_id    text not null,
  client_id   text not null,           -- 匿名设备 ID
  user_id     uuid,                     -- 登录用户(可空)，登录票更可信
  model_index int not null,             -- 快照 results 下标
  model_id    text,                     -- 模型 id（全站人气榜聚合用）
  sentiment   text,                     -- up 赞 / down 踩 / null（仅评论）
  comment     text,                     -- 文字评论 ≤500
  unique (share_id, client_id, model_index)  -- 每设备每模型一行（upsert 改）
);
create index if not exists share_votes_share_idx on share_votes (share_id);
create index if not exists share_votes_model_idx on share_votes (model_id);
create index if not exists share_votes_client_idx on share_votes (client_id, created_at desc);
create index if not exists share_votes_user_idx on share_votes (user_id, created_at desc);
alter table share_votes enable row level security;

-- 前面这些表都不开放匿名读写（服务端用 service_role key 操作，绕过 RLS）
alter table consents enable row level security;
alter table run_metrics enable row level security;
alter table shares enable row level security;
