import {
  providerBrandFor,
  providerInitials,
  type ProviderBrand,
} from "@/lib/provider-icons";

const SIZE = {
  sm: {
    box: "h-6 w-6 rounded-md",
    img: "h-4 w-4",
    text: "text-[9px]",
  },
  md: {
    box: "h-8 w-8 rounded-lg",
    img: "h-5 w-5",
    text: "text-[10px]",
  },
  lg: {
    box: "h-10 w-10 rounded-lg",
    img: "h-7 w-7",
    text: "text-[11px]",
  },
} as const;

export function ProviderIcon({
  provider,
  size = "md",
  brand,
  className = "",
}: {
  provider: string;
  size?: keyof typeof SIZE;
  brand?: ProviderBrand | null;
  className?: string;
}) {
  const resolved = brand ?? providerBrandFor(provider);
  const s = SIZE[size];
  const title = resolved
    ? `${provider} · ${resolved.sourceDomain}`
    : provider || "Unknown provider";

  return (
    <span
      className={`${s.box} inline-flex shrink-0 items-center justify-center border border-line bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}
      title={title}
      aria-label={provider ? `${provider} logo` : "Provider logo"}
    >
      {resolved ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved.icon}
          alt=""
          className={`${s.img} object-contain`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className={`${s.text} font-black text-faint`}>
          {providerInitials(provider)}
        </span>
      )}
    </span>
  );
}
