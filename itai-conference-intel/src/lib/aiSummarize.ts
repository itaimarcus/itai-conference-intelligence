import { CONFERENCES } from "./conferences";
import type { Contact, Encounter } from "./clientStore";

export const RELATIONSHIP_SUMMARY_MAX_CHARS = 600;

export function truncateRelationshipSummary(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= RELATIONSHIP_SUMMARY_MAX_CHARS) return trimmed;
  return `${trimmed.slice(0, RELATIONSHIP_SUMMARY_MAX_CHARS - 1).trimEnd()}…`;
}

export type SummarizeContactPayload = {
  contact: {
    canonicalName: string;
    canonicalCompany?: string;
    email?: string;
    linkedInUrl?: string;
  };
  encounters: {
    conferenceName?: string;
    createdAt: string;
    encounteredBy?: string;
    notes?: string;
    company: string;
    icpEstimate?: number;
  }[];
};

function conferenceName(conferenceId?: string): string | undefined {
  if (!conferenceId) return undefined;
  return CONFERENCES.find((c) => c.id === conferenceId)?.name ?? conferenceId;
}

export function buildSummarizeContactPayload(
  contact: Contact,
  encounters: Encounter[],
): SummarizeContactPayload {
  return {
    contact: {
      canonicalName: contact.canonicalName,
      canonicalCompany: contact.canonicalCompany,
      email: contact.email,
      linkedInUrl: contact.linkedInUrl,
    },
    encounters: encounters
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((e) => ({
        conferenceName: conferenceName(e.conferenceId),
        createdAt: e.createdAt,
        encounteredBy: e.encounteredBy,
        notes: e.notes,
        company: e.company,
        icpEstimate: e.icpEstimate,
      })),
  };
}

export async function summarizeContactRelationship(
  apiKey: string,
  contact: Contact,
  encounters: Encounter[],
): Promise<{ summary?: string; error?: string }> {
  const res = await fetch("/api/ai/summarize-contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gemini-Api-Key": apiKey,
    },
    body: JSON.stringify(buildSummarizeContactPayload(contact, encounters)),
  });

  const data = (await res.json()) as { summary?: string; error?: string };
  if (!res.ok) {
    return { error: data.error ?? "Failed to generate summary." };
  }
  if (!data.summary?.trim()) {
    return { error: "Empty response from Gemini." };
  }
  return { summary: truncateRelationshipSummary(data.summary) };
}
