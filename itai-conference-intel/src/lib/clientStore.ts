"use client";

import { aggregateContactNotes } from "./contactDisplay";
import { leadFullName, normalizeLegacyLead, normalizePhone } from "./leadHelpers";
import { STORAGE_KEYS, STORE_CHANGE_EVENT } from "./storageKeys";

const KEY = STORAGE_KEYS.store;

export type PlanItem = {
  conferenceId: string;
  status: "going";
  addedAt: string; // ISO
  assignedTo?: string;
  assignedTo2?: string;
};

export type StoreShape = {
  plan: Record<string, PlanItem>;
  leads: Lead[];
  contacts: Contact[];
  encounters: Encounter[];
};

export const EMPTY_STORE: StoreShape = {
  plan: {},
  leads: [],
  contacts: [],
  encounters: [],
};

let cachedRaw: string | null | undefined;
let cachedStore: StoreShape = EMPTY_STORE;

function cloneStore(store: StoreShape): StoreShape {
  return {
    plan: { ...store.plan },
    leads: [...store.leads],
    contacts: [...store.contacts],
    encounters: [...store.encounters],
  };
}

function safeParse(json: string | null): StoreShape | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as StoreShape;
  } catch {
    return null;
  }
}

export function loadStore(): StoreShape {
  if (typeof window === "undefined") return EMPTY_STORE;
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedStore;

  cachedRaw = raw;
  const parsed = safeParse(raw);
  if (!parsed) {
    cachedStore = EMPTY_STORE;
    return EMPTY_STORE;
  }
  parsed.leads = parsed.leads.map((l) => normalizeLegacyLead(stripRemovedLeadFields(l)));
  parsed.contacts = (parsed.contacts ?? []).map((c) =>
    stripRemovedContactFields(c),
  );
  parsed.encounters = (parsed.encounters ?? []).map((e) =>
    stripRemovedEncounterFields(e),
  );
  for (const contact of parsed.contacts) {
    const aggregated = aggregateContactNotes(contact.id, parsed.encounters);
    if (aggregated) contact.notes = aggregated;
  }
  cachedStore = parsed;
  return cachedStore;
}

export function saveStore(next: StoreShape) {
  const serialized = JSON.stringify(next);
  window.localStorage.setItem(KEY, serialized);
  cachedRaw = serialized;
  cachedStore = cloneStore(next);
  window.dispatchEvent(new Event(STORE_CHANGE_EVENT));
}

export function upsertPlanItem(
  conferenceId: string,
  status: PlanItem["status"] = "going",
  assignedTo?: string,
) {
  const store = loadStore();
  const existing = store.plan[conferenceId];
  store.plan[conferenceId] = {
    conferenceId,
    status,
    addedAt: existing?.addedAt ?? new Date().toISOString(),
    assignedTo: assignedTo ?? existing?.assignedTo,
    assignedTo2: existing?.assignedTo2,
  };
  saveStore(store);
  return store;
}

export function setPlanAssignment(
  conferenceId: string,
  assignedTo: string | undefined,
  assignedTo2?: string | undefined,
) {
  const store = loadStore();
  const item = store.plan[conferenceId];
  if (!item) return store;
  const nextAssignedTo = assignedTo || undefined;
  const next = {
    ...item,
    assignedTo: nextAssignedTo,
  };
  // Third argument omitted = leave second rep unchanged; passed (even undefined) = update.
  if (arguments.length >= 3) {
    next.assignedTo2 = assignedTo2?.trim() ? assignedTo2.trim() : undefined;
  }
  if (
    next.assignedTo2 &&
    nextAssignedTo &&
    next.assignedTo2 === nextAssignedTo
  ) {
    next.assignedTo2 = undefined;
  }
  store.plan[conferenceId] = next;
  saveStore(store);
  return store;
}

export const LARGE_EVENT_AUDIENCE = 10000;

export function removePlanItem(conferenceId: string) {
  const store = loadStore();
  delete store.plan[conferenceId];
  saveStore(store);
  return store;
}

export function clearAllPlan() {
  const store = loadStore();
  store.plan = {};
  saveStore(store);
  return store;
}

export type ContactUpdate = Partial<
  Pick<
    Contact,
    | "firstName"
    | "lastName"
    | "canonicalName"
    | "canonicalCompany"
    | "email"
    | "phone"
    | "linkedInUrl"
    | "jobTitle"
    | "contactOwner"
    | "lifecycleStage"
    | "icpEstimate"
    | "notes"
    | "relationshipSummary"
    | "relationshipSummaryAt"
  >
