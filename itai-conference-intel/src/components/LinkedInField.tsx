"use client";

import { useEffect, useState } from "react";
import {
  compactLinkedInLabel,
  externalHref,
  normalizeLinkedInInput,
} from "@/lib/leadHelpers";

export function LinkedInField({
  value,
  placeholder,
  onChange,
}: {
  value?: string;
  placeholder?: string;
  onChange: (url: string | undefined) => void;
}) {
  const [editing, setEditing] = useState(!value);
  const label = compactLinkedInLabel(value);

  useEffect(() => {
    if (value) setEditing(false);
  }, [value]);

  if (!editing && value && label) {
    return (
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          LinkedIn
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <a
            href={externalHref(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-emerald-700 underline underline-offset-2"
          >
            {label}
          </a>
          <button
            type="button"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        LinkedIn
      </div>
      <input
        className="mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        value={value ?? ""}
        placeholder={placeholder ?? "linkedin.com/in/username"}
        onChange={(e) => onChange(e.target.value || undefined)}
        onBlur={(e) => {
          const next = normalizeLinkedInInput(e.target.value);
          onChange(next);
          if (next) setEditing(false);
        }}
      />
      {value && label ? (
        <button
          type="button"
          className="mt-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
          onClick={() => setEditing(false)}
        >
          Show as link
        </button>
      ) : null}
    </div>
  );
}
