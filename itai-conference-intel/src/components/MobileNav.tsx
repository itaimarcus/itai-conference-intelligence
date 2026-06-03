"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/conferences", label: "Conferences", short: "C" },
  { href: "/planner", label: "Plan", short: "P" },
  { href: "/capture", label: "Capture", short: "+" },
  { href: "/contacts", label: "Contacts", short: "C" },
  { href: "/settings", label: "Settings", short: "S" },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold",
                active ? "text-blue-700" : "text-slate-500",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-lg font-bold",
                  item.short === "+" ? "text-lg leading-none" : "text-xs",
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                {item.short}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
