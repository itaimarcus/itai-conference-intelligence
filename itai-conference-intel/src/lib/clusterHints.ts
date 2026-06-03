import { CONFERENCES } from "./conferences";
import { regionLabel } from "./regions";
import { scoreConference } from "./scoring";
import { Conference, ConferenceRegion } from "./types";

export type TripCluster = {
  id: string;
  kind: "country" | "region";
  label: string;
  region: ConferenceRegion;
  conferences: Conference[];
  maxGapDays: number;
  avgScore: number;
};

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function daysFromTo(from: string, to: string): number {
  const ms = parseDate(to).getTime() - parseDate(from).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function orderByStart(a: Conference, b: Conference): [Conference, Conference] {
  return a.startDate <= b.startDate ? [a, b] : [b, a];
}

export function dateRangesOverlap(a: Conference, b: Conference): boolean {
  const [earlier, later] = orderByStart(a, b);
  return earlier.endDate >= later.startDate;
}

/** Same dates in the same city still count — one rep can't attend two events at once. */
export function eventsConflictInTime(a: Conference, b: Conference): boolean {
  return dateRangesOverlap(a, b);
}

export function travelGapDays(a: Conference, b: Conference): number {
  const [earlier, later] = orderByStart(a, b);
  return daysFromTo(earlier.endDate, later.startDate);
}

const COUNTRY_LINK_EXCLUDED = new Set(["USA"]);

function canUseCountryLink(a: Conference, b: Conference): boolean {
  if (a.country !== b.country) return false;
  if (COUNTRY_LINK_EXCLUDED.has(a.country)) return false;
  return true;
}

export function canLinkTripEvents(earlier: Conference, later: Conference): boolean {
  if (earlier.startDate > later.startDate) {
    return canLinkTripEvents(later, earlier);
  }
  if (dateRangesOverlap(earlier, later)) return false;
  const gap = daysFromTo(earlier.endDate, later.startDate);
  if (gap < 0) return false;
  if (canUseCountryLink(earlier, later) && gap <= 7) return true;
  if (earlier.region === later.region && gap <= 14) return true;
  return false;
}

export function isValidTripChain(chain: Conference[]): boolean {
  if (chain.length < 2) return false;
  const sorted = [...chain].sort((a, b) => a.startDate.localeCompare(b.startDate));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (!canLinkTripEvents(sorted[i]!, sorted[i + 1]!)) return false;
  }
  return true;
}

function maxConsecutiveGapInChain(chain: Conference[]): number {
  const sorted = [...chain].sort((a, b) => a.startDate.localeCompare(b.startDate));
  let max = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    max = Math.max(max, travelGapDays(sorted[i]!, sorted[i + 1]!));
  }
  return max;
}

function clusterLinkKind(chain: Conference[]): TripCluster["kind"] {
  const first = chain[0]!;
  const sameCountry = chain.every((c) => c.country === first.country);
  if (sameCountry && !COUNTRY_LINK_EXCLUDED.has(first.country)) return "country";
  return "region";
}

function toTripCluster(chain: Conference[]): TripCluster {
  const sorted = [...chain].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const first = sorted[0]!;
  const kind = clusterLinkKind(sorted);
  const label = kind === "country" ? first.country : regionLabel(first.region);
  const scores = sorted.map((c) => scoreConference(c).total);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  return {
    id: sorted.map((c) => c.id).join("__"),
    kind,
    label,
    region: first.region,
    conferences: sorted,
    maxGapDays: maxConsecutiveGapInChain(sorted),
    avgScore,
  };
}

