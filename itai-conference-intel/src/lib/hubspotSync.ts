import { Lead } from "./clientStore";
import { leadFullName } from "./leadHelpers";

const HUBSPOT_API = "https://api.hubapi.com";

function mapLifecycle(stage?: string): string | undefined {
  if (!stage) return undefined;
  const map: Record<string, string> = {
    Lead: "lead",
    "Marketing Qualified Lead": "marketingqualifiedlead",
    "Sales Qualified Lead": "salesqualifiedlead",
    Opportunity: "opportunity",
    Customer: "customer",
    Unqualified: "other",
  };
  return map[stage];
}

export function leadToHubSpotProperties(lead: Lead): Record<string, string> {
  const first =
    lead.firstName?.trim() || leadFullName(lead).split(/\s+/)[0] || "";
  const last =
    lead.lastName?.trim() ||
    leadFullName(lead).split(/\s+/).slice(1).join(" ") ||
    "";

  const props: Record<string, string> = {
    email: lead.email!.trim().toLowerCase(),
  };

  if (first) props.firstname = first;
  if (last) props.lastname = last;
  if (lead.phone?.trim()) props.phone = lead.phone.trim();
  if (lead.company?.trim()) props.company = lead.company.trim();
  if (lead.jobTitle?.trim()) props.jobtitle = lead.jobTitle.trim();
  if (lead.linkedInUrl?.trim()) props.linkedinbio = lead.linkedInUrl.trim();

  const lifecycle = mapLifecycle(lead.lifecycleStage);
  if (lifecycle) props.lifecyclestage = lifecycle;

  return props;
}

export type HubSpotSyncResult = {
  synced: number;
  skipped: number;
  skippedReasons: string[];
  errors: string[];
};

export async function syncLeadsToHubSpot(
  token: string,
  leads: Lead[],
): Promise<HubSpotSyncResult> {
  const withEmail = leads.filter((l) => l.email?.trim());
  const skipped = leads.length - withEmail.length;
  const skippedReasons =
    skipped > 0 ? [`${skipped} lead(s) skipped — email required for HubSpot upsert`] : [];

  if (withEmail.length === 0) {
    return { synced: 0, skipped, skippedReasons, errors: [] };
  }

  const errors: string[] = [];
  let synced = 0;
  const chunkSize = 100;

  for (let i = 0; i < withEmail.length; i += chunkSize) {
    const chunk = withEmail.slice(i, i + chunkSize);
    const body = {
      inputs: chunk.map((lead) => ({
        properties: leadToHubSpotProperties(lead),
        idProperty: "email",
      })),
    };

    const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/batch/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      errors.push(`HubSpot API ${res.status}: ${text.slice(0, 400)}`);
      continue;
    }

    const data = (await res.json()) as { results?: unknown[] };
    synced += data.results?.length ?? chunk.length;
  }

  return { synced, skipped, skippedReasons, errors };
}
