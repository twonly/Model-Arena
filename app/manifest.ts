import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.full} — ${BRAND.taglineZh}`,
    short_name: BRAND.en,
    description: BRAND.descZh,
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f1",
    theme_color: "#1d1c18",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
