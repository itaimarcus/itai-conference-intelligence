/** Rep's subjective ICP fit estimate at capture time (0–100). */

export function clampIcpEstimate(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function formatIcpEstimate(value?: number): string | undefined {
  if (value === undefined || Number.isNaN(value)) return undefined;
  return `ICP est. ${clampIcpEstimate(value)}`;
}
