"use client";

import { useEffect, useState } from "react";

export function SecondRepControl({
  primaryAssignee,
  secondAssignee,
  teamMembers,
  onChange,
  compact,
}: {
  primaryAssignee?: string;
  secondAssignee?: string;
  teamMembers: string[];
  onChange: (name: string | undefined) => void;
  compact?: boolean;
}) {
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (!secondAssignee) setPicking(false);
  }, [secondAssignee]);

  const showSelect = picking || Boolean(secondAssignee);
  const candidates = teamMembers.filter((name) => name !== primaryAssignee);

  const clearSecond = () => {
    onChange(undefined);
    setPicking(false);
  };

  if (!showSelect) {
    return (
      <button
        type="button"
        className={[
          compact
            ? "w-full max-w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            : "w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50",
        ].join(" ")}
        onClick={() => setPicking(true)}
      >
        Add
      </button>
    );
  }

  const btnClass = compact
    ? "shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
    : "shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50";

  const selectClass = compact
    ? "min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
    : "min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800";

  return (
    <div className="flex w-full max-w-full items-center gap-1">
      <select
        value={secondAssignee ?? ""}
        onChange={(e) => {
          const next = e.target.value || undefined;
          if (!next) {
            clearSecond();
            return;
          }
          onChange(next);
        }}
        className={selectClass}
        aria-label="Second team member"
      >
        <option value="">—</option>
        {candidates.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <button type="button" className={btnClass} onClick={clearSecond}>
        Remove
      </button>
    </div>
  );
}
