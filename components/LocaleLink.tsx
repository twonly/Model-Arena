"use client";

import Link, { type LinkProps } from "next/link";
import { useI18n } from "./I18nProvider";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> &
  LinkProps & {
    href: string;
  };

function shouldLocalize(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  return !href.startsWith("/api/");
}

export function LocaleLink({ href, ...props }: Props) {
  const { href: localize } = useI18n();
  return <Link href={shouldLocalize(href) ? localize(href) : href} {...props} />;
}
