import { BRAND } from "@/lib/brand";
import "../globals.css";

export const metadata = { metadataBase: new URL(BRAND.url) };

/** OAuth 回跳页的独立根布局（不参与语言路由，纯客户端流程） */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
