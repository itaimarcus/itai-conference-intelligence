"use client";

import Link from "next/link";
import type { Contact, Encounter } from "@/lib/clientStore";
import { SettingsHint } from "@/components/SettingsHint";
import { LifecycleBadge } from "@/components/LifecycleBadge";
import { formatIcpEstimate } from "@/lib/icpEstimate";
import { EmailComposeLink } from "@/components/EmailComposeLink";
import { compactLinkedInLabel, externalHref } from "@/lib/leadHelpers";
import type { ContactNudge } from "@/lib/contactNudges";
import { useContactSummarize } from "@/lib/useContactSummarize";
import {
  isCustomerStage,
  isUnqualifiedStage,
} from "@/lib/lifecycle";

function rowClass(stage?: string) {
  if (isCustomerStage(stage)) {
    return "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50";
  }
  if (isUnqualifiedStage(stage)) {
    return "border-rose-200 bg-rose-50/40 hover:bg-rose-50/70";
  }
  return "border-slate-200 bg-white hover:bg-slate-50";
}

export function ContactListRow({
  contact,
  encounters,
  lifecycleStage,
  icpEstimate,
  encounterCount,
  company,
  conferenceTrail,
  nudge,
}: {
  contact: Contact;
  encounters: Encounter[];
  lifecycleStage?: string;
  icpEstimate?: number;
  encounterCount: number;
  company?: string;
  conferenceTrail?: string;
  nudge?: ContactNudge;
}) {
  const linkedIn = compactLinkedInLabel(contact.linkedInUrl);
  const icpLabel = formatIcpEstimate(icpEstimate);
  const {
    summary,
    isLoading,
    error: summaryError,
    settingsError,
    summarize,
  } = useContactSummarize(contact, encounters);

  return (
    <div
      className={[
        "rounded-lg border px-3.5 py-2.5 shadow-sm transition-colors",
        rowClass(lifecycleStage),
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link href={`/contacts/${contact.id}`} className="block min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-slate-900">
                {contact.canonicalName}
              </span>
              <LifecycleBadge stage={lifecycleStage} size="md" />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-sm text-slate-600">
              {company ? (
                <span className="font-medium text-slate-800">{company}</span>
              ) : null}
              {icpLabel ? <span>{icpLabel}</span> : null}
              <span>
                {encounterCount} encounter{encounterCount === 1 ? "" : "s"}
              </span>
              {conferenceTrail ? (
                <span className="text-slate-500">{conferenceTrail}</span>
              ) : null}
            </div>
          </Link>
          {contact.email || linkedIn ? (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-sm">
              {contact.email ? (
                <EmailComposeLink email={contact.email} />
              ) : null}
              {linkedIn ? (
                <a
                  href={externalHref(contact.linkedInUrl!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline underline-offset-2"
                >
                  {linkedIn}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 min-h-11 touch-manipulation"
          disabled={isLoading || encounterCount === 0}
          onClick={() => void summarize()}
        >
          {isLoading ? "…" : "Summary"}
        </button>
      </div>

      {settingsError === "gemini" ? (
        <p className="mt-2 text-sm text-amber-900">
          <SettingsHint item="Gemini API key" />
        </p>
      ) : summaryError ? (
        <p className="mt-2 text-sm text-rose-700">{summaryError}</p>
      ) : null}

      {summary ? (
        <p className="mt-2 text-sm leading-snug text-slate-700">{summary}</p>
      ) : null}

      {nudge ? (
        <div className="mt-2 rounded-md border border-amber-200/80 bg-amber-50/90 px-2.5 py-1.5 text-sm leading-snug text-amber-950">
          <span className="font-semibold">{nudge.label}:</span> {nudge.action}
        </div>
      ) : null}
    </div>
  );
}
