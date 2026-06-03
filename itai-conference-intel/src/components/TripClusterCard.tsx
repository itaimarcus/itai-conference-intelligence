"use client";

import { useState } from "react";
import { formatDateDDMMYYYY } from "@/lib/dates";
import { TripCluster } from "@/lib/clusterHints";
import {
  LARGE_EVENT_AUDIENCE,
  removePlanItem,
  setPlanAssignment,
  upsertPlanItem,
} from "@/lib/clientStore";
import {
  CLUSTER_NO_COMMON_REP_MSG,
  clusterHasNoCommonAssignee,
} from "@/lib/planCoverage";
import { SecondRepControl } from "@/components/SecondRepControl";

export function TripClusterCard({
  cluster,
  plannedIds,
  plan,
  teamMembers,
  compact,
}: {
  cluster: TripCluster;
  plannedIds: Set<string>;
  plan?: Record<string, { assignedTo?: string; assignedTo2?: string }>;
  teamMembers: string[];
  compact?: boolean;
}) {
  const [assignTo, setAssignTo] = useState("");
  const [pendingRepByConf, setPendingRepByConf] = useState<
    Record<string, string>
  >({});
  const canAttend = Boolean(assignTo.trim());

  const labelClass = compact ? "text-sm text-slate-500" : "text-xs text-slate-500";
  const selectClass = compact
    ? "rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800"
    : "rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800";
  const rowClass = compact
    ? "grid gap-2 text-sm text-slate-700 sm:grid-cols-[minmax(0,1fr)_11.5rem] sm:items-start"
    : "grid gap-2 text-xs text-slate-700 sm:grid-cols-[minmax(0,1fr)_11.5rem] sm:items-start";
  const btnClass = compact
    ? "shrink-0 rounded-md px-2.5 py-1.5 text-sm font-semibold"
    : "shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold";
  const actionBtnClass = `${btnClass} w-[5.25rem] text-center`;

  const allPlanned = cluster.conferences.every((c) => plannedIds.has(c.id));
  const nonePlanned = cluster.conferences.every((c) => !plannedIds.has(c.id));
  const assigneeConflict = clusterHasNoCommonAssignee(
    cluster.conferences.filter((c) => plannedIds.has(c.id)).map((c) => c.id),
    plan ?? {},
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900">{cluster.label}</div>
          {assigneeConflict ? (
            <div className="mt-0.5 text-xs font-semibold text-rose-700">
              {CLUSTER_NO_COMMON_REP_MSG}
            </div>
          ) : null}
          {!compact ? (
            <div className="mt-0.5 text-xs text-slate-500">
              {Math.round(cluster.avgScore)}/100 · {cluster.maxGapDays}d max gap
            </div>
          ) : null}
        </div>
        {allPlanned ? (
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            On plan
          </span>
        ) : nonePlanned ? (
          <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
            Opportunity
          </span>
        ) : (
          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
            Partial
          </span>
        )}
      </div>

      {teamMembers.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className={labelClass}>Team member</label>
          <select
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            className={selectClass}
          >
            <option value="">Unassigned</option>
            {teamMembers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="mt-2 space-y-1">
        {cluster.conferences.map((c) => (
          <div
            key={c.id}
            className={rowClass}
          >
            <span>
              {plannedIds.has(c.id) ? "✓ " : ""}
              {c.name} · {c.city} · {formatDateDDMMYYYY(c.startDate)}
              {c.endDate !== c.startDate
                ? ` → ${formatDateDDMMYYYY(c.endDate)}`
                : ""}
              {[plan?.[c.id]?.assignedTo, plan?.[c.id]?.assignedTo2]
                .filter(Boolean)
                .join(" + ")
                ? ` · ${[plan?.[c.id]?.assignedTo, plan?.[c.id]?.assignedTo2].filter(Boolean).join(" + ")}`
                : ""}
            </span>
            {plannedIds.has(c.id) ? (
              <div className="flex w-full flex-col gap-1 sm:w-[11.5rem]">
                {(() => {
                  const saved = plan?.[c.id]?.assignedTo ?? "";
                  const display = pendingRepByConf[c.id] ?? saved;
                  const pending = display.trim() !== saved.trim();
                  return (
                    <>
                      <div className="flex items-stretch gap-1">
                        <select
                          value={display}
                          onChange={(e) => {
                            const next = e.target.value;
                            if (next === saved) {
                              setPendingRepByConf((prev) => {
                                const copy = { ...prev };
                                delete copy[c.id];
                                return copy;
                              });
                            } else {
                              setPendingRepByConf((prev) => ({
                                ...prev,
                                [c.id]: next,
                              }));
                            }
                          }}
                          className={[selectClass, "min-w-0 flex-1"].join(" ")}
                          aria-label="Team member"
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                        {pending ? (
                          <button
                            type="button"
                            className={[
                              actionBtnClass,
                              "bg-emerald-600 text-white hover:bg-emerald-700",
                            ].join(" ")}
                            onClick={() => {
                              setPlanAssignment(
                                c.id,
                                display.trim() || undefined,
                                plan?.[c.id]?.assignedTo2,
                              );
                              setPendingRepByConf((prev) => {
                                const copy = { ...prev };
                                delete copy[c.id];
                                return copy;
                              });
                            }}
                          >
                            Attending
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={[
                              actionBtnClass,
                              "border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100",
                            ].join(" ")}
                            onClick={() => {
                              removePlanItem(c.id);
                              setPendingRepByConf((prev) => {
                                const copy = { ...prev };
                                delete copy[c.id];
                                return copy;
                              });
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      {c.estAudienceSize >= LARGE_EVENT_AUDIENCE ? (
                        <SecondRepControl
                          compact
                          primaryAssignee={plan?.[c.id]?.assignedTo}
                          secondAssignee={plan?.[c.id]?.assignedTo2}
                          teamMembers={teamMembers}
                          onChange={(next) =>
                            setPlanAssignment(
                              c.id,
                              plan?.[c.id]?.assignedTo,
                              next,
                            )
                          }
                        />
                      ) : (
                        <div className="hidden h-7 sm:block" aria-hidden />
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <button
                type="button"
                className={[
                  actionBtnClass,
                  "w-full sm:ml-auto",
                  canAttend
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "cursor-default bg-emerald-200 text-emerald-800",
                ].join(" ")}
                onClick={() => {
                  if (!canAttend) return;
                  upsertPlanItem(c.id, "going", assignTo);
                }}
              >
                Attending
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TripStackBundleCard({
  clusters,
  plannedIds,
  plan,
  teamMembers,
  compact,
}: {
  clusters: TripCluster[];
  plannedIds: Set<string>;
  plan?: Record<string, { assignedTo?: string; assignedTo2?: string }>;
  teamMembers: string[];
  compact?: boolean;
}) {
  if (clusters.length === 1) {
    return (
      <TripClusterCard
        cluster={clusters[0]!}
        plannedIds={plannedIds}
        plan={plan}
        teamMembers={teamMembers}
        compact={compact}
      />
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-2">
      <div className="mb-1 px-1 text-xs font-semibold text-amber-900">Pick one</div>
      <div className="mb-2 px-1 text-[11px] text-amber-800/90">
        Overlapping dates — one person can&apos;t attend both
      </div>
      <div className="space-y-2">
        {clusters.map((cluster) => (
          <TripClusterCard
            key={cluster.id}
            cluster={cluster}
            plannedIds={plannedIds}
            plan={plan}
            teamMembers={teamMembers}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
