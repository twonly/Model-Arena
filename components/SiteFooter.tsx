"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { localizedPath, stripLocalePrefix } from "@/lib/i18n";

export function SiteFooter() {
  const { locale } = useI18n();
  const pathname = stripLocalePrefix(usePathname()).pathname;
  if (/^\/(arena|me|r)(\/|$)/.test(pathname)) return null;
  const en = locale === "en";
  const links = [
    ["/providers/orcarouter", "OrcaRouter"],
    ["/about", en ? "About" : "关于我们"],
    ["/contact", en ? "Contact" : "联系我们"],
    ["/privacy", en ? "Privacy" : "隐私政策"],
    ["/terms", en ? "Terms" : "使用条款"],
  ];
  return (
    <footer className="mx-auto max-w-6xl border-t border-line px-5 py-6 sm:px-6">
      <nav aria-label={en ? "Site information" : "网站信息"} className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-[12px] text-faint">
        {links.map(([href, label]) => (
          <Link key={href} href={localizedPath(href, locale)} className="hover:text-ink hover:underline">
            {label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
