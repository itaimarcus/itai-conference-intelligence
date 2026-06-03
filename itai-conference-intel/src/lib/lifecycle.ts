export const LIFECYCLE_STAGES = [
  "Lead",
  "Marketing Qualified Lead",
  "Sales Qualified Lead",
  "Opportunity",
  "Customer",
  "Unqualified",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export function isCustomerStage(stage?: string): boolean {
  return stage === "Customer";
}

export function isUnqualifiedStage(stage?: string): boolean {
  return stage === "Unqualified";
}

/** Short labels for dropdowns so text does not overlap the arrow. */
export function lifecycleSelectLabel(stage: LifecycleStage): string {
  switch (stage) {
    case "Marketing Qualified Lead":
      return "MQL";
    case "Sales Qualified Lead":
      return "SQL";
    case "Customer":
      return "Customer ✓";
    case "Unqualified":
      return "Unqualified ✕";
    default:
      return stage;
  }
}
