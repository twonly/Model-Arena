-- 迁移 001：模型注册表（models）
-- 用途：把用户自命名的原始 model ID 规范化为统一显示名，治理公开榜单上的
--       重复 / 临时 model_id（合并、改名、隐藏）。/stats、/board、/model/[slug]
--       与 lib/stats.ts 依赖此表；缺表会导致排行榜报错（PGRST205）。
--
-- 执行：Supabase 控制台 → SQL Editor → 粘贴运行一次（幂等，可重复执行）。
-- 已在主库执行过；保留此文件作为可复现迁移记录 / 用于新环境。

create table if not exists models (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  raw_id        text not null unique,             -- 来自 run_metrics.model / share_votes.model_id 的原始字符串
  display_name  text,                             -- 规范化显示名（如 "Kimi K2"），空则回退 raw_id
  hidden        boolean not null default false,   -- true = 不在公共榜单展示
  canonical_id  bigint references models(id) on delete set null, -- 指向 canonical model（合并用）
  notes         text                              -- 管理员备注
);

create index if not exists models_canonical_idx on models (canonical_id);
create index if not exists models_hidden_idx on models (hidden);

-- 通用 updated_at 触发器（若其他表已创建过同名函数，create or replace 安全）
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists models_updated_at on models;
create trigger models_updated_at
  before update on models
  for each row execute function set_updated_at();

-- 不开放匿名读写：服务端用 service_role key 操作，绕过 RLS
alter table models enable row level security;
