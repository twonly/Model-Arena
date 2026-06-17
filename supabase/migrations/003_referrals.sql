-- 迁移 003：邀请奖励与奖励额度账本
-- 规则：
--   - 好友通过邀请链接注册并完成首次共享模型对比后，邀请人 +10 次，被邀请人 +5 次。
--   - 奖励有效期由服务端调用 qualify_referral 时传入，当前产品规则为 60 天。
--   - 基础免费额度先扣；基础额度用完后才扣 quota_ledger 中的邀请奖励余额。

create table if not exists referral_codes (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  code        text not null unique,
  created_at  timestamptz not null default now(),
  disabled_at timestamptz
);
create index if not exists referral_codes_code_idx on referral_codes (code);
alter table referral_codes enable row level security;

create table if not exists referral_attributions (
  id                   bigint generated always as identity primary key,
  created_at           timestamptz not null default now(),
  code                 text not null,
  referrer_user_id     uuid not null references auth.users(id) on delete cascade,
  invitee_user_id      uuid not null references auth.users(id) on delete cascade,
  client_id            text,
  ip_hash              text,
  user_agent_hash      text,
  status               text not null default 'signed_up'
    check (status in ('signed_up', 'qualified', 'rewarded', 'rejected')),
  reject_reason        text,
  signed_up_at         timestamptz not null default now(),
  qualified_at         timestamptz,
  rewarded_at          timestamptz,
  qualifying_run_id    text,
  inviter_reward_delta int not null default 0,
  invitee_reward_delta int not null default 0,
  unique (invitee_user_id)
);
create index if not exists referral_attr_referrer_idx on referral_attributions (referrer_user_id, created_at desc);
create index if not exists referral_attr_invitee_idx on referral_attributions (invitee_user_id);
alter table referral_attributions enable row level security;

create table if not exists quota_ledger (
  id                  bigint generated always as identity primary key,
  created_at          timestamptz not null default now(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  delta               int not null,
  source              text not null check (
    source in ('referral_inviter', 'referral_invitee', 'referral_spend', 'admin', 'adjustment')
  ),
  related_referral_id bigint references referral_attributions(id) on delete set null,
  run_id              text,
  expires_at          timestamptz,
  note                text
);
create index if not exists quota_ledger_user_idx on quota_ledger (user_id, created_at desc);
create index if not exists quota_ledger_expiry_idx on quota_ledger (expires_at);
create unique index if not exists quota_ledger_referral_reward_uni
  on quota_ledger (source, related_referral_id)
  where related_referral_id is not null and source in ('referral_inviter', 'referral_invitee');
create unique index if not exists quota_ledger_spend_run_uni
  on quota_ledger (user_id, run_id)
  where source = 'referral_spend' and run_id is not null;
alter table quota_ledger enable row level security;

alter table shared_runs
  add column if not exists quota_source text not null default 'base';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shared_runs_quota_source_chk'
  ) then
    alter table shared_runs
      add constraint shared_runs_quota_source_chk check (quota_source in ('base', 'referral'));
  end if;
end $$;

create or replace function referral_bonus_remaining(p_user_id uuid)
returns int language sql stable as $$
  select greatest(
    coalesce(
      sum(delta) filter (where expires_at is null or expires_at > now()),
      0
    ),
    0
  )::int
  from quota_ledger
  where user_id = p_user_id;
$$;

create or replace function referral_dashboard(p_user_id uuid)
returns jsonb language plpgsql stable as $$
declare
  v_code text;
  v_bonus_remaining int;
  v_bonus_earned int;
  v_pending int;
  v_rewarded int;
  v_next_expiry timestamptz;
begin
  select code into v_code
  from referral_codes
  where user_id = p_user_id and disabled_at is null;

  select referral_bonus_remaining(p_user_id) into v_bonus_remaining;

  select coalesce(sum(delta), 0)::int into v_bonus_earned
  from quota_ledger
  where user_id = p_user_id
    and delta > 0
    and source in ('referral_inviter', 'referral_invitee');

  select count(*)::int into v_pending
  from referral_attributions
  where referrer_user_id = p_user_id
    and status in ('signed_up', 'qualified');

  select count(*)::int into v_rewarded
  from referral_attributions
  where referrer_user_id = p_user_id
    and status = 'rewarded';

  select min(expires_at) into v_next_expiry
  from quota_ledger
  where user_id = p_user_id
    and delta > 0
    and (expires_at is null or expires_at > now());

  return jsonb_build_object(
    'code', v_code,
    'bonusRemaining', v_bonus_remaining,
    'bonusEarned', v_bonus_earned,
    'pendingInvites', v_pending,
    'rewardedInvites', v_rewarded,
    'nextExpiry', v_next_expiry
  );
