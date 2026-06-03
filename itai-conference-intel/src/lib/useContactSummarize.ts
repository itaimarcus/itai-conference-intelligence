"use client";

import { useCallback, useState } from "react";
import type { Contact, Encounter } from "./clientStore";
import { updateContact } from "./clientStore";
import {
  summarizeContactRelationship,
  truncateRelationshipSummary,
} from "./aiSummarize";
import { loadGeminiApiKey } from "./integrationSettings";

export function useContactSummarize(contact: Contact, encounters: Encounter[]) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [settingsError, setSettingsError] = useState<"gemini" | undefined>();

  const summarize = useCallback(async () => {
    if (encounters.length === 0) {
      setError("Add at least one encounter to summarize.");
      setSettingsError(undefined);
      return;
    }
    const apiKey = loadGeminiApiKey();
    if (!apiKey) {
      setSettingsError("gemini");
      setError(undefined);
      return;
    }
    setSettingsError(undefined);
    setError(undefined);
    setIsLoading(true);
    try {
      const result = await summarizeContactRelationship(
        apiKey,
        contact,
        encounters,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.summary) {
        updateContact(contact.id, {
          relationshipSummary: truncateRelationshipSummary(result.summary),
          relationshipSummaryAt: new Date().toISOString(),
        });
      }
    } catch {
      setError("Failed to generate summary.");
    } finally {
      setIsLoading(false);
    }
  }, [contact, encounters]);

  return {
    summary: contact.relationshipSummary,
    isLoading,
    error,
    settingsError,
    summarize,
  };
}
