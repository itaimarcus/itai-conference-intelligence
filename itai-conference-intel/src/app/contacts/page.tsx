"use client";

import { useMemo, useState } from "react";
import { ContactListRow } from "@/components/ContactListRow";
import { SettingsHint, StatusBanner } from "@/components/SettingsHint";
import { leadsToHubSpotContactsCsv } from "@/lib/csv";
import { loadHubSpotToken } from "@/lib/integrationSettings";
import {
  resolveContactIcp,
  resolveContactLifecycle,
} from "@/lib/contactDisplay";
import {
  buildContactNudges,
  distinctConferenceIds,
  formatConferenceTrail,
  primaryContactNudge,
} from "@/lib/contactNudges";
import { contactMatchesSearch } from "@/lib/contactSearch";
import { compareContactsByLifecycleThenIcp } from "@/lib/lifecycleSort";
import { useHydratedStore } from "@/lib/useHydratedStore";

type ContactSort = "recent" | "lifecycle";

function lastSeenMs(contactId: string, createdAt: string, encounters: { contactId: string; createdAt: string }[]) {
  let latest = Date.parse(createdAt);
  if (Number.isNaN(latest)) latest = 0;
  for (const e of encounters) {
    if (e.contactId !== contactId) continue;
    const t = Date.parse(e.createdAt);
    if (!Number.isNaN(t) && t > latest) latest = t;
  }
  return latest;
}

export default function ContactsPage() {
  const store = useHydratedStore();
  const [sortBy, setSortBy] = useState<ContactSort>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [hubspotStatus, setHubspotStatus] = useState<{
    kind: "error" | "success";
    message: React.ReactNode;
  } | null>(null);
  const [hubspotBusy, setHubspotBusy] = useState(false);

  const contacts = store.contacts;
  const encountersByContact = useMemo(() => {
    const counts = new Map<string, number>();
    const byContact = new Map<string, typeof store.encounters>();
    for (const e of store.encounters) {
      counts.set(e.contactId, (counts.get(e.contactId) ?? 0) + 1);
      const list = byContact.get(e.contactId);
      if (list) list.push(e);
      else byContact.set(e.contactId, [e]);
    }
    return { counts, byContact };
  }, [store.encounters]);

  const sortedContacts = useMemo(() => {
    const indexed = contacts.map((c, listIndex) => ({ c, listIndex }));
    if (sortBy === "recent") {
      return [...indexed].sort(
        (a, b) =>
          lastSeenMs(b.c.id, b.c.createdAt, store.encounters) -
          lastSeenMs(a.c.id, a.c.createdAt, store.encounters),
      );
    }
    return [...indexed].sort((a, b) =>
      compareContactsByLifecycleThenIcp(
        {
          lifecycle: resolveContactLifecycle(a.c, store.encounters),
          icp: resolveContactIcp(a.c, store.encounters),
          listIndex: a.listIndex,
        },
        {
          lifecycle: resolveContactLifecycle(b.c, store.encounters),
          icp: resolveContactIcp(b.c, store.encounters),
          listIndex: b.listIndex,
        },
      ),
    );
  }, [contacts, sortBy, store.encounters]);

  const visibleContacts = useMemo(() => {
    if (!searchQuery.trim()) return sortedContacts;
    return sortedContacts.filter(({ c }) => contactMatchesSearch(c, searchQuery));
  }, [sortedContacts, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Contacts</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{contacts.length}</span>
          </div>
          <button
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-50 touch-manipulation"
            disabled={hubspotBusy || store.leads.length === 0}
            onClick={async () => {
              const token = loadHubSpotToken();
              if (!token) {
                setHubspotStatus({
                  kind: "error",
                  message: <SettingsHint item="HubSpot token" />,
                });
                return;
              }
              setHubspotBusy(true);
              setHubspotStatus(null);
              try {
                const res = await fetch("/api/hubspot/sync", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-HubSpot-Token": token,
                  },
                  body: JSON.stringify({ leads: store.leads }),
                });
                const data = (await res.json()) as {
                  synced?: number;
                  skipped?: number;
                  errors?: string[];
                  error?: string;
                };
                if (!res.ok) {
                  setHubspotStatus({
                    kind: "error",
                    message: data.error ?? data.errors?.[0] ?? "Sync failed",
                  });
                  return;
                }
                if (data.errors?.length) {
                  setHubspotStatus({ kind: "error", message: data.errors[0]! });
                  return;
                }
                const parts = [`Synced ${data.synced ?? 0} contact(s)`];
                if (data.skipped) parts.push(`${data.skipped} skipped`);
                setHubspotStatus({ kind: "success", message: parts.join(" · ") });
              } catch {
                setHubspotStatus({ kind: "error", message: "Sync failed" });
              } finally {
                setHubspotBusy(false);
              }
            }}
          >
            {hubspotBusy ? "Syncing…" : "Push to HubSpot"}
          </button>
          <button
            className="min-h-11 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 touch-manipulation"
            onClick={() => {
              const csv = leadsToHubSpotContactsCsv(store.leads);
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "itai-leads-hubspot-import.csv";
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {contacts.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <label className="flex min-w-[12rem] flex-1 items-center gap-2">
            <span className="shrink-0 text-sm font-semibold text-slate-500">Search</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name or email"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </label>
          <span className="text-sm font-semibold text-slate-500">Sort</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ContactSort)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-base text-slate-900"
          >
            <option value="recent">Last seen</option>
            <option value="lifecycle">Lifecycle (closest to close)</option>
          </select>
          {searchQuery.trim() ? (
            <span className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{visibleContacts.length}</span>{" "}
              of {contacts.length}
            </span>
          ) : null}
        </div>
      ) : null}

      {hubspotStatus ? (
        <StatusBanner kind={hubspotStatus.kind}>{hubspotStatus.message}</StatusBanner>
      ) : null}

      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
          No contacts yet.
        </div>
      ) : visibleContacts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
          No contacts match your search.
        </div>
      ) : (
        <div className="space-y-2">
          {visibleContacts.map(({ c }) => {
            const encs = encountersByContact.byContact.get(c.id) ?? [];
            const confIds = distinctConferenceIds(encs);
            const nudge = primaryContactNudge(buildContactNudges(c, encs));
            return (
              <ContactListRow
                key={c.id}
                contact={c}
                encounters={encs}
                lifecycleStage={resolveContactLifecycle(c, store.encounters)}
                icpEstimate={resolveContactIcp(c, store.encounters)}
                encounterCount={encountersByContact.counts.get(c.id) ?? 0}
                company={c.canonicalCompany}
                conferenceTrail={
                  confIds.length >= 2
                    ? formatConferenceTrail(confIds, 2)
                    : undefined
                }
                nudge={nudge}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
