"use client";

import { useMemo } from "react";
import type { Contact, Encounter, Lead } from "@/lib/clientStore";
import { updateContact } from "@/lib/clientStore";
import { conferenceDisplayName } from "@/lib/conferenceLabel";
import { contactFieldHints } from "@/lib/contactProfile";
import { formatIsoDateTimeDDMMYYYY } from "@/lib/dates";
import { EmailComposeLink } from "@/components/EmailComposeLink";
import { LinkedInField } from "@/components/LinkedInField";
import { IcpEstimateControl } from "@/components/IcpEstimateControl";
import { LifecycleBadge } from "@/components/LifecycleBadge";
import { LIFECYCLE_STAGES, lifecycleSelectLabel } from "@/lib/lifecycle";
import { encounterStageForJourney } from "@/lib/lifecycleJourney";
import { RelationshipNudge } from "@/components/RelationshipNudge";
import { buildContactNudges, formatConferenceTrail, distinctConferenceIds } from "@/lib/contactNudges";
import {
  isCustomerStage,
  isUnqualifiedStage,
} from "@/lib/lifecycle";

const fieldClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

const selectClass =
  "w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-8 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 bg-[length:0.65rem] bg-[position:right_0.5rem_center] bg-no-repeat [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]";

function contactCardClass(stage?: string) {
  if (isCustomerStage(stage)) {
    return "border-emerald-300 bg-emerald-50/60 ring-1 ring-inset ring-emerald-200";
  }
  if (isUnqualifiedStage(stage)) {
    return "border-rose-200 bg-rose-50/40 ring-1 ring-inset ring-rose-100";
  }
  return "border-slate-200 bg-white";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </label>
  );
}

