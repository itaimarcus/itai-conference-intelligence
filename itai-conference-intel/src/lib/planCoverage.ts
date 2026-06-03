import { ConferenceTier } from "./types";

export const HIGH_TIERS = new Set<ConferenceTier>(["S", "A"]);
export const STRONG_TIERS = new Set<ConferenceTier>(["S", "A", "B"]);

const TIER_RANK: Record<ConferenceTier, number> = {
  S: 6,
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  F: 1,
};

export function planAssignees(item?: {
  assignedTo?: string;
  assignedTo2?: string;
}): string[] {
  if (!item) return [];
  return [item.assignedTo, item.assignedTo2].filter(Boolean) as string[];
}

export const CLUSTER_NO_COMMON_REP_MSG =
  "No rep in common across events in this cluster";

/** True when 2+ planned events each have assignees but share no rep. */
export function clusterHasNoCommonAssignee(
  conferenceIds: string[],
  plan: Record<string, { assignedTo?: string; assignedTo2?: string }>,
): boolean {
  const sets = conferenceIds
    .map((id) => plan[id])
    .filter(Boolean)
    .map((item) => new Set(planAssignees(item)))
    .filter((s) => s.size > 0);
  if (sets.length < 2) return false;
  const [first, ...rest] = sets;
  const common = [...first].filter((name) => rest.every((s) => s.has(name)));
  return common.length === 0;
}

export function isOnPlanForMember(
  item: { assignedTo?: string; assignedTo2?: string } | undefined,
  name: string,
): boolean {
  return planAssignees(item).includes(name);
}

export function strongestTierInQuarter(
  tiers: ConferenceTier[],
): ConferenceTier | null {
  if (tiers.length === 0) return null;
  return tiers.reduce((best, tier) =>
    TIER_RANK[tier] > TIER_RANK[best] ? tier : best,
  );
}

export function isQuarterUnderInvested(tiers: ConferenceTier[]): boolean {
  if (tiers.length === 0) return true;
  return !tiers.some((tier) => STRONG_TIERS.has(tier));
}

export type TeamQuarterCoverageStatus = "empty" | "semi-invested" | "covered";

export function teamQuarterCoverageStatus(
  conferenceCount: number,
): TeamQuarterCoverageStatus {
  if (conferenceCount === 0) return "empty";
  if (conferenceCount === 1) return "semi-invested";
  return "covered";
}

export function teamQuarterCoverageLabel(
  status: TeamQuarterCoverageStatus,
): string {
  switch (status) {
    case "empty":
      return "under-invested · empty";
    case "semi-invested":
      return "semi-invested · 1 event";
    case "covered":
      return "covered · 2+ events";
  }
}

export function individualQuarterCovered(
  assignedEventsInQuarter: number,
): boolean {
  return assignedEventsInQuarter >= 1;
}
