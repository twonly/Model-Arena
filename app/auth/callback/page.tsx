"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-client";

/**
 * OAuth 回跳页：Supabase（implicit 流）把 token 放在 URL hash 里，
 * 客户端 createClient 的 detectSessionInUrl 会自动解析并写入 session，
 * 这里等 SIGNED_IN 后跳回来源页（next）。仅内部路径，防开放重定向。
 */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/arena";
}

export default function AuthCallback() {
  const [msg, setMsg] = useState("正在完成登录…");

  useEffect(() => {
    const next = safeNext(new URLSearchParams(location.search).get("next"));
    const sb = getSupabase();
    if (!sb) {
      location.replace(next);
      return;
    }
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      location.replace(next);
    };
    // OAuth 报错（用户取消等）：hash/query 里带 error
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (hash.get("error") || new URLSearchParams(location.search).get("error")) {
      setMsg("登录未完成，正在返回…");
      setTimeout(go, 800);
      return;
    }
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") go();
    });
    // 兜底：可能已就绪，或超时也返回
    sb.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });
    const t = setTimeout(go, 4000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <div className="text-[28px]">🔑</div>
      <p className="mt-3 text-[14px] font-semibold">{msg}</p>
      <p className="mt-1 text-[12px] text-faint">请稍候，马上跳转回去。</p>
    </main>
  );
}
