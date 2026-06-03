"use client";

import { useSyncExternalStore } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileNav } from "@/components/MobileNav";

function useDesktopShell() {
  return useSyncExternalStore(subscribe, getDesktopSnapshot, () => false);
}

function getDesktopSnapshot() {
  const portrait = window.matchMedia("(orientation: portrait)").matches;
  if (portrait) return false;
  return window.matchMedia("(min-width: 1024px)").matches;
}

function subscribe(onStoreChange: () => void) {
  const portraitMq = window.matchMedia("(orientation: portrait)");
  const widthMq = window.matchMedia("(min-width: 1024px)");
  const onChange = () => onStoreChange();
  portraitMq.addEventListener("change", onChange);
  widthMq.addEventListener("change", onChange);
  return () => {
    portraitMq.removeEventListener("change", onChange);
    widthMq.removeEventListener("change", onChange);
  };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const desktop = useDesktopShell();

  if (desktop) {
    return (
      <div className="app-shell app-shell--desktop flex min-h-dvh w-full flex-row">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="app-shell-main w-full flex-1 px-6 py-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--mobile flex min-h-dvh w-full flex-col">
      <MobileHeader />
      <main className="app-shell-main min-w-0 w-full flex-1 overflow-x-hidden px-4 py-4">{children}</main>
      <MobileNav />
    </div>
  );
}
