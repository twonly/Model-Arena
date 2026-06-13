import Link from "next/link";
import { ShareView } from "@/components/ShareView";
import type { ShareSnapshot } from "@/lib/share";

export const dynamic = "force-dynamic";

async function fetchShare(id: string): Promise<ShareSnapshot | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  // 只接受短 ID 字符集，避免注入
  if (!/^[0-9A-Za-z]{6,16}$/.test(id)) return null;
  const res = await fetch(
    `${url.replace(/\/+$/, "")}/rest/v1/shares?id=eq.${id}&select=payload`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as { payload: ShareSnapshot }[];
  const snap = rows[0]?.payload;
  if (!snap || snap.v !== 1) return null;
  return snap;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snap = await fetchShare(id).catch(() => null);
  const title = snap?.title?.trim() || "模型速度对比";
  return {
    title: `${title} · 百模竞速`,
    description: snap
      ? `${snap.results.length} 个大模型实测对比 · ${snap.prompt.slice(0, 50)}`
      : "大模型速度对比分享",
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snapshot = await fetchShare(id).catch(() => null);

  if (!snapshot) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 text-center">
        <div className="text-[40px]">🔍</div>
        <h1 className="mt-3 text-[18px] font-bold">分享不存在或已失效</h1>
        <p className="mt-2 text-[13px] text-faint">
          这个分享链接无法打开，可能是 ID 有误、已被删除，或分享功能尚未启用。
        </p>
        <Link
          href="/arena"
          className="mt-5 rounded-md bg-ink px-5 py-2 text-[13px] font-bold text-paper"
        >
          去竞速场 ▶
        </Link>
      </main>
    );
  }

  return <ShareView snapshot={snapshot} />;
}
