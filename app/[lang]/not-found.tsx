import Link from "next/link";

/** [lang] 树内未匹配路径的 404（继承根布局，双语一并给出） */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="num text-[56px] font-black leading-none">404</div>
      <p className="text-[15px] text-faint">
        页面不存在或已被移动 · This page doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="rounded-md bg-ink px-5 py-2 text-[14px] font-bold text-paper hover:opacity-90"
      >
        返回首页 · Back home
      </Link>
    </main>
  );
}
