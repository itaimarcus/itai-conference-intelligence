import type { Lead, MatchResult } from "./clientStore";

export const LINKEDIN_PREFIX = "linkedin.com/in/";

export function normalizePhone(phone?: string): string {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits.length >= 7 ? digits : "";
}

export function leadFullName(
  lead: Pick<Lead, "firstName" | "lastName" | "fullName" | "email" | "phone">,
) {
  if (lead.firstName?.trim() || lead.lastName?.trim()) {
    return [lead.firstName?.trim(), lead.lastName?.trim()].filter(Boolean).join(" ");
  }
  if (lead.fullName?.trim()) return lead.fullName.trim();
  if (lead.email?.trim()) {
    const local = lead.email.split("@")[0]?.replace(/[._+]/g, " ").trim();
    if (local) return local;
  }
  if (lead.phone?.trim()) return lead.phone.trim();
  return "Unknown contact";
}

export function hasValidEmail(email?: string): boolean {
  const e = email?.trim();
  if (!e) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function buildLinkedInUrl(slug: string) {
  const s = slug.trim().replace(/^\/+/, "");
  if (!s) return undefined;
  return `https://www.${LINKEDIN_PREFIX}${s}`;
}

export function normalizeLinkedInInput(input: string): string | undefined {
  const t = input.trim();
  if (!t) return undefined;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.toLowerCase().includes("linkedin.com")) {
    return `https://${t.replace(/^https?:\/\//i, "")}`;
  }
  return buildLinkedInUrl(t);
}

/** Display label for links, e.g. linkedin.com/in/username */
export function compactLinkedInLabel(url?: string): string | undefined {
  if (!url?.trim()) return undefined;
  let u = externalHref(url).replace(/^https?:\/\//i, "");
  u = u.replace(/^www\./i, "");
  return u;
}

/** Opens the device default mail app with the recipient in To: (works on mobile). */
export function mailtoUrl(email: string) {
  return `mailto:${email.trim()}`;
}

/** Opens Gmail compose with the recipient filled in (user must be signed into Gmail). */
export function gmailComposeUrl(email: string) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email.trim())}`;
}

export function externalHref(url: string) {
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u.replace(/^\/+/, "")}`;
}

export function linkedInSlugFromUrl(url?: string) {
  if (!url) return "";
  const lower = url.toLowerCase();
  const idx = lower.indexOf("linkedin.com/in/");
  if (idx === -1) return url.replace(/^https?:\/\//, "");
  return url.slice(idx + "linkedin.com/in/".length).replace(/\/$/, "");
}

export function normalizeLegacyLead(raw: Lead): Lead {
  if (raw.firstName?.trim()) return raw;
  const fullName = raw.fullName?.trim() ?? "";
  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    ...raw,
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
    fullName,
    company: raw.company ?? "",
  };
}

export function formatEncounterOrdinal(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

export function captureSavedBanner(match: MatchResult, fullName: string) {
  if (match.wasCreated) {
    return {
      title: "New contact - Saved",
      subtitle: "",
    };
  }
  const count = match.encounterCount ?? 1;
  const ordinal = formatEncounterOrdinal(count);
  return {
    title: `${fullName} saved`,
    subtitle: `Already in your contacts — ${ordinal} encounter`,
  };
}