>;

export function updateContact(contactId: string, patch: ContactUpdate) {
  const store = loadStore();
  const idx = store.contacts.findIndex((c) => c.id === contactId);
  if (idx === -1) return store;
  const current = store.contacts[idx]!;
  const next = { ...current, ...patch };

  if (patch.firstName !== undefined || patch.lastName !== undefined) {
    const first = (patch.firstName ?? current.firstName ?? "").trim();
    const last = (patch.lastName ?? current.lastName ?? "").trim();
    const joined = [first, last].filter(Boolean).join(" ");
    if (joined) next.canonicalName = joined;
    next.firstName = first || undefined;
    next.lastName = last || undefined;
  }

  if (patch.email !== undefined) {
    next.email = patch.email.trim().toLowerCase() || undefined;
  }

  store.contacts[idx] = next;
  saveStore(store);
  return store;
}

export function deleteContact(contactId: string) {
  const store = loadStore();
  const contact = store.contacts.find((c) => c.id === contactId);
  if (!contact) return store;

  const email = contact.email?.toLowerCase();
  store.contacts = store.contacts.filter((c) => c.id !== contactId);
  store.encounters = store.encounters.filter((e) => e.contactId !== contactId);
  if (email) {
    store.leads = store.leads.filter((l) => l.email?.toLowerCase() !== email);
  }
  saveStore(store);
  return store;
}

export type Lead = {
  id: string;
  createdAt: string; // ISO
  conferenceId?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedInUrl?: string;
  contactOwner?: string;
  jobTitle?: string;
  lifecycleStage?: string;
  notes?: string;
  icpEstimate?: number;
};

export type Contact = {
  id: string;
  createdAt: string; // ISO
  canonicalName: string;
  firstName?: string;
  lastName?: string;
  canonicalCompany?: string;
  email?: string;
  phone?: string;
  linkedInUrl?: string;
  jobTitle?: string;
  contactOwner?: string;
  lifecycleStage?: string;
  icpEstimate?: number;
  notes?: string;
  /** Gemini relationship summary; stored in localStorage with the contact. */
  relationshipSummary?: string;
  relationshipSummaryAt?: string;
};

export type Encounter = {
  id: string;
  createdAt: string; // ISO
  contactId: string;
  conferenceId?: string;
  encounteredBy?: string;
  fullName: string;
  company: string;
  email?: string;
  phone?: string;
  linkedInUrl?: string;
  jobTitle?: string;
  lifecycleStage?: string;
  notes?: string;
  icpEstimate?: number;
  matchConfidence: "high" | "medium" | "low";
  matchReason: string;
};

