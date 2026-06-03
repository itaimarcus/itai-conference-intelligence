import type { Contact, Encounter } from "./clientStore";
import { conferenceDisplayName } from "./conferenceLabel";
import {
  resolveContactIcp,
  resolveContactLifecycle,
} from "./contactDisplay";
import {
  encounterStageForJourney,
  formatLifecycleJourney,
} from "./lifecycleJourney";
import { isCustomerStage } from "./lifecycle";
import { lifecycleCloseRank } from "./lifecycleSort";

export type ContactNudge = {
  priority: number;
  label: string;
  action: string;
  tone: "info" | "success" | "warning";
};

function sortedEncounters(encounters: Encounter[]): Encounter[] {
  return [...encounters].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function distinctConferenceIds(
  encounters: Pick<Encounter, "conferenceId">[],
): string[] {
  const ids = new Set<string>();
  for (const e of encounters) {
    const id = e.conferenceId?.trim();
    if (id) ids.add(id);
  }
  return [...ids];
}

export function formatConferenceTrail(
  conferenceIds: string[],
  maxNames = 3,
): string {
  const names = conferenceIds
    .map((id) => conferenceDisplayName(id))
    .filter((n): n is string => Boolean(n));
  if (names.length === 0) return "";
  if (names.length <= maxNames) return names.join(" · ");
  return `${names.slice(0, maxNames).join(" · ")} +${names.length - maxNames} more`;
}

function daysSince(iso: string): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

/** Rule-based prompts to act on relationships that span multiple conferences. */
export function buildContactNudges(
  contact: Contact,
  encounters: Encounter[],
): ContactNudge[] {
  if (encounters.length === 0) return [];

  const nudges: ContactNudge[] = [];
  const sorted = sortedEncounters(encounters);
  const conferenceIds = distinctConferenceIds(encounters);
  const confCount = conferenceIds.length;
  const trail = formatConferenceTrail(conferenceIds);
  const lifecycle = resolveContactLifecycle(contact, encounters);
  const icp = resolveContactIcp(contact, encounters);

  if (confCount >= 2) {
    nudges.push({
      priority: 55,
      label: `Met at ${confCount} conferences`,
      action: trail
        ? `${trail}. Review the timeline and plan follow-up before the next show.`
        : "Review the encounter timeline and plan follow-up before the next show.",
      tone: "info",
    });
  }

  if (sorted.length >= 2) {
    const first = encounterStageForJourney(sorted[0]!.lifecycleStage);
    const last = encounterStageForJourney(
      sorted[sorted.length - 1]!.lifecycleStage,
    );
    const journey = formatLifecycleJourney(
      sorted.map((e) => encounterStageForJourney(e.lifecycleStage)),
    );
    if (lifecycleCloseRank(last) > lifecycleCloseRank(first)) {
      nudges.push({
        priority: 85,
        label: "Lifecycle progressed",
        action: `${journey}. Schedule a substantive follow-up while momentum is high.`,
        tone: "success",
      });
    }
  }

  if (
    confCount >= 2 &&
    icp !== undefined &&
    icp >= 60 &&
    (lifecycle === "Sales Qualified Lead" || lifecycle === "Opportunity")
  ) {
    nudges.push({
      priority: 92,
      label: "High-value repeat contact",
      action:
        "You have met them at multiple events and they are late-stage. Prioritize a closing conversation and log the next step in HubSpot.",
      tone: "warning",
    });
  }

  if (isCustomerStage(lifecycle) && confCount >= 2) {
    nudges.push({
      priority: 75,
      label: "Customer across events",
      action:
        "They appear at multiple conferences — explore expansion, referrals, or co-marketing.",
      tone: "success",
    });
  }

  const last = sorted[sorted.length - 1]!;
  const staleDays = daysSince(last.createdAt);
  const warmRank = lifecycleCloseRank(lifecycle);
  if (
    staleDays >= 45 &&
    warmRank >= lifecycleCloseRank("Marketing Qualified Lead") &&
    !isCustomerStage(lifecycle)
  ) {
    nudges.push({
      priority: 65,
      label: `No touch in ${staleDays} days`,
      action:
        "Re-engage before the next conference on your plan — reference where you last met them.",
      tone: "warning",
    });
  }

  return nudges.sort((a, b) => b.priority - a.priority);
}

export function primaryContactNudge(
  nudges: ContactNudge[],
): ContactNudge | undefined {
  return nudges[0];
}
