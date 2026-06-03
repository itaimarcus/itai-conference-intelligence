import { ConferenceVertical } from "./types";

export const VERTICAL_LABELS: Record<ConferenceVertical, string> = {
  payments: "Payments",
  treasury: "Treasury",
  fx: "Foreign exchange (FX)",
  fintech: "Fintech",
  travel: "Travel",
  saas: "SaaS",
  developer: "Developer",
  other: "Other",
};

const VERTICAL_COMPACT: Partial<Record<ConferenceVertical, string>> = {
  fx: "FX",
};

export function verticalLabel(
  vertical: ConferenceVertical,
  opts?: { compact?: boolean },
): string {
  if (opts?.compact && VERTICAL_COMPACT[vertical]) return VERTICAL_COMPACT[vertical]!;
  return VERTICAL_LABELS[vertical] ?? vertical;
}
