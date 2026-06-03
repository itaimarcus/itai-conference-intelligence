"use client";

export function IntegrationSecretField({
  label,
  configured,
  value,
  onChange,
  onSave,
  onClear,
  saved,
}: {
  label: string;
  configured: boolean;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onClear: () => void;
  saved: boolean;
}) {
  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-500">{label}</label>
        {configured ? (
          <span className="text-xs font-medium text-emerald-700">Configured</span>
        ) : null}
      </div>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        placeholder=""
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
          disabled={!value.trim()}
          onClick={onSave}
        >
          Save
        </button>
        {configured ? (
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            onClick={onClear}
          >
            Clear
          </button>
        ) : null}
      </div>
      {saved ? (
        <div className="mt-2 text-xs font-medium text-emerald-700">Saved.</div>
      ) : null}
    </div>
  );
}
