"use client";

import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { BRAND_NAME } from "@/lib/brand";

const TITLES: Record<string, string> = {
  "/": BRAND_NAME,
  "/conferences": "Conferences",
  "/planner": "Plan",
  "/capture": "Capture",
  "/contacts": "Contacts",
  "/settings": "Settings",
};

function titleForPath(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  const base = pathname.split("/").filter(Boolean)[0];
  if (base && TITLES[`/${base}`]) return TITLES[`/${base}`];
  return BRAND_NAME;
}

export function MobileHeader() {
  const pathname = usePathname() ?? "/";
  const title = titleForPath(pathname);

  const showPageTitle = pathname !== "/";

  return (
    <header className="sticky top-0 z-40 flex h-14 min-w-0 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
      <BrandMark
        showTitle={!showPageTitle}
        logoSize="sm"
        compactTitle
        className="shrink-0 ml-0.5"
      />
      {showPageTitle ? (
        <span className="min-w-0 truncate pl-0.5 text-sm font-semibold text-slate-900">
          {title}
        </span>
      ) : null}
    </header>
  );
}