export function addLead(lead: Lead) {
  const store = loadStore();
  store.leads.unshift(lead);
  saveStore(store);
  return store;
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/** Drop removed fields if old data is still in localStorage. */
function stripRemovedLeadFields(raw: Lead & { tags?: unknown }): Lead {
  const { tags: _tags, ...rest } = raw;
  return rest;
}

function stripRemovedContactFields(raw: Contact & { tag?: unknown }): Contact {
  const { tag: _tag, ...rest } = raw;
  return rest;
}

function stripRemovedEncounterFields(
  raw: Encounter & { tags?: unknown },
): Encounter {
  const { tags: _tags, ...rest } = raw;
  return rest;
}

export type MatchResult = {
  contact: Contact;
  confidence: "high" | "medium" | "low";
  reason: string;
  wasCreated: boolean;
  /** Total encounters for this contact after the latest save (set by addEncounterFromLead). */
  encounterCount?: number;
};

/**
 * Merge lead capture into an existing contact profile.
 * Re-registration always adds a new encounter; profile fields prefer the latest
 * capture when the lead supplies a non-empty value, and never clear existing data
 * with empty form fields.
 */
function enrichContact(existing: Contact, lead: Lead): Contact {
  const phone = normalizePhone(lead.phone);
  const displayName = leadFullName(lead);
  const firstName = lead.firstName?.trim() || existing.firstName;
  const lastName = lead.lastName?.trim() || existing.lastName;
  const joined = [firstName, lastName].filter(Boolean).join(" ");
  const canonicalName =
    joined ||
    (displayName !== "Unknown contact" ? displayName : undefined) ||
    existing.canonicalName;
  return {
    ...existing,
    canonicalName,
    firstName,
    lastName,
    canonicalCompany: lead.company?.trim() || existing.canonicalCompany,
    email: lead.email?.trim().toLowerCase() || existing.email,
    linkedInUrl: lead.linkedInUrl?.trim() || existing.linkedInUrl,
    phone: phone || existing.phone,
    jobTitle: lead.jobTitle?.trim() || existing.jobTitle,
    contactOwner: lead.contactOwner?.trim() || existing.contactOwner,
    notes: existing.notes,
    lifecycleStage: lead.lifecycleStage ?? existing.lifecycleStage,
    icpEstimate: lead.icpEstimate ?? existing.icpEstimate,
  };
}

function contactNeedsUpdate(before: Contact, after: Contact): boolean {
  return JSON.stringify(before) !== JSON.stringify(after);
}

function saveEnrichedContact(store: StoreShape, contact: Contact) {
  const idx = store.contacts.findIndex((c) => c.id === contact.id);
  if (idx === -1) return;
  store.contacts[idx] = contact;
  saveStore(store);
}

export function matchOrCreateContactFromLead(lead: Lead): MatchResult {
  const store = loadStore();

  const email = lead.email?.trim().toLowerCase();
  const linkedInUrl = lead.linkedInUrl?.trim().toLowerCase();
  const phone = normalizePhone(lead.phone);

  if (email) {
    const existing = store.contacts.find((c) => c.email?.toLowerCase() === email);
    if (existing) {
      const enriched = enrichContact(existing, lead);
      if (contactNeedsUpdate(existing, enriched)) saveEnrichedContact(store, enriched);
      return { contact: enriched, confidence: "high", reason: "email", wasCreated: false };
    }
  }

  if (linkedInUrl) {
    const existing = store.contacts.find(
      (c) => c.linkedInUrl?.toLowerCase() === linkedInUrl,
    );
    if (existing) {
      const enriched = enrichContact(existing, lead);
      if (contactNeedsUpdate(existing, enriched)) saveEnrichedContact(store, enriched);
      return {
        contact: enriched,
        confidence: "high",
        reason: "linkedin",
        wasCreated: false,
      };
    }
  }

  if (phone) {
    const existing = store.contacts.find((c) => normalizePhone(c.phone) === phone);
    if (existing) {
      const enriched = enrichContact(existing, lead);
      if (contactNeedsUpdate(existing, enriched)) saveEnrichedContact(store, enriched);
      return {
        contact: enriched,
        confidence: "high",
        reason: "phone",
        wasCreated: false,
      };
    }
  }

  const displayName = leadFullName(lead);
  const created: Contact = {
    id: uid(),
    createdAt: new Date().toISOString(),
    canonicalName: displayName,
    firstName: lead.firstName,
    lastName: lead.lastName,
    canonicalCompany: lead.company?.trim(),
    email,
    phone: phone || undefined,
    linkedInUrl,
    jobTitle: lead.jobTitle?.trim(),
    contactOwner: lead.contactOwner?.trim(),
    lifecycleStage: lead.lifecycleStage,
    icpEstimate: lead.icpEstimate,
  };
  store.contacts.unshift(created);
  saveStore(store);
  return {
    contact: created,
    confidence: "low",
    reason: "new_contact",
    wasCreated: true,
  };
}

export function addEncounterFromLead(lead: Lead) {
  const store = loadStore();
  const match = matchOrCreateContactFromLead(lead);
  const encounter: Encounter = {
    id: uid(),
    createdAt: lead.createdAt,
    contactId: match.contact.id,
    conferenceId: lead.conferenceId,
    encounteredBy: lead.contactOwner?.trim() || undefined,
    fullName: leadFullName(lead),
    company: lead.company ?? "",
    email: lead.email,
    phone: lead.phone,
    linkedInUrl: lead.linkedInUrl,
    jobTitle: lead.jobTitle,
    lifecycleStage: lead.lifecycleStage,
    notes: lead.notes,
    icpEstimate: lead.icpEstimate,
    matchConfidence: match.confidence,
    matchReason: match.reason,
  };
  store.encounters.unshift(encounter);
  const contactIdx = store.contacts.findIndex((x) => x.id === match.contact.id);
  if (contactIdx !== -1) {
    const enriched = enrichContact(store.contacts[contactIdx]!, lead);
    store.contacts[contactIdx] = {
      ...enriched,
      notes: aggregateContactNotes(match.contact.id, store.encounters),
    };
  }
  const encounterCount = store.encounters.filter(
    (e) => e.contactId === match.contact.id,
  ).length;
  saveStore(store);
  return {
    store,
    match: { ...match, encounterCount },
    encounter,
  };
}

