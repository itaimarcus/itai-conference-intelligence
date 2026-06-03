import type { Contact, Encounter, Lead } from "./clientStore";

function latestEncounter(
  contactId: string,
  encounters: Encounter[],
): Encounter | undefined {
  return encounters
    .filter((e) => e.contactId === contactId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

function latestLeadForEmail(email: string | undefined, leads: Lead[]): Lead | undefined {
  if (!email) return undefined;
  const norm = email.toLowerCase();
  return leads
    .filter((l) => l.email?.toLowerCase() === norm)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export type ContactFieldHints = {
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  linkedInUrl?: string;
  jobTitle?: string;
  contactOwner?: string;
  lifecycleStage?: string;
  notes?: string;
};

export function contactFieldHints(
  contact: Contact,
  encounters: Encounter[],
  leads: Lead[],
): ContactFieldHints {
  const enc = latestEncounter(contact.id, encounters);
  const lead = latestLeadForEmail(contact.email, leads);

  return {
    firstName: lead?.firstName,
    lastName: lead?.lastName,
    company: enc?.company || lead?.company,
    phone: enc?.phone || lead?.phone,
    linkedInUrl: enc?.linkedInUrl || lead?.linkedInUrl,
    jobTitle: enc?.jobTitle || lead?.jobTitle,
    contactOwner: enc?.encounteredBy || lead?.contactOwner,
    lifecycleStage: enc?.lifecycleStage || lead?.lifecycleStage,
    notes: enc?.notes || lead?.notes,
  };
}
