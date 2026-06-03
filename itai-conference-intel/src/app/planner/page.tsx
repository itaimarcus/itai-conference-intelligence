"use client";

import { useMemo, useState } from "react";
import { CONFERENCES } from "@/lib/conferences";
import { removePlanItem } from "@/lib/clientStore";
import {
  conferenceClusterIdMap,
  findCatalogTripOpportunities,
  findTripClusters,
  groupCatalogClusters,
  segmentPlannedTrips,
  type TripCluster,
} from "@/lib/clusterHints";
import { formatDateDDMMYYYY, formatMonthYear } from "@/lib/dates";
import { useHydratedStore } from "@/lib/useHydratedStore";
import { scoreConference } from "@/lib/scoring";
import {
  CLUSTER_NO_COMMON_REP_MSG,
  HIGH_TIERS,
  clusterHasNoCommonAssignee,
  individualQuarterCovered,
  isOnPlanForMember,
  teamQuarterCoverageLabel,
  teamQuarterCoverageStatus,
} from "@/lib/planCoverage";
import { useTeamMembers } from "@/lib/teamSettings";
import { Conference } from "@/lib/types";
import { TripStackBundleCard } from "@/components/TripClusterCard";

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

type PlannedItem = {
  c: Conference;
  status: "going";
  score: number;
};

function formatAssignees(assignedTo?: string, assignedTo2?: string) {
  const names = [assignedTo, assignedTo2].filter(Boolean);
  return names.length ? names.join(" + ") : undefined;
}

function PlannedEventCard({
  c,
  score,
  assignedTo,
  assignedTo2,
}: {
  c: Conference;
  score: number;
  assignedTo?: string;
  assignedTo2?: string;
}) {
  const assignees = formatAssignees(assignedTo, assignedTo2);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 ring-1 ring-inset ring-emerald-100">
      <div>
        <div className="text-sm font-semibold text-emerald-950">{c.name}</div>
        <div className="text-xs text-emerald-900/80">
          {formatDateDDMMYYYY(c.startDate)}
          {c.endDate !== c.startDate
            ? ` → ${formatDateDDMMYYYY(c.endDate)}`
            : ""}{" "}
          · {c.city} · {score}/100
          {assignees ? ` · ${assignees}` : ""}
        </div>
      </div>
      <button
        type="button"
        className="min-w-[5.5rem] rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
        onClick={() => removePlanItem(c.id)}
      >
        Cancel
      </button>
    </div>
  );
}

function ClusterLinkConnector() {
  return (
    <div className="flex justify-center py-0.5" aria-hidden>
      <div className="h-5 w-5 rounded-r-md border-y-[3px] border-r-[3px] border-slate-700" />
    </div>
  );
}

function TripClusterList({
  items,
  plan,
  clusterHints,
}: {
  items: PlannedItem[];
  plan: Record<string, { assignedTo?: string; assignedTo2?: string }>;
  clusterHints: TripCluster[];
}) {
  const conferences = items.map((i) => i.c);
  const clusterId = conferenceClusterIdMap(clusterHints).get(
    conferences[0]?.id ?? "",
  );
  const cluster = clusterHints.find((c) => c.id === clusterId);
  const assigneeConflict = clusterHasNoCommonAssignee(
    conferences.map((c) => c.id),
    plan,
  );

  return (
    <>
      {items.length >= 2 ? (
        <div className="mb-2 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-1.5">
          <div className="text-sm font-semibold text-slate-900">
            {cluster?.label ?? "Trip cluster"}
          </div>
          {assigneeConflict ? (
            <div className="mt-0.5 text-xs font-semibold text-rose-700">
              {CLUSTER_NO_COMMON_REP_MSG}
            </div>
          ) : null}
        </div>
      ) : null}
      {items.map((item, idx) => (
        <div key={item.c.id}>
          <PlannedEventCard
            c={item.c}
            score={item.score}
            assignedTo={plan[item.c.id]?.assignedTo}
            assignedTo2={plan[item.c.id]?.assignedTo2}
          />
          {idx < items.length - 1 ? <ClusterLinkConnector /> : null}
        </div>
      ))}
    </>
  );
}

