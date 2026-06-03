"use client";

import { useEffect, useState } from "react";
import { IntegrationSecretField } from "@/components/IntegrationSecretField";
import {
  hasGeminiApiKey,
  hasHubSpotToken,
  saveGeminiApiKey,
  saveHubSpotToken,
} from "@/lib/integrationSettings";
import {
  formatTeamMembersText,
  loadTeamMembers,
  parseTeamMembersText,
  saveTeamMembers,
} from "@/lib/teamSettings";

const SAVED_DISMISS_MS = 4000;

function useSavedBanner(
  saved: boolean,
  setSaved: (value: boolean) => void,
) {
  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), SAVED_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [saved, setSaved]);
}

export default function SettingsPage() {
  const [hubspotDraft, setHubspotDraft] = useState("");
  const [hubspotConfigured, setHubspotConfigured] = useState(false);
  const [hubspotSaved, setHubspotSaved] = useState(false);

  const [geminiDraft, setGeminiDraft] = useState("");
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [geminiSaved, setGeminiSaved] = useState(false);

  const [teamText, setTeamText] = useState(() =>
    formatTeamMembersText(loadTeamMembers()),
  );
  const [teamSaved, setTeamSaved] = useState(false);

  useEffect(() => {
    setHubspotConfigured(hasHubSpotToken());
    setGeminiConfigured(hasGeminiApiKey());
  }, []);

  useSavedBanner(teamSaved, setTeamSaved);
  useSavedBanner(hubspotSaved, setHubspotSaved);
  useSavedBanner(geminiSaved, setGeminiSaved);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">Settings</h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Team members</div>
        <textarea
          value={teamText}
          onChange={(e) => {
            setTeamText(e.target.value);
            setTeamSaved(false);
          }}
          rows={5}
          placeholder=""
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        />
        <button
          type="button"
          className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          onClick={() => {
            saveTeamMembers(parseTeamMembersText(teamText));
            setTeamText(formatTeamMembersText(parseTeamMembersText(teamText)));
            setTeamSaved(true);
          }}
        >
          Save
        </button>
        {teamSaved ? (
          <div className="mt-2 text-xs font-medium text-emerald-700">Saved.</div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">HubSpot</div>
        <IntegrationSecretField
          label="Private app token"
          configured={hubspotConfigured}
          value={hubspotDraft}
          onChange={(v) => {
            setHubspotDraft(v);
            setHubspotSaved(false);
          }}
          onSave={() => {
            saveHubSpotToken(hubspotDraft);
            setHubspotDraft("");
            setHubspotConfigured(hasHubSpotToken());
            setHubspotSaved(true);
          }}
          onClear={() => {
            saveHubSpotToken("");
            setHubspotDraft("");
            setHubspotConfigured(false);
            setHubspotSaved(false);
          }}
          saved={hubspotSaved}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Google Gemini</div>
        <IntegrationSecretField
          label="API key"
          configured={geminiConfigured}
          value={geminiDraft}
          onChange={(v) => {
            setGeminiDraft(v);
            setGeminiSaved(false);
          }}
          onSave={() => {
            saveGeminiApiKey(geminiDraft);
            setGeminiDraft("");
            setGeminiConfigured(hasGeminiApiKey());
            setGeminiSaved(true);
          }}
          onClear={() => {
            saveGeminiApiKey("");
            setGeminiDraft("");
            setGeminiConfigured(false);
            setGeminiSaved(false);
          }}
          saved={geminiSaved}
        />
      </div>
    </div>
  );
}
