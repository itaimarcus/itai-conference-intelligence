"use client";

import { useState } from "react";
import { CONFERENCES } from "@/lib/conferences";
import { formatDateDDMMYYYY } from "@/lib/dates";
import { addEncounterFromLead, addLead } from "@/lib/clientStore";
import { IcpEstimateControl } from "@/components/IcpEstimateControl";
import { rememberCaptureConference } from "@/lib/captureConference";
import { LIFECYCLE_STAGES } from "@/lib/lifecycle";
import { useTeamMembers } from "@/lib/teamSettings";
import {
  buildLinkedInUrl,
  hasValidEmail,
  leadFullName,
  LINKEDIN_PREFIX,
  captureSavedBanner,
} from "@/lib/leadHelpers";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const LIFECYCLE_LABELS: Record<string, string> = {
  Customer: "Customer (done deal)",
};

const inputClass =
  "mt-1 box-border w-full max-w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

function CaptureEmailField({
  email,
  onEmailChange,
}: {
  email: string;
  onEmailChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500">Email *</label>
      <input
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        className={inputClass}
        autoComplete="email"
      />
    </div>
  );
}

export default function CapturePage() {
  const teamMembers = useTeamMembers();

  const [conferenceId, setConferenceId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedInSlug, setLinkedInSlug] = useState("");
  const [company, setCompany] = useState("");
  const [contactOwner, setContactOwner] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [lifecycleStage, setLifecycleStage] = useState("Lead");
  const [notes, setNotes] = useState("");
  const [icpEstimate, setIcpEstimate] = useState<number | undefined>(undefined);
  const [savedBanner, setSavedBanner] = useState<{
    title: string;
    subtitle: string;
  } | null>(null);

  const canSave = hasValidEmail(email);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setLinkedInSlug("");
    setCompany("");
    setContactOwner("");
    setJobTitle("");
    setLifecycleStage("Lead");
    setNotes("");
    setIcpEstimate(undefined);
    setConferenceId("");
  };

  return (
    <div className="mx-auto min-w-0 max-w-2xl space-y-4 overflow-x-hidden pb-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Capture</h1>
      </div>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid min-w-0 gap-3">
          <div className="md:hidden">
            <CaptureEmailField email={email} onEmailChange={setEmail} />
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-500">First name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
                autoComplete="given-name"
              />
            </div>
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-500">Last name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="hidden min-w-0 md:block">
              <CaptureEmailField email={email} onEmailChange={setEmail} />
            </div>
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-500">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-500">LinkedIn</label>
            <div className="mt-1 flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-emerald-600/20 sm:flex-row">
              <span className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400 sm:border-b-0 sm:border-r sm:py-2.5 sm:text-sm">
                {LINKEDIN_PREFIX}
              </span>
              <input
                value={linkedInSlug}
                onChange={(e) => setLinkedInSlug(e.target.value)}
                className="min-w-0 w-full flex-1 px-3 py-2 text-sm text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-500">Company</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-500">Registered by</label>
              <select
                value={contactOwner}
                onChange={(e) => setContactOwner(e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {teamMembers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-500">Job title</label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="min-w-0">
              <label className="text-xs font-semibold text-slate-500">Lifecycle stage</label>
              <select
                value={lifecycleStage}
                onChange={(e) => setLifecycleStage(e.target.value)}
                className={inputClass}
              >
                {LIFECYCLE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {LIFECYCLE_LABELS[s] ?? s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <IcpEstimateControl value={icpEstimate} onChange={setIcpEstimate} />

          <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-500">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="min-w-0">
            <label className="text-xs font-semibold text-slate-500">Conference</label>
            <select
              value={conferenceId}
              onChange={(e) => setConferenceId(e.target.value)}
              className={inputClass}
            >
              <option value="">Unassigned</option>
              {CONFERENCES.slice()
                .sort((a, b) => a.startDate.localeCompare(b.startDate))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.city} · {formatDateDDMMYYYY(c.startDate)}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="sticky bottom-0 -mx-4 mt-4 min-w-0 border-t border-slate-200 bg-white px-4 pb-2 pt-4 shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
          {savedBanner ? (
            <div
              role="status"
              className="mb-3 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-4 py-3 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white"
                  aria-hidden
                >
                  ✓
                </span>
                <div>
                  <div className="text-base font-semibold text-emerald-950">
                    {savedBanner.title}
                  </div>
                  {savedBanner.subtitle ? (
                    <div className="mt-0.5 text-sm text-emerald-900">
                      {savedBanner.subtitle}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex">
            <button
              type="button"
              disabled={!canSave}
              onClick={() => {
                const fn = firstName.trim();
                const ln = lastName.trim();
                const fullName = leadFullName({
                  firstName: fn || undefined,
                  lastName: ln || undefined,
                  fullName: "",
                  email: email.trim() || undefined,
                  phone: phone.trim() || undefined,
                });
                const confId = conferenceId.trim() || undefined;
                const lead = {
                  id: uid(),
                  createdAt: new Date().toISOString(),
                  conferenceId: confId,
                  firstName: fn || undefined,
                  lastName: ln || undefined,
                  fullName,
                  company: company.trim() || undefined,
                  email: email.trim().toLowerCase(),
                  phone: phone.trim() || undefined,
                  linkedInUrl: buildLinkedInUrl(linkedInSlug),
                  contactOwner: contactOwner.trim() || undefined,
                  jobTitle: jobTitle.trim() || undefined,
                  lifecycleStage,
                  notes: notes.trim() || undefined,
                  icpEstimate,
                };
                if (confId) rememberCaptureConference(confId);
                addLead(lead);
                const { match } = addEncounterFromLead(lead);
                setSavedBanner(captureSavedBanner(match, leadFullName(lead)));
                resetForm();
                window.setTimeout(() => setSavedBanner(null), 6000);
              }}
              className="min-h-12 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation"
            >
              Save lead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
