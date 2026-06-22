-- 迁移 004：运行态配置
-- 用于后台即时切换 Vercel / Cloudflare 模型请求通路。
-- 只存非密钥配置；CHAT_WORKER_TOKEN / CHAT_WORKER_SIGNING_SECRET 仍放 Vercel 环境变量。

create table if not exists app_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists app_settings_updated_at on app_settings;
create trigger app_settings_updated_at
  before update on app_settings
  for each row execute function set_updated_at();

alter table app_settings enable row level security;

insert into app_settings (key, value)
values (
  'chat_transport',
  '{"mode":"vercel","cloudflareWorkerUrl":"","cloudflareMatch":[]}'::jsonb
)
on conflict (key) do nothing;
