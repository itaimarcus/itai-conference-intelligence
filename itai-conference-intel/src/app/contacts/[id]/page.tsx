"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SettingsHint, StatusBanner } from "@/components/SettingsHint";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ContactCard } from "@/components/ContactCard";
import type { Contact } from "@/lib/clientStore";
import { deleteContact, type Encounter, type Lead } from "@/lib/clientStore";
import { useContactSummarize } from "@/lib/useContactSummarize";
import { useHydratedStore } from "@/lib/useHydratedStore";
import { useTeamMembers } from "@/lib/teamSettings";

function ContactDetailBody({
  contact,
  contactEncounters,
  leads,
  teamMembers,
}: {
  contact: Contact;
  contactEncounters: Encounter[];
  leads: Lead[];
  teamMembers: string[];
}) {
  const router = useRouter();
  const lastEncounter = useMemo(
    () =>
      [...contactEncounters].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      )[0],
    [contactEncounters],
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const {
    summary,
    isLoading: isSummaryLoading,
    error: summaryError,
    settingsError,
    summarize,
  } = useContactSummarize(contact, contactEncounters);

  return (
    <>
      <ContactCard
        contact={contact}
        encounters={contactEncounters}
        leads={leads}
        teamMembers={teamMembers}
        encounterCount={contactEncounters.length}
        lastEncounter={lastEncounter}
        relationshipSummary={summary}
        summaryError={summaryError}
        isSummaryLoading={isSummaryLoading}
        onDelete={() => setDeleteModalOpen(true)}
        onSummarize={() => void summarize()}
      />

      <ConfirmModal
        open={deleteModalOpen}
        title={`Delete ${contact.canonicalName}?`}
        description="This removes the contact and all encounters permanently. This cannot be undone."
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          deleteContact(contact.id);
          setDeleteModalOpen(false);
          router.push("/contacts");
        }}
      />

      {settingsError === "gemini" ? (
        <StatusBanner kind="error">
          <SettingsHint item="Gemini API key" />
        </StatusBanner>
      ) : null}
    </>
  );
}

export default function ContactDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const store = useHydratedStore();
  const teamMembers = useTeamMembers();

  const contact = store.contacts.find((c) => c.id === id);
  const contactEncounters = useMemo(
    () => store.encounters.filter((e) => e.contactId === id),
    [store.encounters, id],
  );

  if (!contact) {
    return (
      <div className="space-y-4">
        <Link
          href="/contacts"
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >
          ← Contacts
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
          Contact not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/contacts"
        className="inline-block text-sm font-semibold text-emerald-700 hover:underline"
      >
        ← Contacts
      </Link>

      <ContactDetailBody
        contact={contact}
        contactEncounters={contactEncounters}
        leads={store.leads}
        teamMembers={teamMembers}
      />
    </div>
  );
}
