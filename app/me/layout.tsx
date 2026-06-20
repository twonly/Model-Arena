import type { Metadata } from "next";

// 「我的中心」页面本体是客户端组件，无法导出 metadata；
// 用 layout 承载 noindex，避免个人私有页被搜索引擎收录。
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
