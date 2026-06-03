export type ConferenceVertical =
  | "payments"
  | "fintech"
  | "treasury"
  | "fx"
  | "travel"
  | "saas"
  | "developer"
  | "other";

export type ConferenceRegion =
  | "NA"
  | "EUROPE"
  | "AFRICA"
  | "MIDDLE_EAST"
  | "APAC"
  | "LATAM"
  | "GLOBAL";

export type Conference = {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  city: string;
  country: string;
  region: ConferenceRegion;
  verticals: ConferenceVertical[];
  estAudienceSize: number;
  website?: string;
};

export type ConferenceTier = "S" | "A" | "B" | "C" | "D" | "F";

export type ConferenceScoreBreakdown = {
  total: number; // 0..100
  tier: ConferenceTier;
  reasons: { label: string; points: number }[];
};

