"use client";

import { useSyncExternalStore } from "react";
import { INTEGRATIONS_CHANGE_EVENT, STORAGE_KEYS } from "./storageKeys";

const HUBSPOT_TOKEN_KEY = STORAGE_KEYS.hubspotToken;
const GEMINI_API_KEY = STORAGE_KEYS.geminiApiKey;

function notifyChange() {
  window.dispatchEvent(new Event(INTEGRATIONS_CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(INTEGRATIONS_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(INTEGRATIONS_CHANGE_EVENT, onChange);
}

export function loadHubSpotToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(HUBSPOT_TOKEN_KEY)?.trim() ?? "";
}

export function hasHubSpotToken(): boolean {
  return loadHubSpotToken().length > 0;
}

export function saveHubSpotToken(token: string) {
  const trimmed = token.trim();
  if (trimmed) window.localStorage.setItem(HUBSPOT_TOKEN_KEY, trimmed);
  else window.localStorage.removeItem(HUBSPOT_TOKEN_KEY);
  notifyChange();
}

export function useHubSpotToken(): string {
  return useSyncExternalStore(subscribe, loadHubSpotToken, () => "");
}

export function loadGeminiApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(GEMINI_API_KEY)?.trim() ?? "";
}

export function hasGeminiApiKey(): boolean {
  return loadGeminiApiKey().length > 0;
}

export function saveGeminiApiKey(key: string) {
  const trimmed = key.trim();
  if (trimmed) window.localStorage.setItem(GEMINI_API_KEY, trimmed);
  else window.localStorage.removeItem(GEMINI_API_KEY);
  notifyChange();
}

export function useGeminiApiKey(): string {
  return useSyncExternalStore(subscribe, loadGeminiApiKey, () => "");
}
