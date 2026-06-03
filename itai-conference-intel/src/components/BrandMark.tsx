import Link from "next/link";
import { BRAND_HOME_URL, BRAND_LINES, BRAND_NAME } from "@/lib/brand";

export function BrandTitle({
  compact,
  align = "center",
}: {
  compact?: boolean;
  align?: "center" | "left";
}) {
  return (
    <span
      className={[
        "flex flex-col font-semibold leading-snug text-slate-900",
        align === "left" ? "items-start text-left" : "items-center text-center",
        compact ? "text-[10px]" : "text-xs",
      ].join(" ")}
    >
      {BRAND_LINES.map((line) => (
        <span key={line} className="whitespace-nowrap">
          {line}
        </span>
      ))}
    </span>
  );
}

export function BrandLogoLink({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <Link
      href={BRAND_HOME_URL}
      className={["inline-flex shrink-0 hover:opacity-90", className].join(" ")}
      title={BRAND_NAME}
    >
      <BrandLogo size={size} />
    </Link>
  );
}

export function BrandLogo({
  size = "md",
}: {
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-9 w-9 text-[11px]" : "h-10 w-10 text-xs";
  return (
    <span
      className={["relative shrink-0 overflow-hidden rounded-lg", dim].join(" ")}
      aria-hidden
    >
      <span className="absolute inset-0 bg-blue-600" />
      <span className="relative z-10 flex h-full w-full items-center justify-center font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
        iCi
      </span>
    </span>
  );
}

export function BrandMark({
  showTitle = true,
  logoSize = "md",
  className = "",
  compactTitle = false,
  titleAlign = "center",
}: {
  showTitle?: boolean;
  logoSize?: "sm" | "md";
  className?: string;
  compactTitle?: boolean;
  titleAlign?: "center" | "left";
}) {
  return (
    <Link
      href={BRAND_HOME_URL}
      className={["flex items-center gap-2.5 hover:opacity-90", className].join(" ")}
      title={BRAND_NAME}
    >
      <BrandLogo size={logoSize} />
      {showTitle ? (
        <BrandTitle compact={compactTitle} align={titleAlign} />
      ) : null}
    </Link>
  );
}