export function ContactCard({
  contact,
  encounters,
  leads,
  teamMembers,
  encounterCount,
  lastEncounter,
  relationshipSummary,
  summaryError,
  isSummaryLoading,
  onDelete,
  onSummarize,
}: {
  contact: Contact;
  encounters: Encounter[];
  leads: Lead[];
  teamMembers: string[];
  encounterCount: number;
  lastEncounter?: Encounter;
  relationshipSummary?: string;
  summaryError?: string;
  isSummaryLoading: boolean;
  onDelete: () => void;
  onSummarize: () => void;
}) {
  const hints = contactFieldHints(contact, encounters, leads);
  const lifecycleStage = contact.lifecycleStage ?? "";
  const encountersChronological = useMemo(
    () =>
      [...encounters].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [encounters],
  );
  const relationshipNudges = useMemo(
    () => buildContactNudges(contact, encounters),
    [contact, encounters],
  );
  const conferenceTrail = useMemo(() => {
    const ids = distinctConferenceIds(encounters);
    return ids.length >= 2 ? formatConferenceTrail(ids) : "";
  }, [encounters]);

  const save = (patch: Parameters<typeof updateContact>[1]) => {
    updateContact(contact.id, patch);
  };

  return (
    <div
      className={[
        "rounded-xl border px-3 py-2 shadow-sm",
        contactCardClass(lifecycleStage || undefined),
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-slate-900">
            {contact.canonicalName}
          </span>
          <LifecycleBadge stage={lifecycleStage || undefined} />
          <span className="text-xs text-slate-500">
            {encounterCount} encounter{encounterCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 touch-manipulation"
            disabled={isSummaryLoading || encounterCount === 0}
            onClick={onSummarize}
          >
            {isSummaryLoading ? "…" : "Summary"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="min-h-11 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 touch-manipulation"
          >
            Delete
          </button>
        </div>
      </div>

      {lastEncounter ? (
        <div className="mt-1 text-xs text-slate-500">
          Last: {conferenceDisplayName(lastEncounter.conferenceId) ?? "Encounter"} ·{" "}
          {formatIsoDateTimeDDMMYYYY(lastEncounter.createdAt)}
        </div>
      ) : null}

      {conferenceTrail ? (
        <p className="mt-1 text-xs text-slate-600">{conferenceTrail}</p>
      ) : null}

      {relationshipNudges.length > 0 ? (
        <div className="mt-2 space-y-1.5">
          {relationshipNudges.slice(0, 2).map((n, i) => (
            <RelationshipNudge key={`${n.label}-${i}`} nudge={n} />
          ))}
        </div>
      ) : null}

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <FieldLabel>First name</FieldLabel>
          <input
            className={fieldClass}
            value={contact.firstName ?? ""}
            placeholder={hints.firstName}
            onChange={(e) => save({ firstName: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel>Last name</FieldLabel>
          <input
            className={fieldClass}
            value={contact.lastName ?? ""}
            placeholder={hints.lastName}
            onChange={(e) => save({ lastName: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel>Company</FieldLabel>
          <input
            className={fieldClass}
            value={contact.canonicalCompany ?? ""}
            placeholder={hints.company}
            onChange={(e) => save({ canonicalCompany: e.target.value || undefined })}
          />
        </div>
        <div>
          <FieldLabel>Email</FieldLabel>
          <input
            type="email"
            className={fieldClass}
            value={contact.email ?? ""}
            placeholder={hints.firstName ? undefined : "email@company.com"}
            onChange={(e) => save({ email: e.target.value })}
          />
          {contact.email?.trim() ? (
            <div className="mt-1">
              <EmailComposeLink
                email={contact.email}
                className="text-xs font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
              />
            </div>
          ) : null}
        </div>
        <div>
          <FieldLabel>Phone</FieldLabel>
          <input
            type="tel"
            className={fieldClass}
            value={contact.phone ?? ""}
            placeholder={hints.phone}
            onChange={(e) => save({ phone: e.target.value || undefined })}
          />
        </div>
        <div>
          <FieldLabel>Job title</FieldLabel>
          <input
            className={fieldClass}
            value={contact.jobTitle ?? ""}
            placeholder={hints.jobTitle}
            onChange={(e) => save({ jobTitle: e.target.value || undefined })}
          />
        </div>
        <div>
          <FieldLabel>Contact owner</FieldLabel>
          <select
            className={selectClass}
            value={contact.contactOwner ?? ""}
            onChange={(e) => save({ contactOwner: e.target.value || undefined })}
          >
            <option value="">—</option>
            {teamMembers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Lifecycle</FieldLabel>
          <select
            className={selectClass}
            value={lifecycleStage}
            onChange={(e) =>
              save({ lifecycleStage: e.target.value || undefined })
            }
          >
            <option value="">—</option>
            {LIFECYCLE_STAGES.map((s) => (
              <option key={s} value={s}>
                {lifecycleSelectLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <LinkedInField
            value={contact.linkedInUrl}
            placeholder={hints.linkedInUrl}
            onChange={(url) => save({ linkedInUrl: url })}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <IcpEstimateControl
            value={contact.icpEstimate}
            onChange={(v) => save({ icpEstimate: v })}
          />
        </div>
      </div>

      {summaryError ? (
        <p className="mt-2 text-sm text-rose-700">{summaryError}</p>
      ) : null}

      {relationshipSummary ? (
        <div className="mt-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            AI summary
          </p>
          <p className="mt-0.5 text-sm leading-snug text-slate-800">
            {relationshipSummary}
          </p>
        </div>
      ) : null}

      {encounterCount > 0 ? (
        <details className="mt-2">
          <summary className="cursor-pointer select-none text-xs font-semibold text-slate-600">
            Timeline ({encounterCount})
          </summary>
          <div className="mt-1 space-y-1">
            {encountersChronological.map((e, index) => (
              <div
                key={e.id}
                className="rounded-lg border border-slate-200/80 bg-white/80 px-2 py-1.5 text-xs text-slate-600"
              >
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span className="font-semibold text-slate-500">
                    #{index + 1}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {conferenceDisplayName(e.conferenceId) ?? "Encounter"}
                  </span>
                  <span aria-hidden>·</span>
                  <span>{formatIsoDateTimeDDMMYYYY(e.createdAt)}</span>
                  <LifecycleBadge
                    stage={encounterStageForJourney(e.lifecycleStage)}
                  />
                </div>
                {e.notes ? (
                  <div className="mt-0.5 text-slate-700">{e.notes}</div>
                ) : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