function buildTripChains(conferences: Conference[]): Conference[][] {
  if (conferences.length < 2) return [];

  const sorted = [...conferences].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  const chains: Conference[][] = sorted.map((c) => [c]);

  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < chains.length; i++) {
      for (let j = i + 1; j < chains.length; j++) {
        const a = chains[i]!;
        const b = chains[j]!;
        const tryMerge = (left: Conference[], right: Conference[]) => {
          const combined = [...left, ...right].sort((a, b) =>
            a.startDate.localeCompare(b.startDate),
          );
          return isValidTripChain(combined) ? combined : null;
        };

        const ab = tryMerge(a, b);
        if (ab) {
          chains[i] = ab;
          chains.splice(j, 1);
          merged = true;
          break outer;
        }
        const ba = tryMerge(b, a);
        if (ba) {
          chains[i] = ba;
          chains.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }

  return chains.filter((c) => c.length >= 2 && isValidTripChain(c));
}

export function findTripClusters(conferences: Conference[]): TripCluster[] {
  return buildTripChains(conferences)
    .map(toTripCluster)
    .sort((a, b) => {
      if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
      if (b.conferences.length !== a.conferences.length) {
        return b.conferences.length - a.conferences.length;
      }
      return a.maxGapDays - b.maxGapDays;
    });
}

export function findCatalogTripOpportunities(options?: {
  limit?: number;
  minAvgScore?: number;
}): TripCluster[] {
  const limit = options?.limit ?? 12;
  const minAvg = options?.minAvgScore ?? 55;
  return findTripClusters(CONFERENCES)
    .filter((c) => c.avgScore >= minAvg)
    .slice(0, limit);
}

export function stackCountByConferenceId(
  clusters: TripCluster[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const cluster of clusters) {
    for (const c of cluster.conferences) {
      map.set(c.id, (map.get(c.id) ?? 0) + 1);
    }
  }
  return map;
}

export function conferenceClusterIdMap(
  clusters: TripCluster[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const cluster of clusters) {
    for (const c of cluster.conferences) {
      map.set(c.id, cluster.id);
    }
  }
  return map;
}

export type PlannedListSegment<T extends { c: Conference }> =
  | {
      kind: "single";
      item: T;
      clusterLink?: { before: boolean; after: boolean };
    }
  | { kind: "cluster"; clusterId: string; items: T[]; continuesAfter: boolean };

export function segmentPlannedByCluster<T extends { c: Conference }>(
  items: T[],
  clusterByConfId: Map<string, string>,
  clusterOrderIndex: Map<string, number>,
  clusterSizes: Map<string, number>,
): PlannedListSegment<T>[] {
  const sorted = [...items].sort((a, b) =>
    a.c.startDate.localeCompare(b.c.startDate),
  );
  const segments: PlannedListSegment<T>[] = [];
  let i = 0;

  while (i < sorted.length) {
    const clusterId = clusterByConfId.get(sorted[i]!.c.id);
    if (!clusterId) {
      segments.push({ kind: "single", item: sorted[i]! });
      i += 1;
      continue;
    }

    const group: T[] = [sorted[i]!];
    let j = i + 1;
    while (
      j < sorted.length &&
      clusterByConfId.get(sorted[j]!.c.id) === clusterId
    ) {
      group.push(sorted[j]!);
      j += 1;
    }

    if (group.length >= 2) {
      const lastInGroup = group[group.length - 1]!;
      const lastIdx = clusterOrderIndex.get(lastInGroup.c.id) ?? 0;
      const size = clusterSizes.get(clusterId) ?? group.length;
      segments.push({
        kind: "cluster",
        clusterId,
        items: group,
        continuesAfter: lastIdx < size - 1,
      });
    } else {
      const solo = group[0]!;
      const idx = clusterOrderIndex.get(solo.c.id) ?? 0;
      const size = clusterSizes.get(clusterId) ?? 1;
      segments.push({
        kind: "single",
        item: solo,
        clusterLink:
          size > 1 ? { before: idx > 0, after: idx < size - 1 } : undefined,
      });
    }
    i = j;
  }

  return segments;
}

export function clusterOrderIndexMap(
  clusters: TripCluster[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const cluster of clusters) {
    cluster.conferences.forEach((c, idx) => map.set(c.id, idx));
  }
  return map;
}

export function clusterSizeMap(clusters: TripCluster[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const cluster of clusters) {
    map.set(cluster.id, cluster.conferences.length);
  }
  return map;
}

export function stacksOverlap(a: Conference[], b: Conference[]): boolean {
  for (const ca of a) {
    for (const cb of b) {
      if (eventsConflictInTime(ca, cb)) return true;
    }
  }
  return false;
}

function conferencesInSegment(seg: PlannedTripSegment): Conference[] {
  return seg.kind === "stack" ? seg.conferences : seg.stacks.flat();
}

function segmentsConflictInTime(a: PlannedTripSegment, b: PlannedTripSegment): boolean {
  const left = conferencesInSegment(a);
  const right = conferencesInSegment(b);
  return stacksOverlap(left, right);
}

function mergeSegmentIntoOr(
  existing: PlannedTripSegment,
  other: PlannedTripSegment,
): PlannedTripSegment {
  const toStacks = (seg: PlannedTripSegment): Conference[][] =>
    seg.kind === "or" ? seg.stacks : [seg.conferences];

  return {
    kind: "or",
    stacks: [...toStacks(existing), ...toStacks(other)],
  };
}

function coalesceOverlappingSegments(
  segments: PlannedTripSegment[],
): PlannedTripSegment[] {
  if (segments.length < 2) return segments;

  const merged: PlannedTripSegment[] = [];
  for (const seg of segments) {
    const prev = merged[merged.length - 1];
    if (prev && segmentsConflictInTime(prev, seg)) {
      merged[merged.length - 1] = mergeSegmentIntoOr(prev, seg);
    } else {
      merged.push(seg);
    }
  }
  return merged;
}

export function buildPlannedStacks(
  conferences: Conference[],
  clusters: TripCluster[],
): Conference[][] {
  const confIds = new Set(conferences.map((c) => c.id));
  const clusteredIds = new Set<string>();
  const stacks: Conference[][] = [];

  for (const cluster of clusters) {
    const inSet = cluster.conferences.filter((c) => confIds.has(c.id));
    if (inSet.length >= 2) {
      stacks.push(inSet);
      for (const c of inSet) clusteredIds.add(c.id);
    }
  }

  for (const c of conferences) {
    if (!clusteredIds.has(c.id)) {
      stacks.push([c]);
    }
  }

  return stacks;
}

export type PlannedTripSegment =
  | { kind: "stack"; conferences: Conference[] }
  | { kind: "or"; stacks: Conference[][] };

function earliestStartDate(conferences: Conference[]): string {
  return [...conferences]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0]!
    .startDate;
}

