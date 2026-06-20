import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 接口、鉴权回调、后台管理不收录。
      // 「我的中心」(/me) 改用页面级 noindex（robots 屏蔽会让爬虫看不到 noindex）。
      disallow: ["/api/", "/auth/", "/admin"],
    },
    sitemap: `${BRAND.url}/sitemap.xml`,
    host: BRAND.url,
  };
}
