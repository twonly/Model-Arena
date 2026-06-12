import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Model Arena · 模型竞速对比台",
  description:
    "同一个 Prompt 并发打到多个大模型，流式对比首 token 时延、思考/输出 TPS、总 tokens 与总用时。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
