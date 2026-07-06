import { Analytics } from "@vercel/analytics/next";
import { BRAND } from "@/lib/brand";
import "../globals.css";

export const metadata = { metadataBase: new URL(BRAND.url) };

/**
 * 可嵌入挂件的独立根布局（app/layout.tsx 已被 [lang] 根布局取代，
 * embed 不参与语言路由，保留极简 html 外壳）。挂件面向中文站点默认 zh。
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
