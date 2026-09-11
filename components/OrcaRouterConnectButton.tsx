"use client";

import { useState, type ReactNode } from "react";
import { beginOrcaRouterConnect } from "@/lib/orcarouter";

export function OrcaRouterConnectButton({
  returnTo,
  children,
  className = "",
}: {
  returnTo: string;
  children: ReactNode;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await beginOrcaRouterConnect(returnTo);
          } catch {
            setBusy(false);
            setError("Unable to start OrcaRouter authorization");
          }
        }}
        className={className}
      >
        {busy ? "Connecting…" : children}
      </button>
      {error && <span className="text-[11px] text-accent">{error}</span>}
    </span>
  );
}
