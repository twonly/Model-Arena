"use client";

import { useEffect, useState } from "react";
import {
  ORCAROUTER_PKCE_STORAGE_KEY,
  safeOrcaRouterReturnPath,
  upsertOrcaRouterEndpoint,
  type OrcaRouterPkceSession,
} from "@/lib/orcarouter";
import type { ModelEndpoint } from "@/lib/types";

type Status = "working" | "success" | "error";

function readEndpoints(): ModelEndpoint[] {
  try {
    const parsed = JSON.parse(localStorage.getItem("ma.endpoints") ?? "[]");
    return Array.isArray(parsed) ? (parsed as ModelEndpoint[]) : [];
  } catch {
    return [];
  }
}

export default function OrcaRouterCallbackPage() {
  const [status, setStatus] = useState<Status>("working");
  const [message, setMessage] = useState("正在安全连接 OrcaRouter…");
  const [returnTo, setReturnTo] = useState("/zh-CN/arena");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let saved: OrcaRouterPkceSession | null = null;
      try {
        saved = JSON.parse(
          sessionStorage.getItem(ORCAROUTER_PKCE_STORAGE_KEY) ?? "null"
        ) as OrcaRouterPkceSession | null;
      } catch {
        saved = null;
      }
      const target = safeOrcaRouterReturnPath(saved?.returnTo);
      setReturnTo(target);
      const query = new URLSearchParams(location.search);
      const code = query.get("code");
      const returnedState = query.get("state");
      const denied = query.get("error");

      if (denied) {
        sessionStorage.removeItem(ORCAROUTER_PKCE_STORAGE_KEY);
        setStatus("error");
        setMessage("OrcaRouter 授权未完成。你可以返回 TOKRACE 后重新连接。");
        return;
      }
      if (!saved?.state || !saved.verifier || returnedState !== saved.state) {
        sessionStorage.removeItem(ORCAROUTER_PKCE_STORAGE_KEY);
        setStatus("error");
        setMessage("授权状态校验失败，已拒绝本次回调。请从 TOKRACE 重新发起连接。");
        return;
      }
      if (!code) {
        sessionStorage.removeItem(ORCAROUTER_PKCE_STORAGE_KEY);
        setStatus("error");
        setMessage("回调中缺少授权码，请从 TOKRACE 重新发起连接。");
        return;
      }

      // State is single-use in TOKRACE as well as the authorization code upstream.
      sessionStorage.removeItem(ORCAROUTER_PKCE_STORAGE_KEY);
      const response = await fetch("/api/orcarouter/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, codeVerifier: saved.verifier }),
      });
      const payload = (await response.json().catch(() => null)) as {
        key?: unknown;
        error?: unknown;
      } | null;
      if (!response.ok || typeof payload?.key !== "string") {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          typeof payload?.error === "string"
            ? `连接失败：${payload.error}`
            : "OrcaRouter 连接失败，请返回后重试。"
        );
        return;
      }

      localStorage.setItem(
        "ma.endpoints",
        JSON.stringify(upsertOrcaRouterEndpoint(readEndpoints(), payload.key))
      );
      if (cancelled) return;
      setStatus("success");
      setMessage("OrcaRouter 已接入，正在返回 TOKRACE…");
      window.setTimeout(() => location.replace(target), 800);
    })().catch(() => {
      if (cancelled) return;
      setStatus("error");
      setMessage("连接过程中出现网络错误，请返回后重试。");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-5 text-center">
      <div className="text-[32px]" aria-hidden>
        {status === "success" ? "✓" : status === "error" ? "!" : "↗"}
      </div>
      <h1 className="mt-4 text-[20px] font-bold">OrcaRouter × TOKRACE</h1>
      <p className="mt-3 text-[14px] leading-6 text-faint">{message}</p>
      {status === "error" && (
        <a
          href={returnTo}
          className="mt-6 rounded-md bg-ink px-4 py-2 text-[13px] font-bold text-paper"
        >
          返回 TOKRACE
        </a>
      )}
    </main>
  );
}
