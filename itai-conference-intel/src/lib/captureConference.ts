import { CONFERENCES } from "./conferences";
import { loadStore } from "./clientStore";
import { scoreConference } from "./scoring";
import {
  CAPTURE_CONFERENCE_CHANGE_EVENT,
  STORAGE_KEYS,
  STORE_CHANGE_EVENT,
} from "./storageKeys";

const LAST_CAPTURE_CONFERENCE_KEY = STORAGE_KEYS.lastCaptureConference;

export const CAPTURE_CONFERENCE_SSR_DEFAULT = "money2020-europe-2026";

export function rememberCaptureConference(conferenceId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_CAPTURE_CONFERENCE_KEY, conferenceId);
  window.dispatchEvent(new Event(CAPTURE_CONFERENCE_CHANGE_EVENT));
}

function subscribeCaptureConference(onChange: () => void) {
  window.addEventListener(STORE_CHANGE_EVENT, onChange);
  window.addEventListener(CAPTURE_CONFERENCE_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener(STORE_CHANGE_EVENT, onChange);
    window.removeEventListener(CAPTURE_CONFERENCE_CHANGE_EVENT, onChange);
  };
}

export function subscribeSuggestedCaptureConference(onChange: () => void) {
  return subscribeCaptureConference(onChange);
}

export function resolveCaptureConferenceId(): string {
  if (typeof window === "undefined") return CAPTURE_CONFERENCE_SSR_DEFAULT;

  const last = window.localStorage.getItem(LAST_CAPTURE_CONFERENCE_KEY);
  if (last && CONFERENCES.some((c) => c.id === last)) return last;

  const today = new Date().toISOString().slice(0, 10);
  const plan = loadStore().plan;
  const planned = CONFERENCES.filter((c) => plan[c.id])
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const nextPlanned =
    planned.find((c) => c.startDate >= today) ?? planned[planned.length - 1];
  if (nextPlanned) return nextPlanned.id;

  const upcoming = [...CONFERENCES]
    .filter((c) => c.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const strong = upcoming.find((c) => scoreConference(c).total >= 70);
  if (strong) return strong.id;
  if (upcoming[0]) return upcoming[0].id;

  return CAPTURE_CONFERENCE_SSR_DEFAULT;
}