function segmentEarliestStart(seg: PlannedTripSegment): string {
  if (seg.kind === "stack") return earliestStartDate(seg.conferences);
  return earliestStartDate(seg.stacks.flat());
}

function unionFindComponents<T>(
  items: T[],
  overlaps: (a: T, b: T) => boolean,
): T[][] {
  const n = items.length;
  const parent = items.map((_, i) => i);

  function find(i: number): number {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]!]!;
      i = parent[i]!;
    }
    return i;
  }

  function union(a: number, b: number) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (overlaps(items[i]!, items[j]!)) union(i, j);
    }
  }

  const groups = new Map<number, T[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const group = groups.get(root) ?? [];
    group.push(items[i]!);
    groups.set(root, group);
  }

  return [...groups.values()];
}

export function segmentPlannedTrips(
  conferences: Conference[],
  clusters: TripCluster[],
): PlannedTripSegment[] {
  const stacks = buildPlannedStacks(conferences, clusters);
  if (stacks.length === 0) return [];
  if (stacks.length === 1) {
    return [{ kind: "stack", conferences: stacks[0]! }];
  }

  const groups = unionFindComponents(stacks, stacksOverlap);
  const segments: PlannedTripSegment[] = groups.map((groupStacks) =>
    groupStacks.length === 1
      ? { kind: "stack", conferences: groupStacks[0]! }
      : { kind: "or", stacks: groupStacks },
  );

  segments.sort((a, b) =>
    segmentEarliestStart(a).localeCompare(segmentEarliestStart(b)),
  );

  return coalesceOverlappingSegments(segments);
}

export function groupCatalogClusters(clusters: TripCluster[]): TripCluster[][] {
  if (clusters.length === 0) return [];
  if (clusters.length === 1) return [clusters];

  const groups = unionFindComponents(clusters, (a, b) =>
    stacksOverlap(a.conferences, b.conferences),
  );

  return groups.sort((a, b) => {
    const earliestA = earliestStartDate(a.flatMap((c) => c.conferences));
    const earliestB = earliestStartDate(b.flatMap((c) => c.conferences));
    return earliestA.localeCompare(earliestB);
  });
}
