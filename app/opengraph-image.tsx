import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${BRAND.full} — ${BRAND.taglineEn}`;

// 默认社媒分享卡片。英文为主，避免 satori 无内置 CJK 字体导致的方框。
const INK = "#1d1c18";
const PAPER = "#f6f5f1";
const ACCENT = "#ff6157";
const FAINT = "#8f8b83";

// 三条装饰赛道
const LANES = [
  { w: "92%", c: ACCENT, label: "312 tok/s" },
  { w: "74%", c: "#cfccc4", label: "187 tok/s" },
  { w: "52%", c: "#6f6c64", label: "96 tok/s" },
];

export default async function OgImage() {
  // 与本路由同目录、用 import.meta.url 引用，确保被打进函数包（public/ 运行时读不到）
  const logoData = await readFile(new URL("./og-logo.png", import.meta.url));
  const logoSrc = `data:image/png;base64,${Buffer.from(logoData).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          color: PAPER,
          padding: "72px 80px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* 站点 logo（圆角白底徽标，深色卡片上更醒目） */}
          <img
            src={logoSrc}
            width={80}
            height={80}
            style={{ borderRadius: 18 }}
          />
          <div style={{ fontSize: 26, color: FAINT, letterSpacing: 2 }}>
            {BRAND.domain}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ fontSize: 132, fontWeight: 800, letterSpacing: -2 }}>
              TOKRACE
            </div>
            {/* 播放三角（用边框绘制，避免依赖字体里的 ▶ 字形） */}
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: "30px solid transparent",
                borderBottom: "30px solid transparent",
                borderLeft: `46px solid ${ACCENT}`,
              }}
            />
          </div>
          <div style={{ fontSize: 36, color: FAINT, marginTop: 8 }}>
            {BRAND.taglineEn}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {LANES.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  width: 760,
                  height: 22,
                  borderRadius: 22,
                  background: "#2c2a24",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: l.w,
                    height: "100%",
                    borderRadius: 22,
                    background: l.c,
                  }}
                />
              </div>
              <div style={{ fontSize: 26, color: FAINT }}>{l.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
