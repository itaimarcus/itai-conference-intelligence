import { Lead } from "./clientStore";
import { leadFullName } from "./leadHelpers";
import { CONFERENCES } from "./conferences";
import { formatDateDDMMYYYY, formatIsoDateTimeDDMMYYYY } from "./dates";

function escapeCell(s: string) {
  const needs = /[",\n]/.test(s);
  const val = s.replace(/"/g, '""');
  return needs ? `"${val}"` : val;
}

function confLabel(conferenceId?: string) {
  if (!conferenceId) return "Unassigned";
  const c = CONFERENCES.find((x) => x.id === conferenceId);
  return c ? `${c.name} (${c.city}, ${formatDateDDMMYYYY(c.startDate)})` : conferenceId;
}

export function leadsToHubSpotContactsCsv(leads: Lead[]) {
  const headers = [
    "Email",
    "First Name",
    "Last Name",
    "Phone Number",
    "Company Name",
    "Job Title",
    "LinkedIn URL",
    "Contact Owner",
    "Lifecycle Stage",
    "Lead Source",
    "Conference",
    "Notes",
    "ICP est.",
    "Created At",
  ];

  const rows = leads.map((l) => {
    const first = l.firstName?.trim() || leadFullName(l).split(/\s+/)[0] || "";
    const last =
      l.lastName?.trim() ||
      leadFullName(l).split(/\s+/).slice(1).join(" ") ||
      "";
    return [
      l.email ?? "",
      first,
      last,
      l.phone ?? "",
      l.company ?? "",
      l.jobTitle ?? "",
      l.linkedInUrl ?? "",
      l.contactOwner ?? "",
      l.lifecycleStage ?? "",
      "Conference",
      confLabel(l.conferenceId),
      l.notes ?? "",
      l.icpEstimate !== undefined ? String(l.icpEstimate) : "",
      formatIsoDateTimeDDMMYYYY(l.createdAt),
    ].map(escapeCell);
  });

  return [headers.map(escapeCell).join(","), ...rows.map((r) => r.join(","))].join(
    "\n",
  );
}