end;
$$;

create or replace function claim_referral_attribution(
  p_code text,
  p_invitee_user_id uuid,
  p_client_id text,
  p_ip_hash text,
  p_user_agent_hash text
) returns jsonb language plpgsql as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[-_]', '', 'g'));
  v_referrer uuid;
  v_existing referral_attributions%rowtype;
  v_prior_user_runs int;
begin
  select user_id into v_referrer
  from referral_codes
  where code = v_code and disabled_at is null;

  if v_referrer is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  if v_referrer = p_invitee_user_id then
    return jsonb_build_object('ok', false, 'reason', 'self');
  end if;

  select * into v_existing
  from referral_attributions
  where invitee_user_id = p_invitee_user_id;

  if found then
    return jsonb_build_object(
      'ok', v_existing.referrer_user_id = v_referrer,
      'reason', case
        when v_existing.referrer_user_id = v_referrer then 'already'
        else 'already_attributed'
      end,
      'status', v_existing.status
    );
  end if;

  select count(distinct run_id)::int into v_prior_user_runs
  from shared_runs
  where who = p_invitee_user_id::text and who_kind = 'user';

  if v_prior_user_runs > 0 then
    insert into referral_attributions (
      code, referrer_user_id, invitee_user_id, client_id, ip_hash, user_agent_hash,
      status, reject_reason
    ) values (
      v_code, v_referrer, p_invitee_user_id, p_client_id, p_ip_hash, p_user_agent_hash,
      'rejected', 'existing_user'
    )
    on conflict (invitee_user_id) do nothing;
    return jsonb_build_object('ok', false, 'reason', 'existing_user');
  end if;

  insert into referral_attributions (
    code, referrer_user_id, invitee_user_id, client_id, ip_hash, user_agent_hash
  ) values (
    v_code, v_referrer, p_invitee_user_id, p_client_id, p_ip_hash, p_user_agent_hash
  );

  return jsonb_build_object('ok', true, 'reason', 'claimed', 'status', 'signed_up');
end;
$$;

create or replace function qualify_referral(
  p_invitee_user_id uuid,
  p_run_id text,
  p_inviter_reward int,
  p_invitee_reward int,
  p_ttl_days int,
  p_monthly_limit int,
  p_total_limit int
) returns jsonb language plpgsql as $$
declare
  v_attr referral_attributions%rowtype;
  v_monthly int;
  v_total int;
  v_expires_at timestamptz := now() + make_interval(days => p_ttl_days);
  v_inviter_delta int := 0;
begin
  select * into v_attr
  from referral_attributions
  where invitee_user_id = p_invitee_user_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_attribution');
  end if;

  if v_attr.status = 'rewarded' then
    return jsonb_build_object('ok', true, 'reason', 'already', 'status', 'rewarded');
  end if;

  if v_attr.status = 'rejected' then
    return jsonb_build_object('ok', false, 'reason', v_attr.reject_reason);
  end if;

  select count(*)::int into v_monthly
  from referral_attributions
  where referrer_user_id = v_attr.referrer_user_id
    and status = 'rewarded'
    and rewarded_at >= date_trunc('month', now());

  select count(*)::int into v_total
  from referral_attributions
  where referrer_user_id = v_attr.referrer_user_id
    and status = 'rewarded';

  if v_monthly < p_monthly_limit and v_total < p_total_limit then
    v_inviter_delta := p_inviter_reward;
    insert into quota_ledger (
      user_id, delta, source, related_referral_id, expires_at, note
    ) values (
      v_attr.referrer_user_id, p_inviter_reward, 'referral_inviter',
      v_attr.id, v_expires_at, 'invitee qualified'
    )
    on conflict do nothing;
  end if;

  insert into quota_ledger (
    user_id, delta, source, related_referral_id, expires_at, note
  ) values (
    v_attr.invitee_user_id, p_invitee_reward, 'referral_invitee',
    v_attr.id, v_expires_at, 'signup through referral'
  )
  on conflict do nothing;

  update referral_attributions
  set status = 'rewarded',
      qualified_at = coalesce(qualified_at, now()),
      rewarded_at = coalesce(rewarded_at, now()),
      qualifying_run_id = coalesce(qualifying_run_id, p_run_id),
      inviter_reward_delta = greatest(inviter_reward_delta, v_inviter_delta),
      invitee_reward_delta = greatest(invitee_reward_delta, p_invitee_reward),
      reject_reason = case when v_inviter_delta = 0 then 'inviter_reward_limit' else null end
  where id = v_attr.id;

  return jsonb_build_object(
    'ok', true,
    'reason', 'rewarded',
    'inviterReward', v_inviter_delta,
    'inviteeReward', p_invitee_reward
  );
