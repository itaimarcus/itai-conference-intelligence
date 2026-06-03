/** Display ISO YYYY-MM-DD as DD-MM-YYYY (no locale surprises). */
export function formatDateDDMMYYYY(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}-${m}-${y}`;
}

/** ISO date or datetime → DD-MM-YYYY */
export function formatIsoDateTimeDDMMYYYY(iso: string): string {
  return formatDateDDMMYYYY(iso.slice(0, 10));
}

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** e.g. 2026-04 → April 2026 (always English). */
export function formatMonthYear(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const name = EN_MONTHS[(m ?? 1) - 1] ?? monthKey;
  return `${name} ${y}`;
}
