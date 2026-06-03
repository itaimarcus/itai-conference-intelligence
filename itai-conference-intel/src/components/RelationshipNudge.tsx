import type { ContactNudge } from "@/lib/contactNudges";

const toneClass: Record<ContactNudge["tone"], string> = {
  info: "border-sky-200 bg-sky-50 text-sky-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
};

export function RelationshipNudge({ nudge }: { nudge: ContactNudge }) {
  return (
    <div
      className={[
        "rounded-lg border px-2.5 py-1.5 text-xs leading-snug",
        toneClass[nudge.tone],
      ].join(" ")}
    >
      <div className="font-semibold">{nudge.label}</div>
      <div className="mt-0.5 opacity-90">{nudge.action}</div>
    </div>
  );
}
