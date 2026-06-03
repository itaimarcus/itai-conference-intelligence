import { CONFERENCES } from "./conferences";

/** Conference name for display; null when not tied to an event. */
export function conferenceDisplayName(conferenceId?: string): string | null {
  if (!conferenceId) return null;
  return CONFERENCES.find((c) => c.id === conferenceId)?.name ?? conferenceId;
}
