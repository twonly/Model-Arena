import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_HEADER,
  NEXT_LOCALE_COOKIE,
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
    pathname.startsWith("/auth/callback") ||
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

function nextWithLocale(request: NextRequest, locale: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (shouldSkip(pathname)) return NextResponse.next();

  const currentLocale = pathLocale(pathname);
  if (currentLocale) return nextWithLocale(request, currentLocale);

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
  const response = NextResponse.redirect(url, 307);
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
