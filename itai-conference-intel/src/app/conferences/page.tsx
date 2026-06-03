"use client";

import { useMemo, useState } from "react";
import { CONFERENCES } from "@/lib/conferences";
import { formatDateDDMMYYYY } from "@/lib/dates";
import {
  clearAllPlan,
  removePlanItem,
  setPlanAssignment,
  upsertPlanItem,
  LARGE_EVENT_AUDIENCE,
} from "@/lib/clientStore";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { regionLabel, REGION_LABELS } from "@/lib/regions";
import { useHydratedStore } from "@/lib/useHydratedStore";
import { scoreConference } from "@/lib/scoring";
import { ConferenceRegion, ConferenceTier, ConferenceVertical } from "@/lib/types";
import { useTeamMembers } from "@/lib/teamSettings";
import { verticalLabel } from "@/lib/verticals";
import { SecondRepControl } from "@/components/SecondRepControl";

function TierPill({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    S: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    A: "bg-lime-50 text-lime-800 ring-lime-200",
    B: "bg-sky-50 text-sky-800 ring-sky-200",
    C: "bg-amber-50 text-amber-900 ring-amber-200",
    D: "bg-orange-50 text-orange-900 ring-orange-200",
    F: "bg-rose-50 text-rose-900 ring-rose-200",
  };
  return (
    <span
      className={[
        "inline-flex items-center whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold ring-1 ring-inset",
        styles[tier] ?? "bg-slate-50 text-slate-700 ring-slate-200",
      ].join(" ")}
    >
      Tier {tier}
    </span>
  );
}

const REGION_FILTER_LABELS: Record<ConferenceRegion | "all", string> = {
  all: "All regions",
  ...REGION_LABELS,
};

const FILTER_REGIONS: ConferenceRegion[] = [
  "NA",
  "EUROPE",
  "AFRICA",
  "MIDDLE_EAST",
  "APAC",
  "LATAM",
  "GLOBAL",
];

const ALL_TIERS: (ConferenceTier | "all")[] = ["all", "S", "A", "B", "C", "D", "F"];

const FILTER_VERTICALS: ConferenceVertical[] = [
  "payments",
  "treasury",
  "fx",
  "fintech",
  "travel",
  "saas",
  "developer",
  "other",
];

const TIER_RANK: Record<ConferenceTier, number> = {
  S: 6,
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  F: 1,
};

type SortKey = "score" | "date" | "audience";

function FilterCheckboxGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
  formatOption,
}: {
  label: string;
  options: readonly T[];
  selected: Set<T>;
  onToggle: (value: T) => void;
  formatOption: (value: T) => string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
        {options.map((value) => (
          <label
            key={value}
            className="flex cursor-pointer select-none items-center gap-1.5 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              checked={selected.has(value)}
              onChange={() => onToggle(value)}
              className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-600"
            />
            {formatOption(value)}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ConferencesPage() {
  const [q, setQ] = useState("");
  const [regions, setRegions] = useState<Set<ConferenceRegion>>(() => new Set());
  const [verticals, setVerticals] = useState<Set<ConferenceVertical>>(() => new Set());
  const [tier, setTier] = useState<(typeof ALL_TIERS)[number]>("all");
  const [onlyPlanned, setOnlyPlanned] = useState(false);
  const [sort, setSort] = useState<SortKey>("score");
  const [draftAssign, setDraftAssign] = useState<Record<string, string>>({});
  const [pendingRepChange, setPendingRepChange] = useState<
    Record<string, string>
  >({});
  const [clearPlanOpen, setClearPlanOpen] = useState(false);
  const store = useHydratedStore();
  const plan = store.plan;
  const teamMembers = useTeamMembers();
  const scored = useMemo(() => {
    const normQ = q.trim().toLowerCase();
    const rows = CONFERENCES.map((c) => ({ c, s: scoreConference(c) }))
      .filter(({ c, s }) => {
        if (onlyPlanned && !plan[c.id]) return false;
        if (normQ && !c.name.toLowerCase().includes(normQ)) return false;
        if (regions.size > 0 && !regions.has(c.region)) return false;
        if (verticals.size > 0 && !c.verticals.some((v) => verticals.has(v))) return false;
        if (tier !== "all" && TIER_RANK[s.tier] < TIER_RANK[tier]) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "date") return a.c.startDate.localeCompare(b.c.startDate);
        if (sort === "audience") return b.c.estAudienceSize - a.c.estAudienceSize;
        const scoreDiff = b.s.total - a.s.total;
        if (scoreDiff !== 0) return scoreDiff;
        return TIER_RANK[b.s.tier] - TIER_RANK[a.s.tier];
      });

    return rows;
  }, [onlyPlanned, plan, q, regions, sort, tier, verticals]);

  const toggleRegion = (value: ConferenceRegion) => {
    setRegions((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleVertical = (value: ConferenceVertical) => {
    setVerticals((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const plannedCount = Object.keys(plan).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Conferences
          </h1>
        </div>
        {plannedCount > 0 ? (
          <button
            type="button"
            onClick={() => setClearPlanOpen(true)}
            className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-50"
          >
            Clear schedule ({plannedCount})
          </button>
        ) : null}
      </div>

      <ConfirmDialog
        open={clearPlanOpen}
        title="Clear entire schedule?"
        message="This removes every conference from the plan. Assignments are cleared too. This cannot be undone."
        confirmLabel="Clear all"
        onCancel={() => setClearPlanOpen(false)}
        onConfirm={() => {
          clearAllPlan();
          setClearPlanOpen(false);
        }}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="text-xs font-semibold text-slate-400">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search conference name ..."
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-semibold text-slate-400">Min. Tier</label>
            <select
              value={tier}
              onChange={(e) =>
                setTier(e.target.value as (typeof ALL_TIERS)[number])
              }
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            >
              {ALL_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All" : t}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="text-xs font-semibold text-slate-400">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            >
              <option value="score">Score/Tier</option>
              <option value="date">Date</option>
              <option value="audience">Audience size</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FilterCheckboxGroup
            label="Region"
            options={FILTER_REGIONS}
            selected={regions}
            onToggle={toggleRegion}
            formatOption={(r) => REGION_FILTER_LABELS[r]}
          />
          <FilterCheckboxGroup
            label="Vertical"
            options={FILTER_VERTICALS}
            selected={verticals}
            onToggle={toggleVertical}
            formatOption={(v) => verticalLabel(v)}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <label className="flex select-none items-center gap-2 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              checked={onlyPlanned}
              onChange={(e) => setOnlyPlanned(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-600"
            />
            Only planned
          </label>
          <div className="min-w-[4.5rem] text-right text-xs tabular-nums text-slate-500">
            {scored.length}
            {scored.length !== CONFERENCES.length ? ` / ${CONFERENCES.length}` : null}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[880px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[16%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
            <col className="w-[8%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Conference</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Verticals</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Attendees</th>
              <th className="px-4 py-3">Attend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {scored.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No conferences match these filters.
                </td>
              </tr>
            ) : null}
            {scored.map(({ c, s }) => {
              const isAttending = Boolean(plan[c.id]);
              const savedPrimary = plan[c.id]?.assignedTo ?? "";
              const memberValue = isAttending
                ? (pendingRepChange[c.id] ?? savedPrimary)
                : (draftAssign[c.id] ?? "");
              const repChangePending =
                isAttending && memberValue.trim() !== savedPrimary.trim();
              const canAttend = Boolean(memberValue.trim());
              return (
              <tr
                key={c.id}
                className={[
                  "transition-colors",
                  isAttending
                    ? "bg-emerald-50/90 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50"
                    : "hover:bg-slate-50",
                ].join(" ")}
              >
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold text-slate-900">{c.name}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top text-sm text-slate-900">
                  <div>{formatDateDDMMYYYY(c.startDate)}</div>
                  <div className="py-0.5 text-center leading-none text-slate-500">→</div>
                  <div className="min-h-[1.25rem]">
                    {c.endDate !== c.startDate ? (
                      formatDateDDMMYYYY(c.endDate)
                    ) : (
                      <span className="invisible select-none" aria-hidden>
                        —
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-slate-900">
                  <div>
                    {c.city}, {c.country}
                  </div>
                  <div className="mt-0.5 min-h-[1rem] text-xs text-slate-500">
                    {regionLabel(c.region)}
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-slate-900">
                  <div className="flex min-h-[2.25rem] flex-wrap content-start gap-1">
                    {c.verticals.map((v) => (
                      <span
                        key={v}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200"
                      >
                        {verticalLabel(v, { compact: true })}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <TierPill tier={s.tier} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top text-sm text-slate-900">
                  {s.total}/100
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top text-sm text-slate-900">
                  {c.estAudienceSize.toLocaleString()}
                </td>
                <td className="overflow-hidden px-3 py-3 align-top">
                  <div className="flex w-full max-w-full flex-col gap-1.5">
                    <select
                      value={memberValue}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (isAttending) {
                          if (next === savedPrimary) {
                            setPendingRepChange((prev) => {
                              const copy = { ...prev };
                              delete copy[c.id];
                              return copy;
                            });
                          } else {
                            setPendingRepChange((prev) => ({
                              ...prev,
                              [c.id]: next,
                            }));
                          }
                          return;
                        }
                        setDraftAssign((prev) => ({ ...prev, [c.id]: next }));
                      }}
                      className="w-full max-w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs text-slate-800"
                      aria-label="Team member"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!isAttending && !canAttend && !repChangePending}
                      className={[
                        "w-full max-w-full rounded-lg px-2 py-1.5 text-xs font-semibold shadow-sm transition-colors",
                        isAttending && !repChangePending
                          ? "border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100"
                          : canAttend || repChangePending
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "cursor-default bg-emerald-200 text-emerald-800",
                      ].join(" ")}
                      onClick={() => {
                        if (isAttending && repChangePending) {
                          setPlanAssignment(
                            c.id,
                            memberValue.trim() || undefined,
                            plan[c.id]?.assignedTo2,
                          );
                          setPendingRepChange((prev) => {
                            const next = { ...prev };
                            delete next[c.id];
                            return next;
                          });
                          return;
                        }
                        if (isAttending) {
                          removePlanItem(c.id);
                          setPendingRepChange((prev) => {
                            const next = { ...prev };
                            delete next[c.id];
                            return next;
                          });
                          setDraftAssign((prev) => {
                            const next = { ...prev };
                            delete next[c.id];
                            return next;
                          });
                          return;
                        }
                        if (!canAttend) return;
                        upsertPlanItem(c.id, "going", memberValue);
                      }}
                    >
                      {isAttending && !repChangePending ? "Cancel" : "Attending"}
                    </button>
                    {isAttending && c.estAudienceSize >= LARGE_EVENT_AUDIENCE ? (
                      <SecondRepControl
                        primaryAssignee={plan[c.id]?.assignedTo}
                        secondAssignee={plan[c.id]?.assignedTo2}
                        teamMembers={teamMembers}
                        onChange={(next) =>
                          setPlanAssignment(
                            c.id,
                            plan[c.id]?.assignedTo,
                            next,
                          )
                        }
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

