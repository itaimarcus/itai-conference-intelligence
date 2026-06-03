import { Conference, ConferenceScoreBreakdown, ConferenceTier } from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function tierFromScore(score: number): ConferenceTier {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function scoreConference(c: Conference): ConferenceScoreBreakdown {
  const reasons: { label: string; points: number }[] = [];

  const v = new Set(c.verticals);
  let verticalPoints = 0;
  if (v.has("payments")) verticalPoints += 18;
  if (v.has("treasury")) verticalPoints += 18;
  if (v.has("fx")) verticalPoints += 14;
  if (v.has("fintech")) verticalPoints += 10;
  if (v.has("travel")) verticalPoints += 6;
  if (v.has("saas")) verticalPoints += 2;
  if (v.has("developer")) verticalPoints -= 8;
  reasons.push({ label: "ICP vertical fit", points: verticalPoints });

  let regionPoints = 0;
  if (c.region === "EUROPE") regionPoints += 5;
  else if (c.region === "NA") regionPoints += 5;
  else if (c.region === "APAC") regionPoints += 5;
  else if (c.region === "MIDDLE_EAST") regionPoints += 2;
  reasons.push({ label: "Region priority", points: regionPoints });

  const size = c.estAudienceSize;
  let sizePoints = 0;
  if (size >= 15000) sizePoints += 10;
  else if (size >= 8000) sizePoints += 12;
  else if (size >= 3000) sizePoints += 10;
  else if (size >= 1000) sizePoints += 7;
  else sizePoints += 4;
  reasons.push({ label: "Audience signal", points: sizePoints });

  const hasCore =
    v.has("payments") || v.has("treasury") || v.has("fx") || v.has("fintech");
  let broadPenalty = 0;
  if (!hasCore) broadPenalty -= 18;
  reasons.push({ label: "Broad/non-ICP penalty", points: broadPenalty });

  const totalRaw = reasons.reduce((sum, r) => sum + r.points, 0);
  const total = clamp(totalRaw + 40, 0, 100);
  const tier = tierFromScore(total);

  return { total, tier, reasons };
}

