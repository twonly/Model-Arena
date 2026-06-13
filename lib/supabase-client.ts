"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 浏览器端 Supabase 客户端（用公开 anon/publishable key，受 RLS 保护）。
 * 仅用于账号登录与「云同步」表的读写；服务端遥测仍走 service key。
 * 未配置时返回 null，账号功能整体禁用。
 */
let client: SupabaseClient | null = null;
let inited = false;

export function getSupabase(): SupabaseClient | null {
  if (inited) return client;
  inited = true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}

export const supabaseEnabled = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