function PlannedTripSegments({
  segments,
  itemByConfId,
  plan,
  clusterHints,
}: {
  segments: ReturnType<typeof segmentPlannedTrips>;
  itemByConfId: Map<string, PlannedItem>;
  plan: Record<string, { assignedTo?: string; assignedTo2?: string }>;
  clusterHints: TripCluster[];
}) {
  return (
    <>
      {segments.map((seg, segIdx) => {
        if (seg.kind === "or") {
          return (
            <div
              key={`or-${segIdx}`}
              className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-3"
            >
              <div className="mb-2 text-xs font-semibold text-amber-900">
                Pick one
              </div>
              <div className="mb-2 text-[11px] text-amber-800/90">
                Overlapping dates — one person can&apos;t attend both
              </div>
              <div className="space-y-3">
                {seg.stacks.map((stack, stackIdx) => {
                  const items = stack
                    .map((c) => itemByConfId.get(c.id))
                    .filter(Boolean) as PlannedItem[];
                  return (
                    <div
                      key={stackIdx}
                      className={
                        stackIdx > 0
                          ? "border-t border-amber-200 pt-3"
                          : undefined
                      }
                    >
                      <TripClusterList
                        items={items}
                        plan={plan}
                        clusterHints={clusterHints}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        const items = seg.conferences
          .map((c) => itemByConfId.get(c.id))
          .filter(Boolean) as PlannedItem[];

        if (items.length === 1) {
          const item = items[0]!;
          return (
            <PlannedEventCard
              key={item.c.id}
              c={item.c}
              score={item.score}
              assignedTo={plan[item.c.id]?.assignedTo}
              assignedTo2={plan[item.c.id]?.assignedTo2}
            />
          );
        }

        return (
          <div key={`stack-${segIdx}`}>
            <TripClusterList
              items={items}
              plan={plan}
              clusterHints={clusterHints}
            />
          </div>
        );
      })}
    </>
  );
}

export default function PlannerPage() {
  const store = useHydratedStore();
  const plan = store.plan;

  const planned = useMemo(() => {
    const plannedIds = Object.keys(plan);
    const byId = new Map(CONFERENCES.map((c) => [c.id, c] as const));
    return plannedIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((c) => ({
        c: c!,
        status: plan[c!.id]!.status,
        score: scoreConference(c!).total,
      }))
      .sort((a, b) => a.c.startDate.localeCompare(b.c.startDate));
  }, [plan]);

  const teamMembers = useTeamMembers();
  const [memberFilter, setMemberFilter] = useState<string>("all");

  const filteredPlanned = useMemo(() => {
    if (memberFilter === "all") return planned;
    return planned.filter((p) => isOnPlanForMember(plan[p.c.id], memberFilter));
  }, [planned, plan, memberFilter]);

  const months = useMemo(() => {
    const map = new Map<string, PlannedItem[]>();
    for (const item of filteredPlanned) {
      const key = monthKey(item.c.startDate);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredPlanned]);

  const clusterHints = useMemo(
    () => findTripClusters(filteredPlanned.map((p) => p.c)),
    [filteredPlanned],
  );

  const catalogStacks = useMemo(() => findCatalogTripOpportunities({ limit: 12 }), []);
  const catalogBundles = useMemo(
    () => groupCatalogClusters(catalogStacks),
    [catalogStacks],
  );
  const plannedIds = useMemo(() => new Set(Object.keys(plan)), [plan]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Planner</h1>
        <div className="text-sm text-slate-600">
          Planned:{" "}
          <span className="font-semibold text-slate-900">
            {memberFilter === "all" ? planned.length : filteredPlanned.length}
          </span>
          {memberFilter !== "all" ? ` (of ${planned.length})` : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="text-xs font-semibold text-slate-500">Filter</span>
        <select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900"
        >
          <option value="all">Whole team</option>
          {teamMembers.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-8 space-y-3">
          {filteredPlanned.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
              {planned.length === 0 ? "Nothing planned." : "No events match this filter."}
            </div>
          ) : (
            months.map(([m, items]) => {
              const itemByConfId = new Map(items.map((i) => [i.c.id, i]));
              const segments = segmentPlannedTrips(
                items.map((i) => i.c),
                clusterHints,
              );
              return (
                <div
                  key={m}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900">
                      {formatMonthYear(m)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {items.length} event{items.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <PlannedTripSegments
                      segments={segments}
                      itemByConfId={itemByConfId}
                      plan={plan}
                      clusterHints={clusterHints}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="md:col-span-4 space-y-3">
          <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 shadow-sm">
            <div className="text-sm font-semibold text-sky-950">
              Trip stack opportunities ({catalogStacks.length})
            </div>
            <div className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto">
              {catalogBundles.map((bundle) => (
                <TripStackBundleCard
                  key={bundle.map((c) => c.id).join("__")}
                  clusters={bundle}
                  plannedIds={plannedIds}
                  plan={plan}
                  teamMembers={teamMembers}
                />
              ))}
            </div>
          </div>

          <IndividualCoverage
            planned={planned}
            teamMembers={teamMembers}
            plan={plan}
            memberFilter={memberFilter}
          />

          <UnassignedHighTierAlerts planned={planned} plan={plan} />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">
              Team Coverage
            </div>
            <TeamQuarterCoverage planned={planned} />
          </div>
        </div>
      </div>
    </div>
  );
}

const PLANNER_QUARTERS: { key: string; months: number[] }[] = [
  { key: "Q1", months: [1, 2, 3] },
  { key: "Q2", months: [4, 5, 6] },
  { key: "Q3", months: [7, 8, 9] },
  { key: "Q4", months: [10, 11, 12] },
];

function quarterCoverageFlags(
  events: PlannedItem[],
  year: number,
): boolean[] {
  return PLANNER_QUARTERS.map((q) => {
    const countInQ = events.filter((p) => {
      const d = new Date(p.c.startDate);
      return d.getFullYear() === year && q.months.includes(d.getMonth() + 1);
    }).length;
    return individualQuarterCovered(countInQ);
  });
}

function CoverageQuarterGrid({ qOk }: { qOk: boolean[] }) {
  return (
    <div className="mt-2 grid grid-cols-4 gap-1">
      {PLANNER_QUARTERS.map((q, i) => (
        <div
          key={q.key}
          className={[
            "rounded-md px-1 py-1 text-center text-xs font-semibold",
            qOk[i]
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-200 text-slate-500",
          ].join(" ")}
        >
          {q.key}
        </div>
      ))}
    </div>
  );
}

function IndividualCoverage({
  planned,
  teamMembers,
  plan,
  memberFilter,
}: {
  planned: PlannedItem[];
  teamMembers: string[];
  plan: Record<string, { assignedTo?: string; assignedTo2?: string }>;
  memberFilter: string;
}) {
  const year = new Date().getFullYear();
  const unassignedEvents = planned.filter((p) => !plan[p.c.id]?.assignedTo);
  const highlightMember =
    memberFilter !== "all" && teamMembers.includes(memberFilter)
      ? memberFilter
      : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">
        Individual Coverage
      </div>
      <div className="mt-3 space-y-2">
        {unassignedEvents.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Unassigned</span>
              <span className="text-xs text-slate-600">
                {unassignedEvents.length} event
                {unassignedEvents.length === 1 ? "" : "s"}
              </span>
            </div>
            <CoverageQuarterGrid
              qOk={quarterCoverageFlags(unassignedEvents, year)}
            />
          </div>
        ) : null}
        {teamMembers.map((name) => {
          const events = planned.filter((p) =>
            isOnPlanForMember(plan[p.c.id], name),
          );
          const qOk = quarterCoverageFlags(events, year);
          return (
            <div
              key={name}
              className={[
                "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm",
                highlightMember === name
                  ? "ring-2 ring-blue-400 ring-offset-1"
                  : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{name}</span>
                <span className="text-xs text-slate-600">
                  {events.length} event{events.length === 1 ? "" : "s"}
                </span>
              </div>
              <CoverageQuarterGrid qOk={qOk} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnassignedHighTierAlerts({
  planned,
  plan,
}: {
  planned: PlannedItem[];
  plan: Record<string, { assignedTo?: string; assignedTo2?: string }>;
}) {
  const flagged = planned.filter((p) => {
    const tier = scoreConference(p.c).tier;
    return HIGH_TIERS.has(tier) && !plan[p.c.id]?.assignedTo;
  });

  if (flagged.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="text-sm font-semibold text-amber-950">
        Unassigned high-tier ({flagged.length})
      </div>
      <ul className="mt-2 space-y-1 text-xs text-amber-900">
        {flagged.map((p) => (
          <li key={p.c.id}>
            {p.c.name} · Tier {scoreConference(p.c).tier} ·{" "}
            {formatDateDDMMYYYY(p.c.startDate)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function teamQuarterTileClass(
  status: ReturnType<typeof teamQuarterCoverageStatus>,
) {
  switch (status) {
    case "covered":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "semi-invested":
      return "border-amber-200 bg-amber-50 text-amber-950";
    case "empty":
      return "border-rose-200/90 bg-rose-50/80 text-rose-900";
  }
}

function TeamQuarterCoverage({ planned }: { planned: PlannedItem[] }) {
  const year = new Date().getFullYear();
  const quarters = [
    { key: "Q1", months: [1, 2, 3] },
    { key: "Q2", months: [4, 5, 6] },
    { key: "Q3", months: [7, 8, 9] },
    { key: "Q4", months: [10, 11, 12] },
  ];

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {quarters.map((q) => {
        const inQuarter = planned.filter((p) => {
          const dt = new Date(p.c.startDate);
          return (
            dt.getFullYear() === year && q.months.includes(dt.getMonth() + 1)
          );
        });
        const status = teamQuarterCoverageStatus(inQuarter.length);

        return (
          <div
            key={q.key}
            className={[
              "rounded-xl border px-3 py-2 text-sm",
              teamQuarterTileClass(status),
            ].join(" ")}
          >
            <div className="font-semibold">{q.key}</div>
            <div className="text-xs opacity-80">
              {teamQuarterCoverageLabel(status)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
