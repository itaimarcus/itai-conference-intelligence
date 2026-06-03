"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";

type NavItem = {
  href: string;
  label: string;
  short: string;
};

const NAV: NavItem[] = [
  { href: "/conferences", label: "Conferences", short: "C" },
  { href: "/planner", label: "Plan", short: "P" },
  { href: "/capture", label: "Capture", short: "+" },
  { href: "/contacts", label: "Contacts", short: "C" },
  { href: "/settings", label: "Settings", short: "S" },
];

const NAV_ICON =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold ring-1 ring-inset";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname() ?? "/";

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-3">
        <BrandMark
          logoSize="sm"
          titleAlign="center"
          className="gap-3 px-3 py-1"
        />
      </div>

      <nav className="p-3">
        <div className="space-y-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold",
                  active
                    ? "bg-blue-50 text-blue-900 ring-1 ring-inset ring-blue-200"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")}
              >
                <span
                  className={[
                    NAV_ICON,
                    item.short === "+" ? "text-lg leading-none" : "text-xs",
                    active
                      ? "bg-blue-600 text-white ring-blue-600"
                      : "bg-white text-slate-500 ring-slate-200 group-hover:text-slate-700",
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
    </aside>
  );
}
