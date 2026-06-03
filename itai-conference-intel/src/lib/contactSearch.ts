import type { Contact } from "./clientStore";

export function contactMatchesSearch(contact: Contact, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const email = (contact.email ?? "").toLowerCase();
  if (email.includes(q)) return true;

  const first = (contact.firstName ?? "").toLowerCase();
  const last = (contact.lastName ?? "").toLowerCase();
  const full = contact.canonicalName.toLowerCase();

  return first.includes(q) || last.includes(q) || full.includes(q);
}
