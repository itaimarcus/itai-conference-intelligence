import { isCustomerStage, isUnqualifiedStage } from "@/lib/lifecycle";

export function LifecycleBadge({
  stage,
  size = "sm",
}: {
  stage?: string;
  size?: "sm" | "md";
}) {
  if (!stage) return null;

  const textClass = size === "md" ? "text-sm" : "text-xs";

  if (isCustomerStage(stage)) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200 ${textClass}`}
        title="Customer"
      >
        <span aria-hidden className="text-sm leading-none">
          ✓
        </span>
        Customer
      </span>
    );
  }

  if (isUnqualifiedStage(stage)) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-semibold text-rose-800 ring-1 ring-inset ring-rose-200 ${textClass}`}
        title="Unqualified"
      >
        <span aria-hidden className="text-sm leading-none">
          ✕
        </span>
        Unqualified
      </span>
    );
  }

  return (
    <span
      className={`rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 ${textClass}`}
    >
      {stage}
    </span>
  );
}
