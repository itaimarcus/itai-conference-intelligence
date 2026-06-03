"use client";

import { useSyncExternalStore } from "react";
import { STORAGE_KEYS, STORE_CHANGE_EVENT } from "./storageKeys";

const TEAM_KEY = STORAGE_KEYS.team;

export const DEFAULT_TEAM_MEMBERS = ["Itai", "Alex", "Sam"];

let cachedRaw: string | null | undefined;
let cachedMembers: string[] = DEFAULT_TEAM_MEMBERS;

export function loadTeamMembers(): string[] {
  if (typeof window === "undefined") return DEFAULT_TEAM_MEMBERS;
  try {
    const raw = window.localStorage.getItem(TEAM_KEY);
    if (raw === cachedRaw) return cachedMembers;

    cachedRaw = raw;
    if (!raw) {
      cachedMembers = DEFAULT_TEAM_MEMBERS;
      return cachedMembers;
    }

    const parsed = JSON.parse(raw) as string[];
    cachedMembers =
      parsed.length > 0 ? parsed.map((m) => m.trim()).filter(Boolean) : DEFAULT_TEAM_MEMBERS;
    if (cachedMembers.length === 0) cachedMembers = DEFAULT_TEAM_MEMBERS;
    return cachedMembers;
  } catch {
    cachedMembers = DEFAULT_TEAM_MEMBERS;
    return cachedMembers;
  }
}

export function saveTeamMembers(members: string[]) {
  const cleaned = members.map((m) => m.trim()).filter(Boolean);
  const serialized = JSON.stringify(cleaned);
  window.localStorage.setItem(TEAM_KEY, serialized);
  cachedRaw = serialized;
  cachedMembers = cleaned.length > 0 ? cleaned : DEFAULT_TEAM_MEMBERS;
  window.dispatchEvent(new Event(STORE_CHANGE_EVENT));
}

export function parseTeamMembersText(text: string): string[] {
  const byLine = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byLine.length > 1) return byLine;
  if (text.includes(",")) {
    return text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return byLine;
}

export function formatTeamMembersText(members: string[]): string {
  return members.join("\n");
}

function subscribeTeam(onChange: () => void) {
  const onStoreChange = () => {
    cachedRaw = undefined;
    onChange();
  };
  window.addEventListener(STORE_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(STORE_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useTeamMembers(): string[] {
  return useSyncExternalStore(subscribeTeam, loadTeamMembers, () => DEFAULT_TEAM_MEMBERS);
}
