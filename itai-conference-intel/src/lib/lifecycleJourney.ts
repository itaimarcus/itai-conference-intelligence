import type { Encounter } from "./clientStore";
import {
  LIFECYCLE_STAGES,
  lifecycleSelectLabel,
  type LifecycleStage,
} from "./lifecycle";

/** Same default as Capture when no stage was stored on the encounter. */
export const DEFAULT_ENCOUNTER_LIFECYCLE: LifecycleStage = "Lead";

/** Normalized stage for journey/timeline (missing → Lead). */
export function encounterStageForJourney(lifecycleStage?: string): string {
  const stage = lifecycleStage?.trim();
  return stage || DEFAULT_ENCOUNTER_LIFECYCLE;
}

/** Stages in encounter date order — one entry per encounter, including repeats. */
export function buildLifecycleJourney(
  encounters: Pick<Encounter, "createdAt" | "lifecycleStage">[],
): string[] {
  const sorted = [...encounters].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  return sorted.map((e) => encounterStageForJourney(e.lifecycleStage));
}

export function journeyStageLabel(stage: string): string {
  const normalized = stage.trim() || DEFAULT_ENCOUNTER_LIFECYCLE;
  if ((LIFECYCLE_STAGES as readonly string[]).includes(normalized)) {
    return lifecycleSelectLabel(normalized as LifecycleStage);
  }
  return normalized;
}

export function formatLifecycleJourney(stages: string[]): string {
  return stages.map(journeyStageLabel).join(" → ");
}
