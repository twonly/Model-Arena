-- Additive; existing metrics, shares, models and history remain intact.
create table if not exists public.benchmark_attempts (
  id text primary key, campaign text not null, model_id text not null,
  window_index integer not null check (window_index in (0,1)), case_id text not null,
  state text not null default 'running' check (state in ('running','complete')),
  reserved_cny numeric not null check (reserved_cny >= 0), spent_cny numeric,
  lease uuid not null default gen_random_uuid(), result jsonb,
  created_at timestamptz not null default now(), finished_at timestamptz
);
create index if not exists benchmark_campaign_idx on public.benchmark_attempts(campaign);
create table if not exists public.benchmark_reports (
  id text primary key, campaign text not null, version text not null,
  snapshot jsonb not null, index_data jsonb not null, published_at timestamptz not null default now(),
  unique(campaign, version)
);
create table if not exists public.benchmark_events (
  id bigint generated always as identity primary key,
  kind text not null, details jsonb not null, created_at timestamptz not null default now()
);
create table if not exists public.benchmark_catalog (
  provider text primary key, models jsonb not null, checked_at timestamptz not null default now()
);
alter table public.benchmark_attempts enable row level security;
alter table public.benchmark_reports enable row level security;
alter table public.benchmark_events enable row level security;
alter table public.benchmark_catalog enable row level security;
-- Only the server service role can write or read these tables; public readers use redacted APIs.
create or replace function public.reserve_benchmark(
 p_id text, p_campaign text, p_model text, p_window integer, p_case text,
 p_reserved numeric, p_daily numeric, p_monthly numeric
) returns jsonb language plpgsql security definer set search_path = public as $$
declare existing benchmark_attempts; d numeric; m numeric; inserted benchmark_attempts;
begin
 if p_reserved < 0 or p_daily < 0 or p_monthly < 0 then raise exception 'Invalid budget'; end if;
 -- ponytail: one advisory lock for <=6 models; per-account locks only for multi-tenant workloads.
 perform pg_advisory_xact_lock(20260926);
 select * into existing from benchmark_attempts where id=p_id;
 if found then return jsonb_build_object('state',existing.state,'existing',true,'result',existing.result); end if;
 select coalesce(sum(coalesce(spent_cny,reserved_cny)),0) into d from benchmark_attempts
 where created_at >= (date_trunc('day',now() at time zone 'Asia/Shanghai') at time zone 'Asia/Shanghai');
 select coalesce(sum(coalesce(spent_cny,reserved_cny)),0) into m from benchmark_attempts
 where created_at >= (date_trunc('month',now() at time zone 'Asia/Shanghai') at time zone 'Asia/Shanghai');
 if d+p_reserved > p_daily or m+p_reserved > p_monthly then
 return jsonb_build_object('state','paused','reason','budget_exhausted'); end if;
 insert into benchmark_attempts(id,campaign,model_id,window_index,case_id,reserved_cny)
 values(p_id,p_campaign,p_model,p_window,p_case,p_reserved) returning * into inserted;
 return jsonb_build_object('state','running','existing',false,'lease',inserted.lease);
end $$;
create or replace function public.finish_benchmark(p_id text,p_lease uuid,p_result jsonb,p_spent numeric)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if p_spent < 0 then raise exception 'Invalid cost'; end if;
 update benchmark_attempts set result=p_result,spent_cny=p_spent,state='complete',finished_at=now()
 where id=p_id and lease=p_lease and state='running';
 return found;
end $$;
revoke all on function public.reserve_benchmark(text,text,text,integer,text,numeric,numeric,numeric) from public,anon,authenticated;
revoke all on function public.finish_benchmark(text,uuid,jsonb,numeric) from public,anon,authenticated;
grant execute on function public.reserve_benchmark(text,text,text,integer,text,numeric,numeric,numeric) to service_role;
grant execute on function public.finish_benchmark(text,uuid,jsonb,numeric) to service_role;

-- Freeze the current URL slug independently of display-name changes.
alter table public.models add column if not exists stable_slug text;
update public.models set stable_slug=trim(both '-' from regexp_replace(lower(coalesce(display_name,raw_id)), '[^a-z0-9]+', '-', 'g')) where stable_slug is null;
create or replace function public.preserve_model_slug() returns trigger language plpgsql set search_path=public as $$
begin
 if TG_OP='UPDATE' and old.stable_slug is not null then new.stable_slug=old.stable_slug;
 elsif new.stable_slug is null then new.stable_slug=trim(both '-' from regexp_replace(lower(coalesce(new.display_name,new.raw_id)), '[^a-z0-9]+', '-', 'g'));
 end if;
 return new;
end $$;
drop trigger if exists model_stable_slug on public.models;
create trigger model_stable_slug before insert or update on public.models for each row execute function public.preserve_model_slug();
create table if not exists public.benchmark_registry (
 id text primary key, definition jsonb not null, price jsonb,
 status text not null check(status in ('ready','needs_review','retired')),
 discovered_at timestamptz not null default now(), checked_at timestamptz not null default now(), last_tested_at timestamptz
);
alter table public.benchmark_registry enable row level security;
create table if not exists public.benchmark_campaigns (
 id text primary key, models jsonb not null, created_at timestamptz not null default now()
);
alter table public.benchmark_campaigns enable row level security;

-- Explicit grants also work in projects without Supabase's default table privileges.
grant select on public.benchmark_attempts to service_role;
grant select, insert, update on public.benchmark_catalog, public.benchmark_registry to service_role;
revoke update, delete on public.benchmark_reports, public.benchmark_campaigns, public.benchmark_events from service_role;
grant select, insert on public.benchmark_reports, public.benchmark_campaigns, public.benchmark_events to service_role;
grant usage, select on sequence public.benchmark_events_id_seq to service_role;
