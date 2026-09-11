import { NextResponse, type NextRequest } from "next/server";
import {
  NEXT_LOCALE_COOKIE,
  localeAliasRedirectPath,
  localizedPath,
  pathLocale,
  resolveLocale,
} from "@/lib/i18n";

const PUBLIC_FILE = /\.(.*)$/;

function shouldSkip(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/admin") ||
    // 可嵌入挂件：第三方 iframe 引用，不能被语言重定向（307 会让嵌入失败）
    pathname.startsWith("/embed") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    // 元数据图片路由（无扩展名，PUBLIC_FILE 兜不住）不参与语言重定向，
    // 否则社媒抓取 OG 图时会被 307 跳走、拿不到图
    pathname === "/opengraph-image" ||
    PUBLIC_FILE.test(pathname)
  );
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (shouldSkip(pathname)) return NextResponse.next();

  // 已带规范语言前缀：直接放行（页面从路由参数取 locale，
  // 不再注入请求头——那会把全站页面拖成动态渲染）
  if (pathLocale(pathname)) return NextResponse.next();

  // /zh、/zh-cn、/en-US 等别名/大小写前缀：308 归一到规范前缀，
  // 否则会跳到 /zh-CN/zh-cn/... 404，Search Console 报「重定向错误」
  const aliasPath = localeAliasRedirectPath(pathname);
  if (aliasPath) {
    const url = request.nextUrl.clone();
    url.pathname = aliasPath;
    return NextResponse.redirect(url, 308);
  }

  const targetLocale = resolveLocale({
    pathname,
    lang: searchParams.get("lang"),
    locale: searchParams.get("locale"),
    cookieLocale: request.cookies.get(NEXT_LOCALE_COOKIE)?.value,
    source: searchParams.get("source"),
    utmSource: searchParams.get("utm_source"),
    referrer: request.headers.get("referer"),
    acceptLanguage: request.headers.get("accept-language"),
  });

  const url = request.nextUrl.clone();
  url.pathname = localizedPath(pathname, targetLocale);
  url.searchParams.delete("lang");
  url.searchParams.delete("locale");
  // 无前缀旧地址 → 带语言前缀正式页是永久策略，308 让 Google 把权重并给目标页
  // （307 会让 Google 想继续索引无内容的旧地址，Search Console 持续报
  // 「网页会自动重定向」）。目标随 Accept-Language / Cookie 变化，
  // 禁止浏览器把这条重定向缓存成死值。
  const response = NextResponse.redirect(url, 308);
  response.headers.set("cache-control", "no-store");
  if (searchParams.get("lang") || searchParams.get("locale")) {
    response.cookies.set(NEXT_LOCALE_COOKIE, targetLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
