import type { ShareSnapshot } from "./share";

export type ShareFetchResult =
  | { state: "ok"; snapshot: ShareSnapshot }
  | { state: "closed" }
  | { state: "missing" };

function base(url: string): string {
  return url.replace(/\/+$/, "");
}

export async function fetchShareSnapshot(id: string): Promise<ShareFetchResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { state: "missing" };
  if (!/^[0-9A-Za-z]{6,16}$/.test(id)) return { state: "missing" };
  const res = await fetch(
    `${base(url)}/rest/v1/shares?id=eq.${id}&select=payload,disabled`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    }
  );
  if (!res.ok) return { state: "missing" };
  const rows = (await res.json()) as {
    payload: ShareSnapshot;
    disabled?: boolean | null;
  }[];
  const row = rows[0];
  if (!row?.payload || row.payload.v !== 1) return { state: "missing" };
  if (row.disabled) return { state: "closed" };
  return { state: "ok", snapshot: row.payload };
}
