import {
  modelBrandFor,
  providerInitials,
  type ModelBrandInput,
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
  model,
  name,
  baseUrl,
  size = "md",
  brand,
  className = "",
}: ModelBrandInput & {
  size?: keyof typeof SIZE;
  brand?: ProviderBrand | null;
  className?: string;
}) {
  const resolved = brand ?? modelBrandFor({ model, name, provider, baseUrl });
  const s = SIZE[size];
  const label = resolved?.label || name || model || provider || "Unknown provider";
  const title = resolved
    ? `${label} · ${resolved.sourceDomain}`
    : label;

  return (
    <span
      className={`${s.box} inline-flex align-middle shrink-0 items-center justify-center border border-line bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}
      title={title}
      role="img"
      aria-label={`${label} logo`}
    >
      {resolved ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved.icon}
          alt=""
          width={28}
          height={28}
          className={`${s.img} object-contain`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className={`${s.text} font-black text-slate-600`}>
          {providerInitials(label)}
        </span>
      )}
    </span>
  );
}
