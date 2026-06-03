import { ConferenceRegion } from "./types";

export const REGION_LABELS: Record<ConferenceRegion, string> = {
  NA: "North America",
  EUROPE: "Europe",
  AFRICA: "Africa",
  MIDDLE_EAST: "Middle East",
  APAC: "Asia-Pacific",
  LATAM: "Latin America",
  GLOBAL: "Global / multi-region",
};

export function regionLabel(region: ConferenceRegion): string {
  return REGION_LABELS[region] ?? region;
}
