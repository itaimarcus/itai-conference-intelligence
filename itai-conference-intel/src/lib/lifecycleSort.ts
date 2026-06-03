/** Higher rank = closer to closing (sort first). */
const LIFECYCLE_CLOSE_RANK: Record<string, number> = {
  Opportunity: 6,
  "Sales Qualified Lead": 5,
  "Marketing Qualified Lead": 4,
  Lead: 3,
  Customer: 2,
  Unqualified: 1,
};

export function lifecycleCloseRank(stage?: string): number {
  if (!stage) return 0;
  return LIFECYCLE_CLOSE_RANK[stage] ?? 0;
}

export function compareContactsByLifecycleThenIcp(
  a: { lifecycle?: string; icp?: number; listIndex: number },
  b: { lifecycle?: string; icp?: number; listIndex: number },
): number {
  const lifeDiff = lifecycleCloseRank(b.lifecycle) - lifecycleCloseRank(a.lifecycle);
  if (lifeDiff !== 0) return lifeDiff;

  const icpA = a.icp ?? -1;
  const icpB = b.icp ?? -1;
  if (icpB !== icpA) return icpB - icpA;

  return a.listIndex - b.listIndex;
}
