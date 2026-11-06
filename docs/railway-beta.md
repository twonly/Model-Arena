# Railway Beta

Run this Next.js app with `npm run build` and `npm start -- --hostname 0.0.0.0`.
The Dockerfile uses Node 22; only public Supabase variables and the beta flag are
build arguments. Server credentials are runtime variables. Configure the Railway
health check as `/api/chat/session`, port `8080`, and one replica.
Railway supplies `PORT` and `RAILWAY_SERVICE_ID`. The beta uses a Railway service
domain; do not change the production Vercel or Cloudflare domains.

Set `TOKRACE_BETA=1` at build time and runtime for the banner and `noindex` header.
Copy the production `SUPABASE_*`, `NEXT_PUBLIC_SUPABASE_*`, and `SHARED_KEY_*`
variables through Railway's secret settings. Accounts, history, and quotas are
shared with production. Do not copy `CHAT_WORKER_TOKEN` or
`CHAT_WORKER_SIGNING_SECRET`: without these, the routing plan uses the same-origin
`/api/chat` endpoint. Its diagnostics report `railway` on Railway, although the
legacy routing-plan name is `vercel`.

The SSE stream sends a heartbeat every 15 seconds without counting it as a model
token or TTFT. Hosted rate limiting and private-host guards also apply on Railway.
Password login uses the existing Supabase project; OAuth requires the beta
`/auth/callback` URL in that project's redirect allowlist.

## Verify the public deployment

Set a random `BETA_PROBE_TOKEN` on the beta service, then run:

```sh
BETA_PROBE_TOKEN='<same secret>' node checks/railway-stream.mjs https://<beta-host>
```

The check calls the real `/api/chat`, which connects to an authenticated synthetic
OpenAI upstream on the beta. The upstream sends comments, but no model tokens,
for 330 seconds. The check requires Railway diagnostics, at least 20 downstream
heartbeats, a first token after 330 seconds, and a normal final `done` event.
It does not call a paid model, consume shared model quota, or submit telemetry.
This proves the HTTP/SSE path, not a particular provider's own timeout behavior.
For a temporary production diagnostic, `TOKRACE_STREAM_PROBE=1` enables the same
secret-protected endpoint without turning on the beta banner. Model
`synthetic-stream-330s` emits numbered reasoning chunks every second instead of
idle comments, for checking replay completeness under continuous output.
The probe returns 404 unless explicitly enabled or without its secret, and 401 without valid
authentication. Remove the secret when this diagnostic is no longer needed.

Railway HTTP requests remain subject to the platform's 15-minute total limit.
The separate server benchmark runner still has its existing 240-second limit.

## Recoverable browser streams

On Railway, the browser opts into resumable `/api/chat` streams. The model request
runs once in the server process; downstream connections rotate every 45 seconds.
A random 256-bit capability in a header authorizes reading or stopping that run.
After a disconnect, GET resumes after the last event sequence, without repeating
the model POST or shared-quota claim. Proxy timestamps remain the speed metric,
including chart samples, so replay does not inflate peak TPS.
The client retries temporary network failures; manual Stop cancels the upstream.

This is deliberately single-process: keep **one replica**. Buffers are bounded
to 8 MiB per run and 16 retained runs, expire 90 seconds after losing the reader,
and are deleted on completion/stop. A service restart/redeploy loses these
in-memory runs and reports that clearly; it does not silently start them again.
Use a shared durable job store before adding replicas or requiring restart
survival. Existing Vercel/Cloudflare clients retain their direct-stream behavior.

## Production promotion and rollback

For production, set `TOKRACE_BETA=0`, remove `BETA_PROBE_TOKEN`, and rebuild.
Production analytics run on both hosts. Railway forwards `/_vercel/insights/*`
and `/_vercel/speed-insights/*` to `model-arena-azure.vercel.app`; keep this
Vercel project and alias active so collection continues. Beta analytics stay disabled.
Keep the original Vercel project,
deployment, domain bindings, and Cloudflare Worker available for rollback.

Bind the canonical `www.tokrace.com` domain in Railway and point its DNS CNAME
to the target returned by Railway, with proxy disabled. Add the required
`_railway-verify.www` TXT record from Railway before switching traffic: the custom
domain returns 404 until ownership is verified. Preserve the original
DNS record before editing. The current service plan permits one custom domain;
the apex can retain its existing Vercel 308 redirect to `www`.

Verify the canonical HTTPS page, assets, account configuration, and a real
shared-model request with `railway` diagnostics after DNS propagation. Rollback
restores the original `www` DNS record; no database migration or Worker change
is required. Private snapshots and rollout evidence are in the ignored
`output/railway-cutover/` directory.

Every isolated source snapshot must include the root `proxy.ts` and the current
Dockerfile check that rejects a missing or empty proxy. Verify `/` redirects to
`/zh-CN` by default and `/en` with English `Accept-Language`, and `/zh` redirects
to `/zh-CN`; each destination must return 200. Checking only localized article
URLs misses a broken homepage when the language proxy is absent.