end;
$$;

create or replace function shared_quota_status(
  p_who text,
  p_who_kind text,
  p_limit int
) returns jsonb language plpgsql stable as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  v_base_used int;
  v_total_used int;
  v_bonus_remaining int := 0;
  v_base_remaining int;
begin
  select count(distinct run_id)::int into v_base_used
  from shared_runs
  where who = p_who and day = v_day and quota_source = 'base';

  select count(distinct run_id)::int into v_total_used
  from shared_runs
  where who = p_who and day = v_day;

  if p_who_kind = 'user' then
    select referral_bonus_remaining(p_who::uuid) into v_bonus_remaining;
  end if;

  v_base_remaining := greatest(p_limit - v_base_used, 0);

  return jsonb_build_object(
    'baseLimit', p_limit,
    'baseUsed', v_base_used,
    'baseRemaining', v_base_remaining,
    'bonusRemaining', v_bonus_remaining,
    'totalUsed', v_total_used,
    'remaining', v_base_remaining + v_bonus_remaining,
    'limit', p_limit + v_bonus_remaining
  );
end;
$$;

create or replace function claim_shared_run(
  p_who text, p_who_kind text, p_ip text, p_run_id text,
  p_limit int, p_ip_ceiling int
) returns jsonb language plpgsql as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  v_base_used int;
  v_ip_used int;
  v_bonus_remaining int := 0;
  v_source text;
  v_spend_expires_at timestamptz;
begin
  if exists (select 1 from shared_runs where who = p_who and day = v_day and run_id = p_run_id) then
    return shared_quota_status(p_who, p_who_kind, p_limit) ||
      jsonb_build_object('ok', true, 'reason', 'already');
  end if;

  select count(distinct run_id)::int into v_base_used
  from shared_runs
  where who = p_who and day = v_day and quota_source = 'base';

  if p_ip is not null and p_ip <> '' then
    select count(distinct run_id)::int into v_ip_used
    from shared_runs
    where ip = p_ip and day = v_day;
    if v_ip_used >= p_ip_ceiling then
      return shared_quota_status(p_who, p_who_kind, p_limit) ||
        jsonb_build_object('ok', false, 'reason', 'ip');
    end if;
  end if;

  if v_base_used < p_limit then
    v_source := 'base';
  elsif p_who_kind = 'user' then
    select referral_bonus_remaining(p_who::uuid) into v_bonus_remaining;
    if v_bonus_remaining > 0 then
      v_source := 'referral';
      select min(expires_at) into v_spend_expires_at
      from quota_ledger
      where user_id = p_who::uuid
        and delta > 0
        and (expires_at is null or expires_at > now());

      insert into quota_ledger (user_id, delta, source, run_id, expires_at, note)
      values (
        p_who::uuid, -1, 'referral_spend', p_run_id,
        v_spend_expires_at, 'shared model run'
      )
      on conflict do nothing;
    else
      return shared_quota_status(p_who, p_who_kind, p_limit) ||
        jsonb_build_object('ok', false, 'reason', 'quota');
    end if;
  else
    return shared_quota_status(p_who, p_who_kind, p_limit) ||
      jsonb_build_object('ok', false, 'reason', 'quota');
  end if;

  insert into shared_runs (day, who, who_kind, ip, run_id, quota_source)
    values (v_day, p_who, p_who_kind, p_ip, p_run_id, v_source)
    on conflict (who, day, run_id) do nothing;

  return shared_quota_status(p_who, p_who_kind, p_limit) ||
    jsonb_build_object('ok', true, 'reason', 'claimed', 'source', v_source);
end;
$$;
