import type { Contact, Encounter } from "./clientStore";

/** Chronological encounter notes as "1. …", "2. …" for the contact profile. */
export function aggregateContactNotes(
  contactId: string,
  encounters: Encounter[],
): string | undefined {
  const lines = encounters
    .filter((e) => e.contactId === contactId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((e, index) => {
      const text = e.notes?.trim();
      if (!text) return null;
      return `${index + 1}. ${text}`;
    })
    .filter((line): line is string => Boolean(line));
  return lines.length > 0 ? lines.join("\n") : undefined;
}

export function resolveContactIcp(
  contact: Contact,
  encounters: Encounter[],
): number | undefined {
  if (contact.icpEstimate !== undefined) return contact.icpEstimate;
  const latest = encounters
    .filter((e) => e.contactId === contact.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return latest?.icpEstimate;
}

export function resolveContactLifecycle(
  contact: Contact,
  encounters: Encounter[],
): string | undefined {
  if (contact.lifecycleStage) return contact.lifecycleStage;
  const latest = encounters
    .filter((e) => e.contactId === contact.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return latest?.lifecycleStage;
}
