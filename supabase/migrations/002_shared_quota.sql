-- 迁移 002：共享「测试额度」计数
-- 一次「对比」(run) 算 1 次额度，不论本轮跑几个共享模型。
-- 身份：未登录用 clientId（每浏览器 5 次）；登录用 user_id（共 15 次）；
--      并对每个 IP 设每日总量天花板，挡「清 localStorage 刷新 clientId」式滥用。
-- 执行：Supabase SQL Editor 跑一次（幂等）。仅服务端 service_role 读写。

create table if not exists shared_runs (
  id          bigint generated always as identity primary key,
  day         date        not null default (now() at time zone 'utc')::date,
  who         text        not null,          -- clientId 或 user_id
  who_kind    text        not null,          -- 'client' | 'user'
  ip          text,
  run_id      text        not null,
  created_at  timestamptz not null default now()
);
create unique index if not exists shared_runs_uni on shared_runs (who, day, run_id);
create index if not exists shared_runs_ip_day on shared_runs (ip, day);
alter table shared_runs enable row level security;  -- 无策略 = 仅 service_role 可操作

-- 原子认领一次共享对比：同 run 已认领→放行（本轮多模型共用一次额度）；
-- 否则校验 who 配额 + ip 天花板，过则认领。返回 jsonb {ok, remaining, reason}
create or replace function claim_shared_run(
  p_who text, p_who_kind text, p_ip text, p_run_id text,
  p_limit int, p_ip_ceiling int
) returns jsonb language plpgsql as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  v_used int;
  v_ip_used int;
begin
  if exists (select 1 from shared_runs where who = p_who and day = v_day and run_id = p_run_id) then
    select count(distinct run_id) into v_used from shared_runs where who = p_who and day = v_day;
    return jsonb_build_object('ok', true, 'remaining', greatest(p_limit - v_used, 0), 'reason', 'already');
  end if;

  select count(distinct run_id) into v_used from shared_runs where who = p_who and day = v_day;
  if v_used >= p_limit then
    return jsonb_build_object('ok', false, 'remaining', 0, 'reason', 'quota');
  end if;

  if p_ip is not null and p_ip <> '' then
    select count(distinct run_id) into v_ip_used from shared_runs where ip = p_ip and day = v_day;
    if v_ip_used >= p_ip_ceiling then
      return jsonb_build_object('ok', false, 'remaining', greatest(p_limit - v_used, 0), 'reason', 'ip');
    end if;
  end if;

  insert into shared_runs (day, who, who_kind, ip, run_id)
    values (v_day, p_who, p_who_kind, p_ip, p_run_id)
    on conflict (who, day, run_id) do nothing;
  return jsonb_build_object('ok', true, 'remaining', greatest(p_limit - (v_used + 1), 0), 'reason', 'claimed');
end;
$$;

-- 仅查今日已用次数（给前端额度条用）
create or replace function shared_used_today(p_who text) returns int language sql stable as $$
  select coalesce(count(distinct run_id), 0)::int
  from shared_runs
  where who = p_who and day = (now() at time zone 'utc')::date;
$$;
