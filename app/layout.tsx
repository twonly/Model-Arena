import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "百模竞速 · Model Arena",
  description:
    "同一个 Prompt 并发打到多个大模型，流式对比首 Token 时延、思考/输出 TPS、峰值速度与 token 数。出品：AI拯救打工人。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        {/* 首帧前应用已保存的主题，避免暗色用户看到白屏闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(JSON.parse(localStorage.getItem("ma.theme"))==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
