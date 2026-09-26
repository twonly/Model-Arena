-- Private drafts are separate from the public evidence table. Existing reports stay available.
create table if not exists public.benchmark_drafts (
 id text primary key, campaign text not null, snapshot jsonb not null, summary jsonb not null,
 editorial jsonb, writer text check(writer in ('codex','operator')),
 revision integer not null default 1 check(revision > 0),
 updated_at timestamptz not null default now(),
 published_revision integer not null default 0,
 published_report_id text references public.benchmark_reports(id)
);
alter table public.benchmark_drafts enable row level security;
revoke all on public.benchmark_drafts from anon, authenticated;
grant select, insert, update on public.benchmark_drafts to service_role;
alter table public.benchmark_campaigns add column if not exists drafted_at timestamptz;
grant update(drafted_at) on public.benchmark_campaigns to service_role;
alter table public.benchmark_reports add column if not exists is_current boolean not null default true;

-- The HTTP boundary only exposes this operation to an authenticated administrator.
-- Lock and revision check bind approval to exactly the content the operator reviewed.
create or replace function public.publish_benchmark_draft(p_id text, p_revision integer, p_reviewer uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare d public.benchmark_drafts; rid text; stamp timestamptz := now();
begin
 select * into d from public.benchmark_drafts where id=p_id for update;
 if not found then raise exception 'draft_not_found'; end if;
 if d.revision <> p_revision then raise exception 'draft_conflict'; end if;
 if d.editorial is null or p_reviewer is null then raise exception 'review_required'; end if;
 if d.published_revision=d.revision then
  return jsonb_build_object('state','published','id',d.published_report_id,'unchanged',true);
 end if;
 rid := d.id || '-r' || d.revision;
 update public.benchmark_reports set is_current=false where campaign=d.campaign and is_current;
 insert into public.benchmark_reports(id,campaign,version,snapshot,index_data,published_at)
 values(rid,d.campaign,(d.snapshot->>'version') || '-r' || d.revision,
  d.snapshot || jsonb_build_object('id',rid,'version',(d.snapshot->>'version') || '-r' || d.revision,'publishedAt',stamp,'editorial',d.editorial,'reviewedAt',stamp,'writer',d.writer),
  d.summary || jsonb_build_object('id',rid,'version',(d.snapshot->>'version') || '-r' || d.revision,'publishedAt',stamp,'editorial',d.editorial,'reviewedAt',stamp,'writer',d.writer),stamp);
 update public.benchmark_drafts set published_revision=revision,published_report_id=rid where id=p_id;
 insert into public.benchmark_events(kind,details) values('published',jsonb_build_object('id',rid,'draft',p_id,'revision',p_revision,'reviewer',p_reviewer));
 return jsonb_build_object('state','published','id',rid);
end $$;
revoke all on function public.publish_benchmark_draft(text,integer,uuid) from public,anon,authenticated;
grant execute on function public.publish_benchmark_draft(text,integer,uuid) to service_role;
