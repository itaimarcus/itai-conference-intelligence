"use client";

import { useEffect, useRef, useState } from "react";
import { clampIcpEstimate } from "@/lib/icpEstimate";

const valueBtnClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm font-semibold text-emerald-800 ring-1 ring-transparent hover:bg-emerald-50 active:bg-emerald-100 hover:ring-emerald-200 touch-manipulation";
const suffixBtnClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg px-2 text-sm font-semibold text-emerald-800 ring-1 ring-transparent hover:bg-emerald-50 active:bg-emerald-100 hover:ring-emerald-200 touch-manipulation";

export function IcpEstimateControl({
  value,
  onChange,
}: {
  value?: number;
  onChange: (value: number | undefined) => void;
}) {
  const [sliderEngaged, setSliderEngaged] = useState(false);
  const [editingNumber, setEditingNumber] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const hasValue = value !== undefined;

  useEffect(() => {
    if (value === undefined) {
      setSliderEngaged(false);
      setEditingNumber(false);
    }
  }, [value]);

  useEffect(() => {
    if (editingNumber) inputRef.current?.focus();
  }, [editingNumber]);

  const engageSlider = () => {
    setSliderEngaged(true);
    if (!hasValue) onChange(0);
  };

  const startValueEdit = () => {
    setDraft(hasValue ? String(value) : "");
    setEditingNumber(true);
  };

  const commitDraft = () => {
    setEditingNumber(false);
    const trimmed = draft.trim();
    if (trimmed === "") {
      onChange(undefined);
      setSliderEngaged(false);
      return;
    }
    const n = Number(trimmed);
    if (Number.isNaN(n)) return;
    onChange(clampIcpEstimate(n));
    setSliderEngaged(true);
  };

  const sliderActive = sliderEngaged && hasValue;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-500">ICP est.</label>
        {editingNumber ? (
          <div className="flex items-baseline gap-0.5 text-sm font-semibold">
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={draft}
              placeholder=""
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitDraft();
                if (e.key === "Escape") setEditingNumber(false);
              }}
              className="min-h-11 w-14 rounded-lg border border-emerald-300 bg-white px-2 py-2 text-center text-base font-semibold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              aria-label="ICP estimate value"
            />
            <button type="button" className={suffixBtnClass} onClick={engageSlider}>
              /100
            </button>
          </div>
        ) : (
          <div className="flex items-baseline gap-0.5 text-sm font-semibold">
            <button
              type="button"
              onClick={startValueEdit}
              className={[
                valueBtnClass,
                hasValue ? "" : "text-slate-500 hover:text-emerald-800",
              ].join(" ")}
              aria-label={hasValue ? `Edit ICP ${value}` : "Enter ICP manually"}
            >
              {hasValue ? (
                <span className="underline decoration-emerald-400 underline-offset-2">
                  {value}
                </span>
              ) : (
                <span aria-hidden>—</span>
              )}
            </button>
            <button
              type="button"
              onClick={engageSlider}
              className={suffixBtnClass}
              aria-label="Activate ICP slider"
            >
              /100
            </button>
          </div>
        )}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={hasValue ? value : 0}
        onPointerDown={() => {
          setSliderEngaged(true);
          if (!hasValue) onChange(0);
        }}
        onChange={(e) => {
          setSliderEngaged(true);
          onChange(clampIcpEstimate(Number(e.target.value)));
        }}
        className={[
          "icp-range mt-3 h-3 w-full cursor-pointer appearance-none rounded-full touch-manipulation",
          sliderActive
            ? "bg-emerald-200 accent-emerald-600"
            : "bg-slate-200 accent-slate-400",
        ].join(" ")}
        aria-label="ICP estimate slider"
      />
    </div>
  );
}
