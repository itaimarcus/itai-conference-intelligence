"use client";

import type { MouseEvent } from "react";
import { useSyncExternalStore } from "react";
import { gmailComposeUrl, mailtoUrl } from "@/lib/leadHelpers";

function subscribe(onChange: () => void) {
  const portraitMq = window.matchMedia("(orientation: portrait)");
  const widthMq = window.matchMedia("(min-width: 1024px)");
  const handler = () => onChange();
  portraitMq.addEventListener("change", handler);
  widthMq.addEventListener("change", handler);
  return () => {
    portraitMq.removeEventListener("change", handler);
    widthMq.removeEventListener("change", handler);
  };
}

/** Matches AppShell mobile layout — mailto works reliably here; Gmail web URLs often drop To: on phones. */
function getMobileShellSnapshot() {
  if (window.matchMedia("(orientation: portrait)").matches) return true;
  return !window.matchMedia("(min-width: 1024px)").matches;
}

function getServerMobileShellSnapshot() {
  return false;
}

function useMobileShell() {
  return useSyncExternalStore(
    subscribe,
    getMobileShellSnapshot,
    getServerMobileShellSnapshot,
  );
}

export function EmailComposeLink({
  email,
  className = "text-emerald-700 underline underline-offset-2 hover:text-emerald-800",
  onClick,
}: {
  email: string;
  className?: string;
  /** Use to avoid navigating the parent row link (Contacts list). */
  onClick?: (e: MouseEvent) => void;
}) {
  const trimmed = email.trim();
  const mobileShell = useMobileShell();
  if (!trimmed) return null;

  const href = mobileShell ? mailtoUrl(trimmed) : gmailComposeUrl(trimmed);

  return (
    <a
      href={href}
      {...(mobileShell
        ? {}
        : { target: "_blank", rel: "noopener noreferrer" })}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      {trimmed}
    </a>
  );
}
